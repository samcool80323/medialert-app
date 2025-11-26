import { VercelRequest, VercelResponse } from '@vercel/node';
import { scans } from '../start';
import { pdfGenerator } from '../../../src/server/services/pdfGenerator';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid scan ID' });
  }

  const scan = scans.get(id);

  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }

  if (scan.status !== 'completed') {
    return res.status(400).json({ error: 'Scan not completed yet' });
  }

  try {
    // Parse scan results
    let violations = [];
    if (scan.scan_results) {
      try {
        violations = JSON.parse(scan.scan_results);
      } catch (error) {
        console.error('Error parsing scan results:', error);
      }
    }

    // Calculate summary statistics
    const summary = {
      totalViolations: violations.length,
      criticalViolations: violations.filter((v: any) => v.severity === 'critical').length,
      highViolations: violations.filter((v: any) => v.severity === 'high').length,
      mediumViolations: violations.filter((v: any) => v.severity === 'medium').length,
      lowViolations: violations.filter((v: any) => v.severity === 'low').length,
    };

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateComplianceReport({
      url: scan.url,
      scanDate: scan.created_at,
      violations,
      summary,
    });

    // Set response headers for PDF download
    const filename = `compliance-report-${id}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

    console.log(`✅ PDF report generated for scan ${id}`);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      error: 'PDF generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}