import OpenAI from 'openai';
import { WebsiteContent, ComplianceViolation, ComplianceRule, ComplianceIssue } from '../../shared/types';

export class ComplianceAnalyzer {
  private openai: OpenAI;
  private rules: ComplianceRule[];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.rules = this.initializeComplianceRules();
  }

  async analyzeContent(content: WebsiteContent[]): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    for (const page of content) {
      try {
        const pageViolations = await this.analyzePage(page);
        violations.push(...pageViolations);
      } catch (error) {
        console.error(`Error analyzing page ${page.url}:`, error);
        // Continue with other pages
      }
    }

    return violations;
  }

  private async analyzePage(page: WebsiteContent): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    // Analyze different content types
    const textContent = this.extractTextContent(page);
    const imageContent = this.extractImageContent(page);
    const formContent = this.extractFormContent(page);

    // Analyze text content with AI
    if (textContent.length > 0) {
      const textViolations = await this.analyzeTextWithAI(textContent, page);
      violations.push(...textViolations);
    }

    // Analyze images for compliance issues
    if (imageContent.length > 0) {
      const imageViolations = await this.analyzeImageContent(imageContent, page);
      violations.push(...imageViolations);
    }

    // Analyze forms for compliance issues
    if (formContent.length > 0) {
      const formViolations = await this.analyzeFormContent(formContent, page);
      violations.push(...formViolations);
    }

    return violations;
  }

  private async analyzeTextWithAI(textContent: string, page: WebsiteContent): Promise<ComplianceViolation[]> {
    const prompt = this.buildCompliancePrompt(textContent, page);

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Australian healthcare compliance, specifically AHPRA National Law Section 133, TGA Code Section 12, and Australian Consumer Law Section 18. 

Your task is to analyze medical/aesthetic practice website content and identify compliance violations. You must be precise and only flag actual violations, not potential issues.

Return your analysis as a JSON array of violations. Each violation must include:
- type: one of "prohibited_inducement", "misleading_claims", "prohibited_testimonials", "unreasonable_expectations", "therapeutic_goods", "consumer_law"
- rule: specific regulation reference (e.g., "National Law, Section 133(1)(e)")
- severity: "critical", "high", "medium", or "low"
- originalText: exact text that violates the rule
- issue: clear explanation of why this violates the rule
- suggestion: specific guidance on how to fix it
- compliantRewrite: a compliant version of the text

Only return violations that clearly breach the regulations. Be conservative - it's better to miss a minor issue than create false positives.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: 0.1, // Low temperature for consistent, factual analysis
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        return [];
      }

      // Parse AI response
      const violations = this.parseAIResponse(aiResponse, page);
      return violations;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return [];
    }
  }

  private buildCompliancePrompt(textContent: string, page: WebsiteContent): string {
    return `
Analyze this Australian medical/aesthetic practice website content for AHPRA compliance violations:

PAGE URL: ${page.url}
PAGE TITLE: ${page.title}
PAGE TYPE: ${this.determinePageType(page)}

CONTENT TO ANALYZE:
${textContent}

CONTEXT:
- This is content from a medical/aesthetic practice website
- Must comply with AHPRA National Law Section 133
- Must comply with TGA Code Section 12
- Must comply with Australian Consumer Law Section 18

SPECIFIC VIOLATIONS TO CHECK:

1. PROHIBITED INDUCEMENTS (Section 133(1)(e)):
   - Discounts, special offers, gifts
   - Time-limited offers for surgical procedures
   - "Free" services with conditions
   - Competitive pricing claims

2. MISLEADING/DECEPTIVE CLAIMS (Section 133(1)(a) & (b)):
   - Guaranteed outcomes
   - Unsubstantiated superlatives ("best", "leading")
   - Comparative claims without evidence
   - False or misleading statements

3. PROHIBITED TESTIMONIALS (Section 133(1)(c)):
   - Patient testimonials or quotes
   - Before/after claims without disclaimers
   - Success stories or case studies

4. UNREASONABLE EXPECTATIONS (Section 133(1)(d)):
   - Claims creating unreasonable expectations
   - Permanent or guaranteed results
   - Exaggerated outcome claims

5. THERAPEUTIC GOODS (TGA Code Section 12):
   - Unsubstantiated therapeutic claims
   - Missing required disclaimers
   - Restricted therapeutic language

6. CONSUMER LAW (ACL Section 18):
   - Misleading pricing
   - False availability claims
   - Deceptive conduct

Return only clear violations as JSON array. Be precise and conservative.
`;
  }

  private parseAIResponse(aiResponse: string, page: WebsiteContent): ComplianceViolation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const violations = JSON.parse(jsonMatch[0]);
      
      return violations.map((violation: any, index: number) => ({
        id: `${page.url}-${index}-${Date.now()}`,
        type: violation.type,
        rule: violation.rule,
        severity: violation.severity,
        pageUrl: page.url,
        pageTitle: page.title,
        originalText: violation.originalText,
        context: this.determinePageType(page),
        issue: violation.issue,
        suggestion: violation.suggestion,
        compliantRewrite: violation.compliantRewrite,
        location: {
          selector: this.findTextSelector(violation.originalText, page),
        },
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  private extractTextContent(page: WebsiteContent): string {
    const content = [
      page.title,
      page.metaDescription,
      ...page.headings.h1,
      ...page.headings.h2,
      ...page.headings.h3,
      ...page.paragraphs,
      ...page.links.map(link => link.text),
    ].filter(text => text && text.trim().length > 0);

    return content.join('\n\n');
  }

  private extractImageContent(page: WebsiteContent): string[] {
    return page.images
      .map(img => `${img.alt} ${img.title || ''}`.trim())
      .filter(text => text.length > 0);
  }

  private extractFormContent(page: WebsiteContent): string[] {
    return page.forms
      .map(form => form.inputs.join(' '))
      .filter(text => text.length > 0);
  }

  private async analyzeImageContent(imageContent: string[], page: WebsiteContent): Promise<ComplianceViolation[]> {
    // For now, analyze image alt text and titles
    // In future, could add OCR analysis
    const violations: ComplianceViolation[] = [];
    
    for (const text of imageContent) {
      if (this.containsTestimonialLanguage(text)) {
        violations.push({
          id: `${page.url}-img-${Date.now()}`,
          type: 'prohibited_testimonials',
          rule: 'National Law, Section 133(1)(c)',
          severity: 'high',
          pageUrl: page.url,
          pageTitle: page.title,
          originalText: text,
          context: 'Image alt text or title',
          issue: 'Image appears to contain testimonial content',
          suggestion: 'Remove testimonial language from image descriptions',
          compliantRewrite: 'Professional service image',
          location: {},
        });
      }
    }

    return violations;
  }

  private async analyzeFormContent(formContent: string[], page: WebsiteContent): Promise<ComplianceViolation[]> {
    // Analyze form fields for compliance issues
    const violations: ComplianceViolation[] = [];
    
    for (const content of formContent) {
      if (content.toLowerCase().includes('guarantee') || content.toLowerCase().includes('promise')) {
        violations.push({
          id: `${page.url}-form-${Date.now()}`,
          type: 'misleading_claims',
          rule: 'National Law, Section 133(1)(a)',
          severity: 'medium',
          pageUrl: page.url,
          pageTitle: page.title,
          originalText: content,
          context: 'Form field',
          issue: 'Form contains guarantee language',
          suggestion: 'Remove guarantee language from form fields',
          compliantRewrite: 'Professional consultation available',
          location: {},
        });
      }
    }

    return violations;
  }

  private determinePageType(page: WebsiteContent): string {
    const url = page.url.toLowerCase();
    const title = page.title.toLowerCase();
    
    if (url.includes('service') || url.includes('treatment') || title.includes('service')) {
      return 'Service page';
    } else if (url.includes('about') || title.includes('about')) {
      return 'About page';
    } else if (url.includes('contact') || title.includes('contact')) {
      return 'Contact page';
    } else if (url.includes('price') || url.includes('cost') || title.includes('price')) {
      return 'Pricing page';
    } else {
      return 'General page';
    }
  }

  private findTextSelector(text: string, page: WebsiteContent): string | undefined {
    // Simple heuristic to find likely CSS selector
    // In a real implementation, this would be more sophisticated
    if (page.headings.h1.includes(text)) return 'h1';
    if (page.headings.h2.includes(text)) return 'h2';
    if (page.headings.h3.includes(text)) return 'h3';
    if (page.paragraphs.includes(text)) return 'p';
    return undefined;
  }

  private containsTestimonialLanguage(text: string): boolean {
    const testimonialKeywords = [
      'patient says', 'customer review', 'testimonial', 'success story',
      'before and after', 'amazing results', 'life changing'
    ];
    
    const lowerText = text.toLowerCase();
    return testimonialKeywords.some(keyword => lowerText.includes(keyword));
  }

  private initializeComplianceRules(): ComplianceRule[] {
    return [
      {
        id: 'prohibited_inducement_discount',
        category: 'inducement',
        regulation: 'AHPRA_133',
        severity: 'high',
        patterns: {
          keywords: ['discount', 'save', 'off', 'special offer', 'limited time'],
          phrases: ['$X off', '% off', 'save money', 'special price'],
          regex: ['/\\$\\d+\\s+off/i', '/\\d+%\\s+off/i'],
          contextual: ['surgical procedure', 'treatment', 'consultation'],
        },
        exemptions: ['educational content', 'general information'],
        suggestion: 'Remove discount offers and focus on service quality',
      },
      {
        id: 'misleading_guarantee',
        category: 'misleading',
        regulation: 'AHPRA_133',
        severity: 'critical',
        patterns: {
          keywords: ['guarantee', 'guaranteed', 'promise', 'certain'],
          phrases: ['guaranteed results', '100% success', 'promise you'],
          regex: ['/guarantee\\w*/i', '/100%/i'],
          contextual: ['results', 'outcome', 'success'],
        },
        exemptions: ['warranty information', 'service guarantee'],
        suggestion: 'Replace guarantees with qualified statements about potential outcomes',
      },
      // Add more rules as needed
    ];
  }

  // Additional methods for Ad Creator functionality
  async analyzeAdContent(content: string): Promise<ComplianceIssue[]> {
    const violations: ComplianceIssue[] = [];

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Australian healthcare compliance, specifically AHPRA National Law Section 133, TGA Code Section 12, and Australian Consumer Law Section 18.

Your task is to analyze medical/aesthetic practice marketing content and identify compliance violations. You must be precise and only flag actual violations.

Return your analysis as a JSON array of violations. Each violation must include:
- type: one of "prohibited_inducement", "misleading_claims", "prohibited_testimonials", "unreasonable_expectations", "therapeutic_goods", "consumer_law"
- rule: specific regulation reference (e.g., "National Law, Section 133(1)(e)")
- severity: "critical", "high", "medium", or "low"
- originalText: exact text that violates the rule
- issue: clear explanation of why this violates the rule
- suggestion: specific guidance on how to fix it
- compliantRewrite: a compliant version of the text

Only return violations that clearly breach the regulations. Be conservative.`
          },
          {
            role: 'user',
            content: `Analyze this Australian medical/aesthetic practice marketing content for AHPRA compliance violations:

CONTENT TO ANALYZE:
${content}

SPECIFIC VIOLATIONS TO CHECK:

1. PROHIBITED INDUCEMENTS (Section 133(1)(e)):
   - Discounts, special offers, gifts
   - Time-limited offers for surgical procedures
   - "Free" services with conditions
   - Competitive pricing claims

2. MISLEADING/DECEPTIVE CLAIMS (Section 133(1)(a) & (b)):
   - Guaranteed outcomes
   - Unsubstantiated superlatives ("best", "leading")
   - Comparative claims without evidence
   - False or misleading statements

3. PROHIBITED TESTIMONIALS (Section 133(1)(c)):
   - Patient testimonials or quotes
   - Before/after claims without disclaimers
   - Success stories or case studies

4. UNREASONABLE EXPECTATIONS (Section 133(1)(d)):
   - Claims creating unreasonable expectations
   - Permanent or guaranteed results
   - Exaggerated outcome claims

5. THERAPEUTIC GOODS (TGA Code Section 12):
   - Unsubstantiated therapeutic claims
   - Missing required disclaimers
   - Restricted therapeutic language

6. CONSUMER LAW (ACL Section 18):
   - Misleading pricing
   - False availability claims
   - Deceptive conduct

Return only clear violations as JSON array.`
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: 0.1,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        return [];
      }

      // Parse AI response
      const parsedViolations = this.parseAdViolations(aiResponse);
      violations.push(...parsedViolations);
    } catch (error) {
      console.error('Error analyzing ad content:', error);
    }

    return violations;
  }

  async generateCompliantContent(originalContent: string, violations: ComplianceIssue[]): Promise<string> {
    if (violations.length === 0) {
      return originalContent;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in Australian healthcare compliance. Your task is to rewrite marketing content to be fully compliant with AHPRA, TGA, and ACL regulations while maintaining the core message and professional tone.

Guidelines:
- Remove all prohibited inducements (discounts, special offers, time-limited deals)
- Replace guaranteed outcomes with qualified statements
- Remove testimonials and patient quotes
- Use professional, factual language
- Maintain the marketing intent while ensuring compliance
- Keep the content engaging but compliant`
          },
          {
            role: 'user',
            content: `Please rewrite this medical/aesthetic practice marketing content to be fully compliant with Australian healthcare regulations:

ORIGINAL CONTENT:
${originalContent}

VIOLATIONS FOUND:
${violations.map(v => `- ${v.type}: ${v.originalText} (${v.issue})`).join('\n')}

Please provide a compliant version that:
1. Removes all regulatory violations
2. Maintains professional marketing tone
3. Keeps the core message intact
4. Uses appropriate healthcare marketing language

Return only the rewritten compliant content, no explanations.`
          }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: 0.3,
      });

      const compliantContent = response.choices[0]?.message?.content;
      return compliantContent || originalContent;
    } catch (error) {
      console.error('Error generating compliant content:', error);
      return originalContent;
    }
  }

  private parseAdViolations(aiResponse: string): ComplianceIssue[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const violations = JSON.parse(jsonMatch[0]);
      
      return violations.map((violation: any) => ({
        type: violation.type,
        rule: violation.rule,
        severity: violation.severity,
        originalText: violation.originalText,
        issue: violation.issue,
        suggestion: violation.suggestion,
        compliantRewrite: violation.compliantRewrite,
      }));
    } catch (error) {
      console.error('Error parsing ad violations:', error);
      return [];
    }
  }
}