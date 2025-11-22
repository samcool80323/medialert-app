import express from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../database/init';
import { WebScraper } from '../services/webScraper';
import { ComplianceAnalyzer } from '../services/complianceAnalyzer';
import { StartScanRequest, StartScanResponse, GetScanResponse, ScanRecord } from '../../shared/types';

export const scannerRouter = express.Router();

// Validation schemas
const startScanSchema = z.object({
  url: z.string().url('Invalid URL format'),
  config: z.object({
    maxPages: z.number().min(1).max(50).optional(),
    maxDepth: z.number().min(1).max(5).optional(),
    includeSubdomains: z.boolean().optional(),
    excludePatterns: z.array(z.string()).optional(),
    timeout: z.number().min(5000).max(60000).optional(),
    respectRobotsTxt: z.boolean().optional(),
  }).optional(),
});

// In-memory store for active scans (in production, use Redis)
const activeScans = new Map<number, { scraper: WebScraper; status: string }>();

// Start a new website scan
scannerRouter.post('/start', async (req, res) => {
  try {
    // Validate request
    const validation = startScanSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { url, config } = validation.data;

    // Check if URL is accessible and appears to be a medical website
    const isValidMedicalSite = await validateMedicalWebsite(url);
    if (!isValidMedicalSite) {
      return res.status(400).json({
        error: 'Invalid Website',
        message: 'URL does not appear to be a medical or aesthetic practice website',
      });
    }

    // Create scan record in database
    const result = await dbRun(
      `INSERT INTO scans (url, status, violations_found, pages_scanned, scan_results, content_extracted) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [url, 'pending', 0, 0, '[]', '[]']
    );

    const scanId = result.lastID;

    // Start background scan process
    processScan(scanId, url, config || {});

    const response: StartScanResponse = {
      scanId,
      status: 'pending',
      message: 'Scan started successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start scan',
    });
  }
});

// Get scan results
scannerRouter.get('/:scanId', async (req, res) => {
  try {
    const scanId = parseInt(req.params.scanId);
    if (isNaN(scanId)) {
      return res.status(400).json({
        error: 'Invalid Scan ID',
        message: 'Scan ID must be a number',
      });
    }

    const scan = await dbGet(
      'SELECT * FROM scans WHERE id = ?',
      [scanId]
    );

    if (!scan) {
      return res.status(404).json({
        error: 'Scan Not Found',
        message: 'No scan found with the provided ID',
      });
    }

    // Parse JSON fields
    const scanRecord: ScanRecord = {
      id: scan.id,
      url: scan.url,
      status: scan.status,
      violationsFound: scan.violations_found,
      pagesScanned: scan.pages_scanned,
      scanResults: JSON.parse(scan.scan_results || '[]'),
      contentExtracted: JSON.parse(scan.content_extracted || '[]'),
      createdAt: scan.created_at,
      expiresAt: scan.expires_at,
    };

    // Add progress information if scan is active
    const activeScan = activeScans.get(scanId);
    if (activeScan && activeScan.status === 'processing') {
      // In a real implementation, you'd get this from the scraper
      scanRecord.progress = {
        currentPage: 'Processing...',
        pagesCompleted: scanRecord.pagesScanned,
        totalPages: Math.max(scanRecord.pagesScanned + 1, 5),
        percentage: Math.min((scanRecord.pagesScanned / 10) * 100, 90),
      };
    }

    const response: GetScanResponse = {
      scan: scanRecord,
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting scan:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan',
    });
  }
});

// Get scan progress (for real-time updates)
scannerRouter.get('/:scanId/progress', async (req, res) => {
  try {
    const scanId = parseInt(req.params.scanId);
    if (isNaN(scanId)) {
      return res.status(400).json({
        error: 'Invalid Scan ID',
        message: 'Scan ID must be a number',
      });
    }

    const scan = await dbGet(
      'SELECT id, status, pages_scanned FROM scans WHERE id = ?',
      [scanId]
    );

    if (!scan) {
      return res.status(404).json({
        error: 'Scan Not Found',
        message: 'No scan found with the provided ID',
      });
    }

    const activeScan = activeScans.get(scanId);
    let progress = {
      scanId,
      status: scan.status,
      progress: scan.status === 'completed' ? 100 : 0,
      currentPage: '',
      pagesCompleted: scan.pages_scanned,
      totalPages: scan.pages_scanned,
    };

    if (activeScan && activeScan.status === 'processing') {
      progress.progress = Math.min((scan.pages_scanned / 10) * 100, 90);
      progress.currentPage = 'Processing...';
      progress.totalPages = Math.max(scan.pages_scanned + 1, 10);
    }

    res.json(progress);
  } catch (error) {
    console.error('Error getting scan progress:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scan progress',
    });
  }
});

// List recent scans (for debugging/admin)
scannerRouter.get('/', async (req, res) => {
  try {
    const scans = await dbAll(
      `SELECT id, url, status, violations_found, pages_scanned, created_at 
       FROM scans 
       ORDER BY created_at DESC 
       LIMIT 20`
    );

    res.json({ scans });
  } catch (error) {
    console.error('Error listing scans:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve scans',
    });
  }
});

// Background scan processing function
async function processScan(scanId: number, url: string, config: any) {
  const scraper = new WebScraper(config);
  const analyzer = new ComplianceAnalyzer();

  try {
    console.log(`🔄 Starting scan ${scanId} for ${url}`);
    
    // Update status to processing
    await dbRun('UPDATE scans SET status = ? WHERE id = ?', ['processing', scanId]);
    activeScans.set(scanId, { scraper, status: 'processing' });

    console.log(`🤖 Checking robots.txt for ${url}`);
    // Check robots.txt
    const robotsAllowed = await scraper.checkRobotsTxt(url);
    if (!robotsAllowed) {
      console.log(`❌ Scan ${scanId} blocked by robots.txt`);
      await dbRun(
        'UPDATE scans SET status = ? WHERE id = ?',
        ['failed', scanId]
      );
      activeScans.delete(scanId);
      return;
    }
    console.log(`✅ Robots.txt allows crawling for ${url}`);

    console.log(`🕷️ Starting website scraping for ${url}`);
    // Scrape website content
    const content = await scraper.scanWebsite(url, (progress) => {
      console.log(`📊 Scan ${scanId} progress: ${progress.completed}/${progress.total} pages`);
      // Update progress in database
      dbRun(
        'UPDATE scans SET pages_scanned = ? WHERE id = ?',
        [progress.completed, scanId]
      ).catch(console.error);
    });

    console.log(`📝 Scraped ${content.length} pages, analyzing for compliance...`);
    // Analyze content for compliance violations
    const violations = await analyzer.analyzeContent(content);

    console.log(`📊 Analysis complete: ${violations.length} violations found`);
    // Update database with results
    await dbRun(
      `UPDATE scans SET
        status = ?,
        violations_found = ?,
        pages_scanned = ?,
        scan_results = ?,
        content_extracted = ?
       WHERE id = ?`,
      [
        'completed',
        violations.length,
        content.length,
        JSON.stringify(violations),
        JSON.stringify(content),
        scanId,
      ]
    );

    console.log(`✅ Scan ${scanId} completed: ${violations.length} violations found`);
  } catch (error) {
    console.error(`❌ Scan ${scanId} failed:`, error);
    if (error instanceof Error) {
      console.error(`❌ Error details:`, error.message);
      console.error(`❌ Stack trace:`, error.stack);
    }
    
    // Update status to failed
    await dbRun('UPDATE scans SET status = ? WHERE id = ?', ['failed', scanId]);
  } finally {
    // Cleanup
    await scraper.close();
    activeScans.delete(scanId);
  }
}

// Helper function to validate if URL is a medical website
async function validateMedicalWebsite(url: string): Promise<boolean> {
  try {
    // Simple validation - check if URL is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return false;
    }

    // In a real implementation, you might check:
    // - Domain patterns (e.g., medical practice domains)
    // - Content keywords
    // - Meta tags
    // - SSL certificate
    
    return true;
  } catch (error) {
    console.error('Error validating website:', error);
    return false;
  }
}