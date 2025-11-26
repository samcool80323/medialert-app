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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📥 Received minimal scan request:', req.body);
    
    const { url } = req.body || {};
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a URL to scan'
      });
    }

    console.log(`🚀 Starting minimal scan for: ${url}`);
    
    // Simulate scan without any external dependencies
    const scanId = `scan_${Date.now()}`;
    
    // Mock scan results
    const mockViolations = [
      {
        type: 'test_violation',
        severity: 'medium',
        description: 'This is a test violation from the minimal scanner',
        location: 'mock location'
      }
    ];

    console.log(`✅ Minimal scan completed: ${mockViolations.length} violations found`);

    return res.status(200).json({
      scanId,
      status: 'completed',
      violationsFound: mockViolations.length,
      pagesScanned: 1,
      message: 'Minimal scan completed successfully',
      violations: mockViolations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Minimal scan error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      endpoint: 'minimal'
    });
  }
}