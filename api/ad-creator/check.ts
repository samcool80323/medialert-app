import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { ComplianceAnalyzer } from '../../src/server/services/complianceAnalyzer';

const checkAdSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  title: z.string().optional(),
});

const complianceAnalyzer = new ComplianceAnalyzer();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, title } = checkAdSchema.parse(req.body);
    
    console.log('🔍 Analyzing ad content...');
    
    // Create WebsiteContent format for analysis
    const websiteContent = [{
      url: 'ad-creator://preview',
      title: title || 'Ad Content',
      metaDescription: '',
      headings: {
        h1: title ? [title] : [],
        h2: [],
        h3: []
      },
      paragraphs: [content],
      links: [],
      images: [],
      forms: [],
      scripts: []
    }];

    // Analyze the content
    const violations = await complianceAnalyzer.analyzeContent(websiteContent);
    
    console.log(`✅ Analysis complete: ${violations.length} violations found`);

    // Calculate summary statistics
    const summary = {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      mediumViolations: violations.filter(v => v.severity === 'medium').length,
      lowViolations: violations.filter(v => v.severity === 'low').length,
    };

    return res.status(200).json({
      violations,
      summary,
      isCompliant: violations.length === 0,
      message: violations.length === 0 
        ? 'No compliance violations detected!' 
        : `${violations.length} potential compliance issue${violations.length === 1 ? '' : 's'} found.`
    });

  } catch (error) {
    console.error('Ad analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}