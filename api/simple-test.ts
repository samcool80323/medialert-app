import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 SIMPLE TEST: Basic endpoint test');
    
    return res.status(200).json({
      message: 'Simple test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        userAgent: req.headers['user-agent'],
        contentType: req.headers['content-type']
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY
      }
    });

  } catch (error) {
    console.error('🚨 SIMPLE TEST: Failed:', error);
    
    return res.status(500).json({
      error: 'Simple test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}