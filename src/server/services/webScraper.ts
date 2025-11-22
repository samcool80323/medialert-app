import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { WebsiteContent, ScanConfiguration } from '../../shared/types';

export class WebScraper {
  private browser: Browser | null = null;
  private config: ScanConfiguration;

  constructor(config: Partial<ScanConfiguration> = {}) {
    this.config = {
      maxPages: config.maxPages || 10,
      maxDepth: config.maxDepth || 2,
      includeSubdomains: config.includeSubdomains || false,
      excludePatterns: config.excludePatterns || ['/admin', '/login', '/wp-admin', '/dashboard'],
      timeout: config.timeout || 30000,
      respectRobotsTxt: config.respectRobotsTxt || true,
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS !== 'false',
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
        ],
      });
      console.log('✅ Puppeteer browser initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Puppeteer browser:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scanWebsite(url: string, onProgress?: (progress: { currentPage: string; completed: number; total: number }) => void): Promise<WebsiteContent[]> {
    if (!this.browser) {
      await this.initialize();
    }

    const results: WebsiteContent[] = [];
    const visitedUrls = new Set<string>();
    const urlsToVisit: { url: string; depth: number }[] = [{ url, depth: 0 }];
    
    try {
      while (urlsToVisit.length > 0 && results.length < this.config.maxPages) {
        const { url: currentUrl, depth } = urlsToVisit.shift()!;
        
        if (visitedUrls.has(currentUrl) || depth > this.config.maxDepth) {
          continue;
        }

        if (this.shouldExcludeUrl(currentUrl)) {
          continue;
        }

        visitedUrls.add(currentUrl);

        // Report progress
        if (onProgress) {
          onProgress({
            currentPage: currentUrl,
            completed: results.length,
            total: Math.min(urlsToVisit.length + results.length + 1, this.config.maxPages),
          });
        }

        try {
          const content = await this.extractPageContent(currentUrl);
          results.push(content);

          // Discover new URLs if we haven't reached max depth
          if (depth < this.config.maxDepth) {
            const newUrls = this.extractInternalLinks(content, currentUrl);
            for (const newUrl of newUrls) {
              if (!visitedUrls.has(newUrl) && !urlsToVisit.some(item => item.url === newUrl)) {
                urlsToVisit.push({ url: newUrl, depth: depth + 1 });
              }
            }
          }
        } catch (error) {
          console.error(`Error scraping ${currentUrl}:`, error);
          // Continue with other pages
        }
      }

      return results;
    } finally {
      // Don't close browser here - let the caller manage it
    }
  }

  private async extractPageContent(url: string): Promise<WebsiteContent> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent(process.env.USER_AGENT || 'MediGuard-AI-Scanner/2.0');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to page with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for any dynamic content to load
      await page.waitForTimeout(2000);

      // Get page content
      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract title and meta description
      const title = $('title').text().trim() || '';
      const metaDescription = $('meta[name="description"]').attr('content') || '';

      // Extract headings
      const headings = {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get(),
      };

      // Extract paragraphs
      const paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 0);

      // Extract links
      const links = $('a[href]').map((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        const absoluteUrl = this.resolveUrl(href, url);
        return {
          text,
          href: absoluteUrl,
          isInternal: this.isInternalLink(absoluteUrl, url),
        };
      }).get();

      // Extract images
      const images = $('img').map((_, el) => ({
        src: this.resolveUrl($(el).attr('src') || '', url),
        alt: $(el).attr('alt') || '',
        title: $(el).attr('title'),
      })).get();

      // Extract forms
      const forms = $('form').map((_, el) => ({
        action: this.resolveUrl($(el).attr('action') || '', url),
        method: $(el).attr('method') || 'GET',
        inputs: $(el).find('input, textarea, select').map((_, input) => 
          $(input).attr('name') || $(input).attr('id') || ''
        ).get().filter(name => name.length > 0),
      })).get();

      // Extract script sources (for tracking analysis)
      const scripts = $('script[src]').map((_, el) => $(el).attr('src') || '').get();

      return {
        url,
        title,
        metaDescription,
        headings,
        paragraphs,
        links,
        images,
        forms,
        scripts,
      };
    } finally {
      await page.close();
    }
  }

  private shouldExcludeUrl(url: string): boolean {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    return this.config.excludePatterns.some(pattern => 
      pathname.includes(pattern.toLowerCase())
    );
  }

  private extractInternalLinks(content: WebsiteContent, baseUrl: string): string[] {
    return content.links
      .filter(link => link.isInternal && link.href !== baseUrl)
      .map(link => link.href)
      .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
  }

  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).href;
    } catch {
      return href;
    }
  }

  private isInternalLink(href: string, baseUrl: string): boolean {
    try {
      const hrefUrl = new URL(href);
      const baseUrlObj = new URL(baseUrl);
      
      if (this.config.includeSubdomains) {
        return hrefUrl.hostname.endsWith(baseUrlObj.hostname);
      } else {
        return hrefUrl.hostname === baseUrlObj.hostname;
      }
    } catch {
      return false;
    }
  }

  async checkRobotsTxt(url: string): Promise<boolean> {
    if (!this.config.respectRobotsTxt) {
      return true;
    }

    try {
      const robotsUrl = new URL('/robots.txt', url).href;
      const response = await fetch(robotsUrl);
      
      if (!response.ok) {
        return true; // If robots.txt doesn't exist, allow crawling
      }

      const robotsText = await response.text();
      const userAgent = process.env.USER_AGENT || 'MediGuard-AI-Scanner';
      
      // Simple robots.txt parsing - in production, use a proper parser
      const lines = robotsText.split('\n');
      let currentUserAgent = '';
      let disallowed = false;

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        if (trimmed.startsWith('user-agent:')) {
          currentUserAgent = trimmed.split(':')[1].trim();
        } else if (trimmed.startsWith('disallow:') &&
                   (currentUserAgent === '*' || currentUserAgent === userAgent.toLowerCase())) {
          const disallowPath = trimmed.split(':')[1].trim();
          // If disallowPath is empty, it means "allow everything"
          if (disallowPath && (disallowPath === '/' || url.includes(disallowPath))) {
            disallowed = true;
            break;
          }
        }
      }

      return !disallowed;
    } catch {
      return true; // If we can't check robots.txt, allow crawling
    }
  }
}