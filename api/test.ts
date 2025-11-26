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
    const envCheck = {
      nodeEnv: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      message: 'Test endpoint working',
      environment: envCheck,
      method: req.method,
      url: req.url
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}