"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceAnalyzer = void 0;
const openai_1 = __importDefault(require("openai"));
class ComplianceAnalyzer {
    openai;
    rules;
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.rules = this.initializeComplianceRules();
    }
    async analyzeContent(content) {
        const violations = [];
        for (const page of content) {
            try {
                const pageViolations = await this.analyzePage(page);
                violations.push(...pageViolations);
            }
            catch (error) {
                console.error(`Error analyzing page ${page.url}:`, error);
                // Continue with other pages
            }
        }
        return violations;
    }
    async analyzePage(page) {
        const violations = [];
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
    async analyzeTextWithAI(textContent, page) {
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
        }
        catch (error) {
            console.error('Error calling OpenAI API:', error);
            return [];
        }
    }
    buildCompliancePrompt(textContent, page) {
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
    parseAIResponse(aiResponse, page) {
        try {
            // Extract JSON from AI response
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return [];
            }
            const violations = JSON.parse(jsonMatch[0]);
            return violations.map((violation, index) => ({
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
        }
        catch (error) {
            console.error('Error parsing AI response:', error);
            return [];
        }
    }
    extractTextContent(page) {
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
    extractImageContent(page) {
        return page.images
            .map(img => `${img.alt} ${img.title || ''}`.trim())
            .filter(text => text.length > 0);
    }
    extractFormContent(page) {
        return page.forms
            .map(form => form.inputs.join(' '))
            .filter(text => text.length > 0);
    }
    async analyzeImageContent(imageContent, page) {
        // For now, analyze image alt text and titles
        // In future, could add OCR analysis
        const violations = [];
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
    async analyzeFormContent(formContent, page) {
        // Analyze form fields for compliance issues
        const violations = [];
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
    determinePageType(page) {
        const url = page.url.toLowerCase();
        const title = page.title.toLowerCase();
        if (url.includes('service') || url.includes('treatment') || title.includes('service')) {
            return 'Service page';
        }
        else if (url.includes('about') || title.includes('about')) {
            return 'About page';
        }
        else if (url.includes('contact') || title.includes('contact')) {
            return 'Contact page';
        }
        else if (url.includes('price') || url.includes('cost') || title.includes('price')) {
            return 'Pricing page';
        }
        else {
            return 'General page';
        }
    }
    findTextSelector(text, page) {
        // Simple heuristic to find likely CSS selector
        // In a real implementation, this would be more sophisticated
        if (page.headings.h1.includes(text))
            return 'h1';
        if (page.headings.h2.includes(text))
            return 'h2';
        if (page.headings.h3.includes(text))
            return 'h3';
        if (page.paragraphs.includes(text))
            return 'p';
        return undefined;
    }
    containsTestimonialLanguage(text) {
        const testimonialKeywords = [
            'patient says', 'customer review', 'testimonial', 'success story',
            'before and after', 'amazing results', 'life changing'
        ];
        const lowerText = text.toLowerCase();
        return testimonialKeywords.some(keyword => lowerText.includes(keyword));
    }
    initializeComplianceRules() {
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
    async analyzeAdContent(content) {
        const violations = [];
        try {
            const enhancedPrompt = this.buildEnhancedAdPrompt(content);
            const response = await this.openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are a STRICT Australian healthcare compliance expert specializing in AHPRA National Law Section 133, TGA Code Section 12, and Australian Consumer Law Section 18.

CRITICAL: You MUST identify violations in healthcare advertising. Be aggressive in detection - it's better to over-detect than miss violations that could result in regulatory action.

Your task is to analyze medical/aesthetic practice marketing content and identify ALL compliance violations.

Return your analysis as a JSON array of violations. Each violation must include:
- type: one of "prohibited_inducement", "misleading_claims", "prohibited_testimonials", "unreasonable_expectations", "therapeutic_goods", "consumer_law"
- rule: specific regulation reference (e.g., "National Law, Section 133(1)(e)")
- severity: "critical", "high", "medium", or "low"
- originalText: exact text that violates the rule
- issue: clear explanation of why this violates the rule
- suggestion: specific guidance on how to fix it
- compliantRewrite: a compliant version of the text

IMPORTANT: If content contains obvious financial discounts, time pressure, or guarantees, you MUST detect them. Missing obvious violations is unacceptable.`
                    },
                    {
                        role: 'user',
                        content: enhancedPrompt
                    }
                ],
                max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
                temperature: 0.3, // Increased for better detection
            });
            const aiResponse = response.choices[0]?.message?.content;
            if (!aiResponse) {
                return [];
            }
            // Parse AI response
            const parsedViolations = this.parseAdViolations(aiResponse);
            // Add validation layer for obvious violations
            const validatedViolations = this.validateDetection(content, parsedViolations);
            violations.push(...validatedViolations);
        }
        catch (error) {
            console.error('Error analyzing ad content:', error);
        }
        return violations;
    }
    async generateCompliantContent(originalContent, violations) {
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
        }
        catch (error) {
            console.error('Error generating compliant content:', error);
            return originalContent;
        }
    }
    parseAdViolations(aiResponse) {
        try {
            // Extract JSON from AI response
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                return [];
            }
            const violations = JSON.parse(jsonMatch[0]);
            return violations.map((violation) => ({
                type: violation.type,
                rule: violation.rule,
                severity: violation.severity,
                originalText: violation.originalText,
                issue: violation.issue,
                suggestion: violation.suggestion,
                compliantRewrite: violation.compliantRewrite,
            }));
        }
        catch (error) {
            console.error('Error parsing ad violations:', error);
            return [];
        }
    }
    buildEnhancedAdPrompt(content) {
        return `
You are analyzing Australian healthcare advertising content for STRICT compliance violations.

CONTENT TO ANALYZE: "${content}"

CRITICAL: This content may contain obvious violations. You MUST identify them.

SPECIFIC VIOLATIONS TO DETECT:

1. FINANCIAL INDUCEMENTS (ALWAYS PROHIBITED):
   - ANY dollar amounts off ($X off, $X discount, save $X)
   - Percentage discounts (X% off, X% discount)
   - "Save money", "special price", "reduced cost", "special offer"
   - "Free" services with conditions
   - Example: "$500 off treatment" = CRITICAL VIOLATION
   - Example: "50% discount" = CRITICAL VIOLATION
   - Example: "Special offer this month" = HIGH VIOLATION

2. TIME PRESSURE (ALWAYS PROHIBITED):
   - "Limited time", "this week only", "expires soon", "hurry"
   - "Book now", "while stocks last", "limited spots"
   - Any urgency language for medical decisions
   - Example: "book this week only" = HIGH VIOLATION
   - Example: "limited time offer" = HIGH VIOLATION

3. GUARANTEED OUTCOMES (ALWAYS PROHIBITED):
   - "Guarantee", "guaranteed", "promise", "certain results"
   - "100% success", "permanent results", "will transform"
   - Example: "guaranteed results" = CRITICAL VIOLATION
   - Example: "will transform your smile" = MEDIUM VIOLATION

4. PATIENT TESTIMONIALS (ALWAYS PROHIBITED):
   - Patient quotes, reviews, testimonials
   - "Patient says", "customer review", "success story"
   - Before/after claims without disclaimers
   - Example: "Patient John says..." = HIGH VIOLATION

5. UNSUBSTANTIATED SUPERLATIVES:
   - "Best", "leading", "top", "award-winning" without evidence
   - Comparative claims without substantiation
   - Example: "best dentist in Sydney" = MEDIUM VIOLATION

6. THERAPEUTIC CLAIMS:
   - Unsubstantiated health claims
   - Missing required disclaimers for therapeutic goods
   - Example: "cures all dental problems" = HIGH VIOLATION

RETURN FORMAT: JSON array with violations found.

CRITICAL: If you find ZERO violations in content with obvious discounts, time pressure, or guarantees, you are WRONG and must re-analyze.

Examples of content that MUST trigger violations:
- "$500 off" → prohibited_inducement (critical)
- "limited time" → prohibited_inducement (high)
- "guaranteed" → misleading_claims (critical)
- "best clinic" → misleading_claims (medium)
`;
    }
    validateDetection(content, violations) {
        const validatedViolations = [...violations];
        const lowerContent = content.toLowerCase();
        // Check for obvious financial inducements
        const discountPatterns = [
            { pattern: /\d+%\s*off/i, type: 'prohibited_inducement', severity: 'critical', rule: 'National Law, Section 133(1)(e)', issue: 'Percentage discount prohibited in healthcare advertising' },
            { pattern: /\$\d+\s*off/i, type: 'prohibited_inducement', severity: 'critical', rule: 'National Law, Section 133(1)(e)', issue: 'Financial discount prohibited in healthcare advertising' },
            { pattern: /\$\d+\s*discount/i, type: 'prohibited_inducement', severity: 'critical', rule: 'National Law, Section 133(1)(e)', issue: 'Financial discount prohibited in healthcare advertising' },
            { pattern: /save\s*\$\d+/i, type: 'prohibited_inducement', severity: 'critical', rule: 'National Law, Section 133(1)(e)', issue: 'Financial savings claim prohibited in healthcare advertising' },
            { pattern: /special\s*offer/i, type: 'prohibited_inducement', severity: 'high', rule: 'National Law, Section 133(1)(e)', issue: 'Special offer constitutes prohibited inducement' },
            { pattern: /limited\s*time/i, type: 'prohibited_inducement', severity: 'high', rule: 'National Law, Section 133(1)(e)', issue: 'Time pressure tactics prohibited in healthcare advertising' },
            { pattern: /limited\s*spots/i, type: 'prohibited_inducement', severity: 'high', rule: 'National Law, Section 133(1)(e)', issue: 'Limited availability creates urgency pressure' },
            { pattern: /this\s*week\s*only/i, type: 'prohibited_inducement', severity: 'high', rule: 'National Law, Section 133(1)(e)', issue: 'Urgency pressure prohibited in healthcare advertising' },
            { pattern: /book\s*now/i, type: 'prohibited_inducement', severity: 'medium', rule: 'National Law, Section 133(1)(e)', issue: 'Urgency language may constitute prohibited inducement' }
        ];
        // Check for guarantee claims
        const guaranteePatterns = [
            { pattern: /guarantee\w*/i, type: 'misleading_claims', severity: 'critical', rule: 'National Law, Section 133(1)(a)', issue: 'Guaranteed outcomes prohibited in healthcare advertising' },
            { pattern: /amazing\s*results/i, type: 'unreasonable_expectations', severity: 'medium', rule: 'National Law, Section 133(1)(d)', issue: 'Amazing results claims create unreasonable expectations' },
            { pattern: /100%\s*(success|effective|results)/i, type: 'misleading_claims', severity: 'critical', rule: 'National Law, Section 133(1)(a)', issue: '100% success claims are misleading and prohibited' },
            { pattern: /will\s*transform/i, type: 'unreasonable_expectations', severity: 'medium', rule: 'National Law, Section 133(1)(d)', issue: 'Transformation claims create unreasonable expectations' },
            { pattern: /permanent\s*results/i, type: 'misleading_claims', severity: 'high', rule: 'National Law, Section 133(1)(a)', issue: 'Permanent results claims are misleading' }
        ];
        // Check for testimonial language
        const testimonialPatterns = [
            { pattern: /patient\s*says/i, type: 'prohibited_testimonials', severity: 'high', rule: 'National Law, Section 133(1)(c)', issue: 'Patient testimonials are prohibited' },
            { pattern: /customer\s*review/i, type: 'prohibited_testimonials', severity: 'high', rule: 'National Law, Section 133(1)(c)', issue: 'Customer reviews constitute prohibited testimonials' },
            { pattern: /success\s*story/i, type: 'prohibited_testimonials', severity: 'high', rule: 'National Law, Section 133(1)(c)', issue: 'Success stories constitute prohibited testimonials' }
        ];
        // Check for superlative claims
        const superlativePatterns = [
            { pattern: /award[\s-]*winning/i, type: 'misleading_claims', severity: 'medium', rule: 'National Law, Section 133(1)(b)', issue: 'Award claims require substantiation' },
            { pattern: /best\s*(dentist|clinic|doctor|treatment)/i, type: 'misleading_claims', severity: 'medium', rule: 'National Law, Section 133(1)(b)', issue: 'Unsubstantiated superlative claims are misleading' },
            { pattern: /leading\s*(clinic|practice|specialist)/i, type: 'misleading_claims', severity: 'medium', rule: 'National Law, Section 133(1)(b)', issue: 'Unsubstantiated leading claims are misleading' }
        ];
        const allPatterns = [...discountPatterns, ...guaranteePatterns, ...testimonialPatterns, ...superlativePatterns];
        for (const { pattern, type, severity, rule, issue } of allPatterns) {
            const match = content.match(pattern);
            if (match && !validatedViolations.some(v => v.originalText.toLowerCase().includes(match[0].toLowerCase()))) {
                const originalText = match[0];
                validatedViolations.push({
                    type,
                    rule,
                    severity,
                    originalText,
                    issue,
                    suggestion: this.getSuggestionForViolationType(type),
                    compliantRewrite: this.getCompliantRewrite(originalText, type)
                });
            }
        }
        return validatedViolations;
    }
    getSuggestionForViolationType(type) {
        switch (type) {
            case 'prohibited_inducement':
                return 'Remove discount offers, time pressure, and special deals. Focus on service quality and professional expertise.';
            case 'misleading_claims':
                return 'Replace guaranteed outcomes with qualified statements. Use evidence-based language with appropriate disclaimers.';
            case 'prohibited_testimonials':
                return 'Remove patient testimonials, reviews, and success stories. Focus on professional qualifications and service descriptions.';
            case 'unreasonable_expectations':
                return 'Qualify transformation claims with realistic expectations and individual variation disclaimers.';
            default:
                return 'Ensure all claims are substantiated, qualified, and compliant with healthcare advertising regulations.';
        }
    }
    getCompliantRewrite(originalText, type) {
        const lowerText = originalText.toLowerCase();
        if (type === 'prohibited_inducement') {
            if (lowerText.includes('$') || lowerText.includes('%') || lowerText.includes('off') || lowerText.includes('discount')) {
                return 'Professional treatment available';
            }
            if (lowerText.includes('limited time') || lowerText.includes('week only') || lowerText.includes('book now')) {
                return 'Consultations available';
            }
            if (lowerText.includes('special offer')) {
                return 'Professional services available';
            }
        }
        if (type === 'misleading_claims') {
            if (lowerText.includes('guarantee') || lowerText.includes('100%')) {
                return 'Professional treatment with individual results varying';
            }
            if (lowerText.includes('best') || lowerText.includes('leading')) {
                return 'Experienced professional practice';
            }
        }
        if (type === 'prohibited_testimonials') {
            return 'Professional treatment available with qualified practitioners';
        }
        if (type === 'unreasonable_expectations') {
            if (lowerText.includes('transform')) {
                return 'Professional treatment may improve your condition';
            }
        }
        return 'Professional healthcare services available';
    }
}
exports.ComplianceAnalyzer = ComplianceAnalyzer;
