import axios from 'axios';
import * as cheerio from 'cheerio';

export class ServerlessWebScraper {
  private userAgent = 'MediGuard-AI-Scanner/2.0 (+https://mediguard.ai)';
  private timeout = 15000; // 15 seconds for serverless

  async scanWebsite(url: string): Promise<{
    content: string;
    title: string;
    description: string;
    pages: Array<{
      url: string;
      title: string;
      content: string;
    }>;
  }> {
    try {
      console.log(`🔍 Starting serverless scan of: ${url}`);
      
      // Scan main page
      const mainPage = await this.scrapePage(url);
      
      // Extract links for additional pages (limited to 3 for serverless)
      const additionalLinks = this.extractLinks(mainPage.content, url).slice(0, 3);
      
      // Scan additional pages
      const additionalPages: Array<{
        url: string;
        title: string;
        content: string;
      }> = [];
      for (const link of additionalLinks) {
        try {
          const page = await this.scrapePage(link);
          additionalPages.push({
            url: page.url,
            title: page.title,
            content: page.content
          });
        } catch (error) {
          console.warn(`Failed to scan ${link}:`, error);
        }
      }

      return {
        content: mainPage.content,
        title: mainPage.title,
        description: mainPage.description,
        pages: [mainPage, ...additionalPages]
      };

    } catch (error) {
      console.error('Serverless scan failed:', error);
      throw new Error(`Failed to scan website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async scrapePage(url: string): Promise<{
    url: string;
    title: string;
    content: string;
    description: string;
  }> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.timeout,
        maxRedirects: 3,
        validateStatus: (status) => status < 400,
      });

      const $ = cheerio.load(response.data);
      
      // Remove script and style elements
      $('script, style, nav, footer, header, .nav, .footer, .header').remove();
      
      // Extract content
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || '';
      
      // Get main content
      let content = '';
      
      // Try to find main content areas
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.main-content',
        '.content',
        '.post-content',
        '.entry-content',
        'article',
        '.article'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }
      
      // Fallback to body content if no main content found
      if (!content) {
        content = $('body').text().trim();
      }
      
      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()
        .substring(0, 10000); // Limit content length for serverless

      return {
        url,
        title,
        content,
        description
      };

    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      throw new Error(`Failed to scrape page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (!href) return;
      
      try {
        let fullUrl: string;
        
        if (href.startsWith('http')) {
          fullUrl = href;
        } else if (href.startsWith('/')) {
          fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${href}`;
        } else {
          fullUrl = new URL(href, baseUrl).toString();
        }
        
        const urlObj = new URL(fullUrl);
        
        // Only include links from the same domain
        if (urlObj.hostname === baseUrlObj.hostname) {
          // Skip common non-content pages
          const skipPatterns = [
            '/contact', '/privacy', '/terms', '/login', '/register',
            '/cart', '/checkout', '/account', '/admin', '/wp-admin',
            '.pdf', '.doc', '.docx', '.jpg', '.png', '.gif', '.zip'
          ];
          
          const shouldSkip = skipPatterns.some(pattern => 
            fullUrl.toLowerCase().includes(pattern.toLowerCase())
          );
          
          if (!shouldSkip && !links.includes(fullUrl) && fullUrl !== baseUrl) {
            links.push(fullUrl);
          }
        }
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    return links.slice(0, 5); // Limit to 5 additional pages
  }
}

export const serverlessWebScraper = new ServerlessWebScraper();