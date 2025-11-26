import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { ComplianceAnalyzer } from '../lib/complianceAnalyzer';

const analyzeAdSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  generateCompliant: z.boolean().optional().default(false),
});

let complianceAnalyzer: ComplianceAnalyzer | null = null;

// Initialize ComplianceAnalyzer with error handling
try {
  if (process.env.OPENAI_API_KEY) {
    complianceAnalyzer = new ComplianceAnalyzer();
    console.log('✅ ComplianceAnalyzer initialized successfully');
  } else {
    console.warn('⚠️ OPENAI_API_KEY not found, compliance analysis will be limited');
  }
} catch (error) {
  console.error('❌ Failed to initialize ComplianceAnalyzer:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Received ad analysis request:', req.body);
    
    const { content, generateCompliant } = analyzeAdSchema.parse(req.body);
    
    console.log(`🔍 Analyzing ad content: "${content.substring(0, 100)}..."`);
    
    if (!complianceAnalyzer) {
      return res.status(500).json({
        error: 'Compliance analyzer not available',
        message: 'OpenAI API key not configured or analyzer initialization failed'
      });
    }

    // Analyze the ad content for violations
    const violations = await complianceAnalyzer.analyzeAdContent(content);
    
    console.log(`✅ Analysis complete: ${violations.length} violations found`);

    // Calculate summary statistics
    const summary = {
      totalViolations: violations.length,
      criticalViolations: violations.filter(v => v.severity === 'critical').length,
      highViolations: violations.filter(v => v.severity === 'high').length,
      mediumViolations: violations.filter(v => v.severity === 'medium').length,
      lowViolations: violations.filter(v => v.severity === 'low').length,
    };

    let compliantContent: string | null = null;
    
    // Generate compliant version if requested and violations exist
    if (generateCompliant && violations.length > 0) {
      console.log('🔄 Generating compliant version...');
      compliantContent = await complianceAnalyzer.generateCompliantContent(content, violations);
      console.log('✅ Compliant version generated');
    }

    return res.status(200).json({
      originalContent: content,
      violations,
      summary,
      isCompliant: violations.length === 0,
      compliantContent,
      message: violations.length === 0 
        ? 'No compliance violations detected!' 
        : `${violations.length} potential compliance issue${violations.length === 1 ? '' : 's'} found.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Ad analysis error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}