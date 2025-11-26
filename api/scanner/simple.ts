import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as cheerio from 'cheerio';

const startScanSchema = z.object({
  url: z.string().url(),
});

// In-memory storage for demo
const scans = new Map();

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
    console.log('📥 Received simple scan request:', req.body);
    
    const { url } = startScanSchema.parse(req.body);
    const scanId = uuidv4();
    
    console.log(`🚀 Starting simple scan for: ${url}`);
    
    // Create scan record
    scans.set(scanId, {
      id: scanId,
      url,
      status: 'processing',
      created_at: new Date().toISOString(),
      violations_found: 0,
      pages_scanned: 0
    });

    // Simple web scraping without external dependencies
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MediGuard-AI-Scanner/2.0 (+https://mediguard.ai)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
        maxRedirects: 3,
        validateStatus: (status) => status < 400,
      });

      const $ = cheerio.load(response.data);
      
      // Extract basic content
      const title = $('title').text().trim() || 'Untitled';
      const content = $('body').text().trim().substring(0, 1000);
      
      // Simple compliance check (without AI)
      const violations: Array<{
        type: string;
        severity: string;
        description: string;
        location: string;
      }> = [];
      const contentLower = content.toLowerCase();
      
      // Basic keyword-based violations
      if (contentLower.includes('guaranteed') || contentLower.includes('100% success')) {
        violations.push({
          type: 'misleading_claims',
          severity: 'high',
          description: 'Contains potentially misleading guarantee claims',
          location: 'page content'
        });
      }
      
      if (contentLower.includes('cheapest') || contentLower.includes('best price')) {
        violations.push({
          type: 'comparative_advertising',
          severity: 'medium',
          description: 'Contains comparative pricing claims',
          location: 'page content'
        });
      }

      // Update scan with results
      scans.set(scanId, {
        id: scanId,
        url,
        status: 'completed',
        created_at: new Date().toISOString(),
        violations_found: violations.length,
        pages_scanned: 1,
        scan_results: JSON.stringify(violations),
        content_extracted: JSON.stringify({
          title,
          contentLength: content.length
        })
      });

      console.log(`✅ Simple scan completed: ${violations.length} violations found`);

      return res.status(200).json({
        scanId,
        status: 'completed',
        violationsFound: violations.length,
        pagesScanned: 1,
        message: 'Simple scan completed successfully'
      });

    } catch (scanError) {
      console.error('Simple scan failed:', scanError);
      
      // Update scan with error
      scans.set(scanId, {
        id: scanId,
        url,
        status: 'failed',
        created_at: new Date().toISOString(),
        error: scanError instanceof Error ? scanError.message : 'Unknown error'
      });

      return res.status(500).json({
        scanId,
        status: 'failed',
        error: 'Scan failed',
        message: scanError instanceof Error ? scanError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('Request processing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        details: error.errors
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Export scans for other API routes
export { scans };