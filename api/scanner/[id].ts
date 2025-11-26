import { VercelRequest, VercelResponse } from '@vercel/node';
import { scans } from './start';

export default function handler(req: VercelRequest, res: VercelResponse) {
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

  // Parse scan results if they exist
  let violations = [];
  if (scan.scan_results) {
    try {
      violations = JSON.parse(scan.scan_results);
    } catch (error) {
      console.error('Error parsing scan results:', error);
    }
  }

  // Parse content if it exists
  let extractedContent = null;
  if (scan.content_extracted) {
    try {
      extractedContent = JSON.parse(scan.content_extracted);
    } catch (error) {
      console.error('Error parsing extracted content:', error);
    }
  }

  return res.status(200).json({
    id: scan.id,
    url: scan.url,
    status: scan.status,
    violationsFound: scan.violations_found || 0,
    pagesScanned: scan.pages_scanned || 0,
    createdAt: scan.created_at,
    violations,
    extractedContent,
    error: scan.error || null
  });
}