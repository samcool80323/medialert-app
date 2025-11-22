"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scannerRouter = void 0;
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const init_1 = require("../database/init");
const webScraper_1 = require("../services/webScraper");
const complianceAnalyzer_1 = require("../services/complianceAnalyzer");
const pdfGenerator_1 = require("../services/pdfGenerator");
exports.scannerRouter = express_1.default.Router();
// Validation schemas
const startScanSchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format'),
    config: zod_1.z.object({
        maxPages: zod_1.z.number().min(1).max(50).optional(),
        maxDepth: zod_1.z.number().min(1).max(5).optional(),
        includeSubdomains: zod_1.z.boolean().optional(),
        excludePatterns: zod_1.z.array(zod_1.z.string()).optional(),
        timeout: zod_1.z.number().min(5000).max(60000).optional(),
        respectRobotsTxt: zod_1.z.boolean().optional(),
    }).optional(),
});
// In-memory store for active scans (in production, use Redis)
const activeScans = new Map();
// Start a new website scan
exports.scannerRouter.post('/start', async (req, res) => {
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
        const result = await (0, init_1.dbRun)(`INSERT INTO scans (url, status, violations_found, pages_scanned, scan_results, content_extracted) VALUES ($1, $2, $3, $4, $5, $6)`, [url, 'pending', 0, 0, '[]', '[]']);
        const scanId = result.lastID;
        // Start background scan process
        processScan(scanId, url, config || {});
        const response = {
            scanId,
            status: 'pending',
            message: 'Scan started successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error starting scan:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to start scan',
        });
    }
});
// Get scan results
exports.scannerRouter.get('/:scanId', async (req, res) => {
    try {
        const scanId = parseInt(req.params.scanId);
        if (isNaN(scanId)) {
            return res.status(400).json({
                error: 'Invalid Scan ID',
                message: 'Scan ID must be a number',
            });
        }
        const scan = await (0, init_1.dbGet)('SELECT * FROM scans WHERE id = $1', [scanId]);
        if (!scan) {
            return res.status(404).json({
                error: 'Scan Not Found',
                message: 'No scan found with the provided ID',
            });
        }
        // Parse JSON fields
        const scanRecord = {
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
        const response = {
            scan: scanRecord,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error getting scan:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve scan',
        });
    }
});
// Get scan progress (for real-time updates)
exports.scannerRouter.get('/:scanId/progress', async (req, res) => {
    try {
        const scanId = parseInt(req.params.scanId);
        if (isNaN(scanId)) {
            return res.status(400).json({
                error: 'Invalid Scan ID',
                message: 'Scan ID must be a number',
            });
        }
        const scan = await (0, init_1.dbGet)('SELECT id, status, pages_scanned FROM scans WHERE id = $1', [scanId]);
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
    }
    catch (error) {
        console.error('Error getting scan progress:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve scan progress',
        });
    }
});
// List recent scans (for debugging/admin)
exports.scannerRouter.get('/', async (req, res) => {
    try {
        const scans = await (0, init_1.dbAll)(`SELECT id, url, status, violations_found, pages_scanned, created_at 
       FROM scans 
       ORDER BY created_at DESC 
       LIMIT 20`);
        res.json({ scans });
    }
    catch (error) {
        console.error('Error listing scans:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve scans',
        });
    }
});
// Generate PDF report for scan results
exports.scannerRouter.get('/:scanId/pdf', async (req, res) => {
    try {
        const scanId = parseInt(req.params.scanId);
        if (isNaN(scanId)) {
            return res.status(400).json({
                error: 'Invalid Scan ID',
                message: 'Scan ID must be a number',
            });
        }
        // Get scan data
        const scan = await (0, init_1.dbGet)('SELECT * FROM scans WHERE id = $1', [scanId]);
        if (!scan) {
            return res.status(404).json({
                error: 'Scan Not Found',
                message: 'No scan found with the provided ID',
            });
        }
        if (scan.status !== 'completed') {
            return res.status(400).json({
                error: 'Scan Not Complete',
                message: 'PDF can only be generated for completed scans',
            });
        }
        // Parse scan results
        const violations = JSON.parse(scan.scan_results || '[]');
        // Calculate summary statistics
        const summary = {
            totalViolations: violations.length,
            criticalViolations: violations.filter((v) => v.severity === 'critical').length,
            highViolations: violations.filter((v) => v.severity === 'high').length,
            mediumViolations: violations.filter((v) => v.severity === 'medium').length,
            lowViolations: violations.filter((v) => v.severity === 'low').length,
        };
        // Generate PDF
        const pdfBuffer = await pdfGenerator_1.pdfGenerator.generateComplianceReport({
            url: scan.url,
            scanDate: scan.created_at,
            violations,
            summary,
        });
        // Set response headers for PDF download
        const filename = `compliance-report-${scanId}-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Send PDF
        res.send(pdfBuffer);
        console.log(`✅ PDF report generated for scan ${scanId}`);
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'PDF Generation Failed',
            message: 'Failed to generate PDF report',
        });
    }
});
// Background scan processing function
async function processScan(scanId, url, config) {
    const scraper = new webScraper_1.WebScraper(config);
    const analyzer = new complianceAnalyzer_1.ComplianceAnalyzer();
    try {
        console.log(`🔄 Starting scan ${scanId} for ${url}`);
        // Update status to processing
        await (0, init_1.dbRun)('UPDATE scans SET status = $1 WHERE id = $2', ['processing', scanId]);
        activeScans.set(scanId, { scraper, status: 'processing' });
        console.log(`🤖 Checking robots.txt for ${url}`);
        // Check robots.txt
        const robotsAllowed = await scraper.checkRobotsTxt(url);
        if (!robotsAllowed) {
            console.log(`❌ Scan ${scanId} blocked by robots.txt`);
            await (0, init_1.dbRun)('UPDATE scans SET status = $1 WHERE id = $2', ['failed', scanId]);
            activeScans.delete(scanId);
            return;
        }
        console.log(`✅ Robots.txt allows crawling for ${url}`);
        console.log(`🕷️ Starting website scraping for ${url}`);
        // Scrape website content
        const content = await scraper.scanWebsite(url, (progress) => {
            console.log(`📊 Scan ${scanId} progress: ${progress.completed}/${progress.total} pages`);
            // Update progress in database
            (0, init_1.dbRun)('UPDATE scans SET pages_scanned = $1 WHERE id = $2', [progress.completed, scanId]).catch(console.error);
        });
        console.log(`📝 Scraped ${content.length} pages, analyzing for compliance...`);
        // Analyze content for compliance violations
        const violations = await analyzer.analyzeContent(content);
        console.log(`📊 Analysis complete: ${violations.length} violations found`);
        // Update database with results
        await (0, init_1.dbRun)(`UPDATE scans SET
        status = $1,
        violations_found = $2,
        pages_scanned = $3,
        scan_results = $4,
        content_extracted = $5
       WHERE id = $6`, [
            'completed',
            violations.length,
            content.length,
            JSON.stringify(violations),
            JSON.stringify(content),
            scanId,
        ]);
        console.log(`✅ Scan ${scanId} completed: ${violations.length} violations found`);
    }
    catch (error) {
        console.error(`❌ Scan ${scanId} failed:`, error);
        if (error instanceof Error) {
            console.error(`❌ Error details:`, error.message);
            console.error(`❌ Stack trace:`, error.stack);
        }
        // Update status to failed
        await (0, init_1.dbRun)('UPDATE scans SET status = $1 WHERE id = $2', ['failed', scanId]);
    }
    finally {
        // Cleanup
        await scraper.close();
        activeScans.delete(scanId);
    }
}
// Helper function to validate if URL is a medical website
async function validateMedicalWebsite(url) {
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
    }
    catch (error) {
        console.error('Error validating website:', error);
        return false;
    }
}
