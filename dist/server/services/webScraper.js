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
            // Enhanced configuration for cloud deployment (Render)
            const launchOptions = {
                headless: 'new', // Use new headless mode
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
                    '--disable-hang-monitor',
                    '--disable-prompt-on-repost',
                    '--disable-sync',
                    '--disable-translate',
                    '--metrics-recording-only',
                    '--no-default-browser-check',
                    '--safebrowsing-disable-auto-update',
                    '--enable-automation',
                    '--password-store=basic',
                    '--use-mock-keychain',
                    '--single-process', // Important for containerized environments
                    '--memory-pressure-off',
                    '--max_old_space_size=4096',
                ],
                timeout: 60000, // Increase timeout for cloud environments
                protocolTimeout: 60000,
            };
            // Add executable path if in production (Render may need this)
            if (process.env.NODE_ENV === 'production') {
                console.log('🔧 Production environment detected, using additional configurations...');
                // Render typically has Chrome installed at this path
                const possiblePaths = [
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/google-chrome',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium',
                ];
                // Try to find Chrome executable
                for (const path of possiblePaths) {
                    try {
                        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                        if (fs.existsSync(path)) {
                            launchOptions.executablePath = path;
                            console.log(`✅ Found Chrome executable at: ${path}`);
                            break;
                        }
                    }
                    catch (e) {
                        // Continue to next path
                    }
                }
            }
            this.browser = await puppeteer_1.default.launch(launchOptions);
            console.log('✅ Puppeteer browser initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Puppeteer browser:', error);
            if (error instanceof Error) {
                console.error('Error details:', error.message);
            }
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
        try {
            if (!this.browser) {
                await this.initialize();
            }
        }
        catch (error) {
            console.error('❌ Puppeteer initialization failed, falling back to HTTP scraping:', error);
            return this.fallbackHttpScraping(url, onProgress);
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
    // Fallback HTTP scraping method when Puppeteer fails
    async fallbackHttpScraping(url, onProgress) {
        console.log('🔄 Using fallback HTTP scraping method with multi-page support...');
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
                if (onProgress) {
                    onProgress({
                        currentPage: currentUrl,
                        completed: results.length,
                        total: Math.min(this.config.maxPages, results.length + urlsToVisit.length + 1),
                    });
                }
                try {
                    const response = await fetch(currentUrl, {
                        headers: {
                            'User-Agent': 'MediGuard-AI-Scanner/1.0 (Compliance Scanner)',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Accept-Encoding': 'gzip, deflate',
                            'Connection': 'keep-alive',
                        },
                    });
                    if (!response.ok) {
                        console.log(`⚠️ Failed to fetch ${currentUrl}: ${response.status}`);
                        continue;
                    }
                    const html = await response.text();
                    const $ = cheerio.load(html);
                    // Extract basic content using Cheerio
                    const content = {
                        url: currentUrl,
                        title: $('title').text().trim() || 'Untitled Page',
                        metaDescription: $('meta[name="description"]').attr('content') || '',
                        headings: {
                            h1: [],
                            h2: [],
                            h3: [],
                        },
                        paragraphs: [],
                        links: [],
                        images: [],
                        forms: [],
                        scripts: [],
                    };
                    // Extract headings
                    $('h1').each((_, element) => {
                        const text = $(element).text().trim();
                        if (text)
                            content.headings.h1.push(text);
                    });
                    $('h2').each((_, element) => {
                        const text = $(element).text().trim();
                        if (text)
                            content.headings.h2.push(text);
                    });
                    $('h3').each((_, element) => {
                        const text = $(element).text().trim();
                        if (text)
                            content.headings.h3.push(text);
                    });
                    // Extract paragraphs
                    $('p').each((_, element) => {
                        const text = $(element).text().trim();
                        if (text && text.length > 10) {
                            content.paragraphs.push(text);
                        }
                    });
                    // Extract links for next pages
                    $('a[href]').each((_, element) => {
                        const href = $(element).attr('href');
                        const text = $(element).text().trim();
                        if (href && text) {
                            try {
                                const absoluteUrl = new url_1.URL(href, currentUrl).href;
                                const isInternal = new url_1.URL(absoluteUrl).hostname === new url_1.URL(currentUrl).hostname;
                                content.links.push({
                                    text,
                                    href: absoluteUrl,
                                    isInternal,
                                });
                                // Add internal links for next depth level
                                if (isInternal && depth < this.config.maxDepth && !visitedUrls.has(absoluteUrl) && !urlsToVisit.some(item => item.url === absoluteUrl)) {
                                    urlsToVisit.push({ url: absoluteUrl, depth: depth + 1 });
                                }
                            }
                            catch {
                                // Skip invalid URLs
                            }
                        }
                    });
                    // Extract images
                    $('img[src]').each((_, element) => {
                        const src = $(element).attr('src');
                        const alt = $(element).attr('alt') || '';
                        const title = $(element).attr('title');
                        if (src) {
                            try {
                                const absoluteUrl = new url_1.URL(src, currentUrl).href;
                                content.images.push({
                                    src: absoluteUrl,
                                    alt,
                                    title,
                                });
                            }
                            catch {
                                // Skip invalid URLs
                            }
                        }
                    });
                    // Extract forms
                    $('form').each((_, element) => {
                        const action = $(element).attr('action') || '';
                        const method = $(element).attr('method') || 'GET';
                        const inputs = [];
                        $(element).find('input, textarea, select').each((_, input) => {
                            const type = $(input).attr('type') || $(input).prop('tagName')?.toLowerCase() || 'input';
                            const name = $(input).attr('name') || '';
                            inputs.push(`${type}${name ? `:${name}` : ''}`);
                        });
                        content.forms.push({
                            action,
                            method: method.toUpperCase(),
                            inputs,
                        });
                    });
                    // Extract scripts
                    $('script[src]').each((_, element) => {
                        const src = $(element).attr('src');
                        if (src) {
                            try {
                                const absoluteUrl = new url_1.URL(src, currentUrl).href;
                                content.scripts.push(absoluteUrl);
                            }
                            catch {
                                // Skip invalid URLs
                            }
                        }
                    });
                    results.push(content);
                    console.log(`✅ Scraped page ${results.length}: ${currentUrl}`);
                }
                catch (pageError) {
                    console.error(`❌ Failed to scrape ${currentUrl}:`, pageError);
                    continue;
                }
            }
            if (onProgress) {
                onProgress({
                    currentPage: 'Completed',
                    completed: results.length,
                    total: results.length,
                });
            }
            console.log(`✅ Fallback HTTP scraping completed: ${results.length} pages`);
            return results;
        }
        catch (error) {
            console.error('❌ Fallback HTTP scraping failed:', error);
            // Return minimal content to prevent complete failure
            return [{
                    url,
                    title: 'Scan Failed',
                    metaDescription: 'Scan failed due to technical issues',
                    headings: {
                        h1: ['Website scan could not be completed'],
                        h2: [],
                        h3: [],
                    },
                    paragraphs: ['The website could not be accessed due to technical restrictions or connectivity issues.'],
                    links: [],
                    images: [],
                    forms: [],
                    scripts: [],
                }];
        }
    }
}
exports.WebScraper = WebScraper;
