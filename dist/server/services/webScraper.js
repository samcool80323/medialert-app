"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebScraper = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const cheerio = __importStar(require("cheerio"));
const url_1 = require("url");
class WebScraper {
    browser = null;
    config;
    constructor(config = {}) {
        this.config = {
            maxPages: config.maxPages || 10,
            maxDepth: config.maxDepth || 2,
            includeSubdomains: config.includeSubdomains || false,
            excludePatterns: config.excludePatterns || ['/admin', '/login', '/wp-admin', '/dashboard'],
            timeout: config.timeout || 30000,
            respectRobotsTxt: config.respectRobotsTxt || true,
        };
    }
    async initialize() {
        try {
            console.log('🚀 Initializing Puppeteer browser...');
            this.browser = await puppeteer_1.default.launch({
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
        }
        catch (error) {
            console.error('❌ Failed to initialize Puppeteer browser:', error);
            throw error;
        }
    }
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    async scanWebsite(url, onProgress) {
        if (!this.browser) {
            await this.initialize();
        }
        const results = [];
        const visitedUrls = new Set();
        const urlsToVisit = [{ url, depth: 0 }];
        try {
            while (urlsToVisit.length > 0 && results.length < this.config.maxPages) {
                const { url: currentUrl, depth } = urlsToVisit.shift();
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
                }
                catch (error) {
                    console.error(`Error scraping ${currentUrl}:`, error);
                    // Continue with other pages
                }
            }
            return results;
        }
        finally {
            // Don't close browser here - let the caller manage it
        }
    }
    async extractPageContent(url) {
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
                inputs: $(el).find('input, textarea, select').map((_, input) => $(input).attr('name') || $(input).attr('id') || '').get().filter(name => name.length > 0),
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
        }
        finally {
            await page.close();
        }
    }
    shouldExcludeUrl(url) {
        const urlObj = new url_1.URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        return this.config.excludePatterns.some(pattern => pathname.includes(pattern.toLowerCase()));
    }
    extractInternalLinks(content, baseUrl) {
        return content.links
            .filter(link => link.isInternal && link.href !== baseUrl)
            .map(link => link.href)
            .filter((url, index, array) => array.indexOf(url) === index); // Remove duplicates
    }
    resolveUrl(href, baseUrl) {
        try {
            return new url_1.URL(href, baseUrl).href;
        }
        catch {
            return href;
        }
    }
    isInternalLink(href, baseUrl) {
        try {
            const hrefUrl = new url_1.URL(href);
            const baseUrlObj = new url_1.URL(baseUrl);
            if (this.config.includeSubdomains) {
                return hrefUrl.hostname.endsWith(baseUrlObj.hostname);
            }
            else {
                return hrefUrl.hostname === baseUrlObj.hostname;
            }
        }
        catch {
            return false;
        }
    }
    async checkRobotsTxt(url) {
        if (!this.config.respectRobotsTxt) {
            return true;
        }
        try {
            const robotsUrl = new url_1.URL('/robots.txt', url).href;
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
                }
                else if (trimmed.startsWith('disallow:') &&
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
        }
        catch {
            return true; // If we can't check robots.txt, allow crawling
        }
    }
}
exports.WebScraper = WebScraper;
