import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { serverlessWebScraper } from '../../src/server/services/webScraperServerless';
import { ComplianceAnalyzer } from '../../src/server/services/complianceAnalyzer';
import { ComplianceViolation } from '../../src/shared/types';

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

const startScanSchema = z.object({
  url: z.string().url(),
});

// In-memory storage for demo (replace with database in production)
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
    console.log('📥 Received scan request:', req.body);
    const { url } = startScanSchema.parse(req.body);
    const scanId = uuidv4();
    
    console.log(`🚀 Starting scan for: ${url}`);
    
    // Create scan record
    scans.set(scanId, {
      id: scanId,
      url,
      status: 'processing',
      created_at: new Date().toISOString(),
      violations_found: 0,
      pages_scanned: 0
    });

    // Start scanning process
    try {
      // Scan website
      const scanResult = await serverlessWebScraper.scanWebsite(url);
      
      // Convert pages to WebsiteContent format
      const websiteContent = scanResult.pages
        .filter(page => page.content && page.content.trim())
        .map(page => ({
          url: page.url,
          title: page.title,
          metaDescription: '',
          headings: {
            h1: [],
            h2: [],
            h3: []
          },
          paragraphs: [page.content],
          links: [],
          images: [],
          forms: [],
          scripts: []
        }));

      // Analyze compliance for all pages
      let allViolations: ComplianceViolation[] = [];
      if (complianceAnalyzer) {
        try {
          allViolations = await complianceAnalyzer.analyzeContent(websiteContent);
        } catch (error) {
          console.error('Compliance analysis failed:', error);
          // Continue without compliance analysis
        }
      } else {
        console.warn('Compliance analysis skipped - analyzer not available');
      }
      const totalPagesScanned = websiteContent.length;

      // Update scan with results
      scans.set(scanId, {
        id: scanId,
        url,
        status: 'completed',
        created_at: new Date().toISOString(),
        violations_found: allViolations.length,
        pages_scanned: totalPagesScanned,
        scan_results: JSON.stringify(allViolations),
        content_extracted: JSON.stringify({
          title: scanResult.title,
          description: scanResult.description,
          pages: scanResult.pages.map(p => ({
            url: p.url,
            title: p.title,
            contentLength: p.content.length
          }))
        })
      });

      console.log(`✅ Scan completed: ${allViolations.length} violations found across ${totalPagesScanned} pages`);

      return res.status(200).json({
        scanId,
        status: 'completed',
        violationsFound: allViolations.length,
        pagesScanned: totalPagesScanned,
        message: 'Scan completed successfully'
      });

    } catch (scanError) {
      console.error('Scan failed:', scanError);
      
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

    // Ensure we always return JSON
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

// Export scans for other API routes
export { scans };