import puppeteer, { Browser, Page } from 'puppeteer';
import PDFDocument from 'pdfkit';
import { ComplianceViolation } from '../../shared/types';

export class PDFGenerator {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (this.browser) return;

    try {
      console.log('🚀 Initializing PDF Generator...');
      
      // Use same Puppeteer configuration as WebScraper for consistency
      const launchOptions: any = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--single-process',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
      };

      // Add executable path if in production
      if (process.env.NODE_ENV === 'production') {
        const possiblePaths = [
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
        ];
        
        for (const path of possiblePaths) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(path)) {
              launchOptions.executablePath = path;
              console.log(`✅ Found Chrome executable for PDF: ${path}`);
              break;
            }
          } catch (e) {
            // Continue to next path
          }
        }
      }

      this.browser = await puppeteer.launch(launchOptions);
      console.log('✅ PDF Generator initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize PDF Generator:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw new Error(`PDF Generator initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateComplianceReport(data: {
    url: string;
    scanDate: string;
    violations: ComplianceViolation[];
    summary: {
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
      mediumViolations: number;
      lowViolations: number;
    };
  }): Promise<Buffer> {
    try {
      console.log('🔄 Starting PDF generation...');
      
      if (!this.browser) {
        console.log('🚀 Initializing PDF Generator browser...');
        await this.initialize();
      }

      console.log('📄 Creating new page...');
      const page = await this.browser!.newPage();
      
      // Set page size to A4
      await page.setViewport({ width: 1200, height: 1600 });

      console.log('🎨 Generating HTML content...');
      const html = this.generateReportHTML(data);
      
      console.log('📝 Setting page content...');
      await page.setContent(html, {
        waitUntil: 'domcontentloaded', // Changed from networkidle0 to be more reliable
        timeout: 60000 // Increased timeout
      });

      console.log('🖨️ Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>MediGuard AI - AHPRA Compliance Report</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${new Date().toLocaleDateString('en-AU')}</span>
          </div>
        `,
        timeout: 60000, // Add PDF generation timeout
      });

      await page.close();
      
      console.log(`✅ PDF report generated successfully (${pdfBuffer.length} bytes)`);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      
      // Try to generate a simple text-based fallback
      try {
        console.log('🔄 Attempting fallback PDF generation...');
        return await this.generateFallbackPDF(data);
      } catch (fallbackError) {
        console.error('❌ Fallback PDF generation also failed:', fallbackError);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback also failed.`);
      }
    }
  }

  private async generateFallbackPDF(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Generating fallback PDF using PDFKit...');
        
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          console.log(`✅ Fallback PDF generated successfully (${pdfBuffer.length} bytes)`);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc.fontSize(24)
           .fillColor('#2563eb')
           .text('MediGuard AI', { align: 'center' });
        
        doc.fontSize(16)
           .fillColor('#666666')
           .text('AHPRA Compliance Report', { align: 'center' });
        
        doc.moveDown(2);

        // Website and Date Info
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Website Scanned: ${data.url}`, { continued: false });
        
        doc.text(`Scan Date: ${new Date(data.scanDate).toLocaleDateString('en-AU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, { continued: false });
        
        doc.moveDown(1);

        // Summary Section
        doc.fontSize(16)
           .fillColor('#2563eb')
           .text('Executive Summary', { underline: true });
        
        doc.moveDown(0.5);
        
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`Total Violations: ${data.summary.totalViolations}`);
        
        doc.fillColor('#dc2626')
           .text(`Critical: ${data.summary.criticalViolations}`);
        
        doc.fillColor('#ea580c')
           .text(`High: ${data.summary.highViolations}`);
        
        doc.fillColor('#d97706')
           .text(`Medium: ${data.summary.mediumViolations}`);
        
        doc.fillColor('#65a30d')
           .text(`Low: ${data.summary.lowViolations}`);
        
        doc.moveDown(1);

        // Violations Section
        if (data.violations && data.violations.length > 0) {
          doc.fontSize(16)
             .fillColor('#2563eb')
             .text('Detailed Violations', { underline: true });
          
          doc.moveDown(0.5);

          data.violations.forEach((violation: any, index: number) => {
            // Check if we need a new page
            if (doc.y > 700) {
              doc.addPage();
            }

            doc.fontSize(14)
               .fillColor('#000000')
               .text(`${index + 1}. ${violation.rule}`, { continued: true });
            
            // Severity badge
            const severityColors: { [key: string]: string } = {
              critical: '#dc2626',
              high: '#ea580c',
              medium: '#d97706',
              low: '#65a30d'
            };
            
            doc.fillColor(severityColors[violation.severity] || '#666666')
               .text(` (${violation.severity.toUpperCase()})`, { continued: false });
            
            doc.fontSize(11)
               .fillColor('#000000')
               .text(`Issue: ${violation.issue}`, { indent: 20 })
               .text(`Page: ${violation.pageTitle || 'N/A'}`, { indent: 20 });
            
            if (violation.originalText) {
              doc.fillColor('#666666')
                 .text(`Original Text: "${violation.originalText}"`, {
                   indent: 20,
                   width: 500
                 });
            }
            
            if (violation.compliantRewrite) {
              doc.fillColor('#065f46')
                 .text(`Compliant Rewrite: "${violation.compliantRewrite}"`, {
                   indent: 20,
                   width: 500
                 });
            }
            
            if (violation.suggestion) {
              doc.fillColor('#000000')
                 .text(`Recommendation: ${violation.suggestion}`, {
                   indent: 20,
                   width: 500
                 });
            }
            
            doc.moveDown(0.8);
          });
        } else {
          doc.fontSize(16)
             .fillColor('#2563eb')
             .text('No Violations Found', { underline: true });
          
          doc.moveDown(0.5);
          doc.fontSize(12)
             .fillColor('#065f46')
             .text('Congratulations! No AHPRA compliance violations were detected on your website.');
        }

        // Add new page for regulatory references
        doc.addPage();
        
        // Regulatory References
        doc.fontSize(16)
           .fillColor('#2563eb')
           .text('Regulatory References', { underline: true });
        
        doc.moveDown(0.5);
        
        doc.fontSize(11)
           .fillColor('#000000')
           .text('AHPRA National Law Section 133: Prohibits advertising that is false, misleading or deceptive, or likely to create unreasonable expectations of beneficial treatment.', { width: 500 })
           .moveDown(0.5)
           .text('TGA Therapeutic Goods Advertising Code: Regulates advertising of therapeutic goods to ensure it is not misleading and does not encourage inappropriate use.', { width: 500 })
           .moveDown(0.5)
           .text('Australian Consumer Law: Prohibits misleading and deceptive conduct in trade or commerce.', { width: 500 });
        
        doc.moveDown(1);

        // Disclaimer
        doc.fontSize(16)
           .fillColor('#2563eb')
           .text('Disclaimer', { underline: true });
        
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .fillColor('#666666')
           .text('This report is generated by MediGuard AI and provides guidance on potential AHPRA compliance issues. It should not be considered as legal advice. For specific legal guidance, please consult with a qualified legal professional specializing in healthcare regulation.', { width: 500 })
           .moveDown(0.5)
           .text(`Report generated on ${new Date().toLocaleDateString('en-AU')} using MediGuard AI compliance scanning technology.`, { width: 500 });

        // Finalize the PDF
        doc.end();

      } catch (error) {
        console.error('❌ Fallback PDF generation failed:', error);
        reject(error);
      }
    });
  }

  private generateReportHTML(data: {
    url: string;
    scanDate: string;
    violations: ComplianceViolation[];
    summary: {
      totalViolations: number;
      criticalViolations: number;
      highViolations: number;
      mediumViolations: number;
      lowViolations: number;
    };
  }): string {
    const { url, scanDate, violations, summary } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AHPRA Compliance Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 16px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin: 30px 0;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .summary-number {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #d97706; }
        .low { color: #65a30d; }
        .violation {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          page-break-inside: avoid;
        }
        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .violation-type {
          font-weight: bold;
          font-size: 16px;
        }
        .severity-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .severity-critical {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .severity-high {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fed7aa;
        }
        .severity-medium {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }
        .severity-low {
          background: #f0fdf4;
          color: #65a30d;
          border: 1px solid #bbf7d0;
        }
        .violation-content {
          margin: 15px 0;
        }
        .violation-text {
          background: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 10px 15px;
          margin: 10px 0;
          font-style: italic;
        }
        .compliant-text {
          background: #f0fdf4;
          border-left: 4px solid #65a30d;
          padding: 10px 15px;
          margin: 10px 0;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
          margin: 30px 0 15px 0;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        .info-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 6px;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
          margin-bottom: 5px;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">MediGuard AI</div>
        <div class="subtitle">AHPRA Compliance Report</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Website Scanned:</div>
          <div>${url}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Scan Date:</div>
          <div>${new Date(scanDate).toLocaleDateString('en-AU', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
      </div>

      <div class="section-title">Executive Summary</div>
      
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-number">${summary.totalViolations}</div>
          <div>Total Violations</div>
        </div>
        <div class="summary-card">
          <div class="summary-number critical">${summary.criticalViolations}</div>
          <div>Critical</div>
        </div>
        <div class="summary-card">
          <div class="summary-number high">${summary.highViolations}</div>
          <div>High</div>
        </div>
        <div class="summary-card">
          <div class="summary-number medium">${summary.mediumViolations}</div>
          <div>Medium</div>
        </div>
        <div class="summary-card">
          <div class="summary-number low">${summary.lowViolations}</div>
          <div>Low</div>
        </div>
      </div>

      ${violations.length > 0 ? `
        <div class="section-title">Detailed Violations</div>
        ${violations.map((violation, index) => `
          <div class="violation">
            <div class="violation-header">
              <div class="violation-type">${violation.rule}</div>
              <div class="severity-badge severity-${violation.severity}">${violation.severity}</div>
            </div>
            
            <div class="violation-content">
              <div><strong>Issue:</strong> ${violation.issue}</div>
              <div><strong>Page:</strong> ${violation.pageTitle} (${violation.pageUrl})</div>
              
              <div style="margin: 15px 0;">
                <strong>Original Text:</strong>
                <div class="violation-text">${violation.originalText}</div>
              </div>
              
              <div style="margin: 15px 0;">
                <strong>Compliant Rewrite:</strong>
                <div class="compliant-text">${violation.compliantRewrite}</div>
              </div>
              
              <div><strong>Recommendation:</strong> ${violation.suggestion}</div>
            </div>
          </div>
        `).join('')}
      ` : `
        <div class="section-title">No Violations Found</div>
        <p>Congratulations! No AHPRA compliance violations were detected on your website.</p>
      `}

      <div class="page-break"></div>
      <div class="section-title">Regulatory References</div>
      <div style="font-size: 14px; line-height: 1.8;">
        <p><strong>AHPRA National Law Section 133:</strong> Prohibits advertising that is false, misleading or deceptive, or likely to create unreasonable expectations of beneficial treatment.</p>
        <p><strong>TGA Therapeutic Goods Advertising Code:</strong> Regulates advertising of therapeutic goods to ensure it is not misleading and does not encourage inappropriate use.</p>
        <p><strong>Australian Consumer Law:</strong> Prohibits misleading and deceptive conduct in trade or commerce.</p>
      </div>

      <div class="section-title">Disclaimer</div>
      <div style="font-size: 12px; color: #666; line-height: 1.6;">
        <p>This report is generated by MediGuard AI and provides guidance on potential AHPRA compliance issues. It should not be considered as legal advice. For specific legal guidance, please consult with a qualified legal professional specializing in healthcare regulation.</p>
        <p>Report generated on ${new Date().toLocaleDateString('en-AU')} using MediGuard AI compliance scanning technology.</p>
      </div>
    </body>
    </html>
    `;
  }
}

export const pdfGenerator = new PDFGenerator();