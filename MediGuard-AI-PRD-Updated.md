# MediGuard AI - Product Requirements Document (PRD)

**Version:** 2.0.0  
**Last Updated:** November 22, 2025  
**Status:** Simplified MVP - Real Website Scanning Focus

---

## Executive Summary

MediGuard AI is a real-time AHPRA compliance platform designed specifically for Australian medical and aesthetic practitioners. The platform helps practitioners ensure their digital marketing and website content comply with Australian healthcare regulations (AHPRA National Law, TGA Code, and ACL) through actual website content analysis.

**Core Value Proposition:**
- Scan real website content automatically with AI-powered analysis
- Identify compliance violations with specific location and context
- Receive actionable, ready-to-publish compliant alternatives
- Reduce legal and regulatory risk in healthcare marketing
- Save time on compliance review processes

---

## Problem Statement

### The Challenge
Australian medical and aesthetic practitioners face significant regulatory complexity:
- **AHPRA National Law** (Section 133) prohibits misleading advertising, guarantees, testimonials, and inducements
- **TGA Code** restricts advertising of therapeutic goods
- **Australian Consumer Law (ACL)** Section 18 prohibits misleading or deceptive conduct
- Non-compliance can result in: regulatory action, fines, license suspension, or legal liability

### Current Pain Points
1. **Compliance Uncertainty**: Practitioners don't know if their marketing violates regulations
2. **Resource Intensive**: Manual compliance review requires legal expertise and time
3. **Reactive vs. Proactive**: Most catch violations after publication (too late)
4. **Inconsistent Standards**: Different practitioners interpret rules differently
5. **Mock Analysis**: Existing tools don't analyze actual website content

### Solution Overview
MediGuard AI provides:
- **Real Website Content Scanning** of actual live websites
- **AI-Powered Analysis** with context-aware violation detection
- **Multi-Page Analysis** covering entire website structure
- **Actionable Recommendations** with ready-to-use compliant alternatives
- **Regulation-Specific Guidance** tied to actual AHPRA/TGA/ACL rules

---

## Product Objectives

### Primary Objectives
1. **Real Content Analysis** - Scan actual website content, not mock data
2. **Reduce Compliance Risk** - Identify violations before they cause issues
3. **Improve Efficiency** - Automate compliance review process
4. **Enable Self-Service** - Practitioners can check compliance independently
5. **Build Trust** - Provide confidence in marketing content

### Secondary Objectives
1. **Create Audit Trail** - Maintain records of compliance checks
2. **Support Continuous Improvement** - Track compliance trends over time
3. **Ensure Accuracy** - Minimize false positives/negatives
4. **Enable Scalability** - Support high-volume scanning

---

## Core Features

### Feature 1: Real Website Scanner

#### Purpose
Scan a medical/aesthetic practice website and identify all AHPRA/TGA/ACL compliance violations from actual website content.

#### User Flow
1. User enters website URL
2. System discovers all pages (sitemap + internal links)
3. AI extracts content from each page using web scraping
4. System analyzes real content against compliance rules
5. Results displayed with specific violations and page locations
6. User can export comprehensive report as PDF

#### Implementation Status
- ✅ **Real Content Extraction**: Puppeteer + Cheerio integration
- ✅ **Multi-Page Discovery**: Sitemap parsing + link crawling
- ✅ **JavaScript Rendering**: Dynamic content support
- ✅ **Content Categorization**: Service pages, about pages, contact forms
- ✅ **Violation Detection**: Context-aware AI analysis
- ✅ **Results Dashboard**: Visual violation mapping
- ✅ **PDF Export**: Professional compliance reports

#### Data Captured
```
Scan Record:
- scanId (unique identifier)
- url (website scanned)
- status (pending/processing/completed/failed)
- pagesScanned (number of pages analyzed)
- violationsFound (total count)
- scanResults (JSON array of violations with page context)
- contentExtracted (JSON of all extracted content)
- createdAt (timestamp)
- expiresAt (auto-cleanup after 24 hours)
```

#### Enhanced Violation Structure
```json
{
  "type": "prohibited_inducement",
  "rule": "National Law, Section 133(1)(e)",
  "severity": "high",
  "pageUrl": "https://example.com/services/invisalign",
  "pageTitle": "Invisalign Treatment - Best Dental Clinic",
  "originalText": "Save $500 on Invisalign this week only!",
  "context": "Service pricing section",
  "issue": "Time-limited discount offer encourages unnecessary use",
  "suggestion": "Remove discount and time urgency. Focus on service quality instead.",
  "compliantRewrite": "Invisalign treatment available. Contact us to discuss your orthodontic options with our qualified dental team.",
  "location": {
    "selector": ".pricing-banner h2",
    "xpath": "//div[@class='pricing-banner']//h2[1]"
  }
}
```

#### Web Scraping Engine

**Technology Stack:**
- **Puppeteer**: JavaScript rendering and dynamic content
- **Cheerio**: Fast HTML parsing for static content
- **Content Extraction**: Text, images, forms, metadata, scripts

**Scanning Configuration:**
```typescript
interface ScanConfiguration {
  maxPages: number; // Default: 10
  maxDepth: number; // Default: 2
  includeSubdomains: boolean; // Default: false
  excludePatterns: string[]; // ['/admin', '/login', etc.]
  timeout: number; // Default: 30000ms
  respectRobotsTxt: boolean; // Default: true
}
```

**Content Extraction:**
```typescript
interface WebsiteContent {
  url: string;
  title: string;
  metaDescription: string;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  paragraphs: string[];
  links: { text: string; href: string; isInternal: boolean }[];
  images: { src: string; alt: string; title?: string }[];
  forms: { action: string; method: string; inputs: string[] }[];
  scripts: string[]; // Marketing tracking scripts
}
```

---

### Feature 2: Safe-Harbour Ad Creator

#### Purpose
Draft marketing copy and receive AI-filtered, compliance-checked version ready for publication.

#### User Flow
1. User inputs raw ad copy or marketing text
2. System analyzes content against compliance rules using AI
3. AI identifies violations and generates compliant alternatives
4. Results show side-by-side comparison with explanations
5. User can copy compliant version or export as PDF

#### Implementation Status
- ✅ Ad content input form with rich text editor
- ✅ Real-time compliance checking with AI
- ✅ Context-aware violation detection
- ✅ Side-by-side comparison display
- ✅ Copy-to-clipboard functionality
- ✅ PDF export functionality
- ✅ Session-based storage (no user accounts needed)

#### Data Captured
```
Ad Draft Record:
- draftId (unique identifier)
- sessionId (browser session)
- originalContent (raw input)
- compliantContent (AI-generated compliant version)
- violationsDetected (array of issues found and fixed)
- status (checked/approved)
- createdAt (timestamp)
- expiresAt (auto-cleanup after 24 hours)
```

---

## Technical Architecture

### Simplified Stack (No Authentication)

#### Frontend Stack
- **Framework:** React 19 with TypeScript
- **Routing:** React Router (standard routing)
- **UI Components:** shadcn/ui + Tailwind CSS 4
- **State Management:** React Query + useState
- **Styling:** Tailwind CSS with custom design tokens
- **PDF Export:** Server-side PDF generation
- **Session Management:** Browser sessionStorage for temporary data

#### Backend Stack
- **Runtime:** Node.js with TypeScript
- **API Framework:** Express.js (RESTful API)
- **Database:** SQLite (development) / PostgreSQL (production)
- **AI/LLM:** OpenAI GPT-4 API
- **Web Scraping:** Puppeteer + Cheerio
- **PDF Generation:** Puppeteer PDF export

### Database Schema (Simplified)

#### Scans Table
```sql
CREATE TABLE scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url VARCHAR(2048) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  violations_found INTEGER DEFAULT 0,
  pages_scanned INTEGER DEFAULT 0,
  scan_results TEXT, -- JSON string of violations
  content_extracted TEXT, -- JSON string of extracted content
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME -- Auto-cleanup after 24 hours
);
```

#### Ad Drafts Table
```sql
CREATE TABLE ad_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id VARCHAR(255), -- Browser session ID
  original_content TEXT,
  compliant_content TEXT,
  violations_detected TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME -- Auto-cleanup after 24 hours
);
```

### API Endpoints

#### Scanner Endpoints
```typescript
// Start a new website scan
POST /api/scanner/start
Input: { url: string, config?: ScanConfiguration }
Output: { scanId: number, status: "pending" }

// Get scan results
GET /api/scanner/:scanId
Output: {
  scanId: number,
  url: string,
  status: "pending" | "processing" | "completed" | "failed",
  pagesScanned: number,
  violationsFound: number,
  violations: Violation[],
  createdAt: string
}

// Get scan progress
GET /api/scanner/:scanId/progress
Output: {
  scanId: number,
  status: string,
  progress: number, // 0-100
  currentPage: string,
  pagesCompleted: number,
  totalPages: number
}
```

#### Ad Creator Endpoints
```typescript
// Check ad content for compliance
POST /api/ad-creator/check
Input: { content: string, sessionId: string }
Output: {
  draftId: number,
  originalContent: string,
  compliantContent: string,
  violationsDetected: ComplianceIssue[],
  status: "checked"
}

// Get draft by session
GET /api/ad-creator/session/:sessionId
Output: { drafts: AdDraft[] }
```

---

## Compliance Rules Engine

### Enhanced Rule Categories

#### 1. Prohibited Inducements (Section 133(1)(e))
**Definition:** Offering gifts, discounts, or inducements to encourage use of regulated health services

**AI Detection Patterns:**
- Price-based inducements: "$X off", "Save money", "Discount", "Special price"
- Time-limited offers: "Limited time", "This week only", "Book now"
- Free services with conditions: "Free consultation*", "Complimentary treatment"
- Competitive pricing: "Cheapest", "Best value", "Lowest price"

**Context Considerations:**
- Service type (surgical vs. non-surgical)
- Target audience (patients vs. professionals)
- Page context (pricing vs. educational)

#### 2. Misleading/Deceptive Claims (Section 133(1)(a) & (b))
**Definition:** Making false or misleading statements about health services

**AI Detection Patterns:**
- Guarantee language: "Guaranteed results", "100% success", "Promise"
- Superlative claims: "Best", "Leading", "Number 1", "Most advanced"
- Unsubstantiated claims: "Clinically proven", "Scientifically tested"
- Comparative claims: "Better than", "Superior to", "Outperforms"

**Context Analysis:**
- Evidence requirements for claims
- Qualification of statements
- Disclaimer presence and adequacy

#### 3. Prohibited Testimonials (Section 133(1)(c))
**Definition:** Using patient testimonials or endorsements

**AI Detection Patterns:**
- Patient quotes: Direct speech marks with patient attribution
- Before/after photos: Image analysis for patient results
- Review content: "Patient says", "Customer review", "Success story"
- Celebrity endorsements: Public figure mentions

**Visual Content Analysis:**
- Before/after photo detection
- Patient identification in images
- Testimonial video content

#### 4. Unreasonable Expectations (Section 133(1)(d))
**Definition:** Creating unreasonable expectation of beneficial treatment

**AI Detection Patterns:**
- Permanence claims: "Permanent", "Forever", "Lifetime results"
- Universal success: "Works for everyone", "Always effective"
- Exaggerated outcomes: "Miraculous", "Life-changing", "Perfect results"
- Timeline promises: "Instant results", "Overnight transformation"

#### 5. Therapeutic Goods (TGA Code Section 12)
**Definition:** Advertising therapeutic goods requires compliance

**AI Detection Patterns:**
- Therapeutic claims: "Treats", "Cures", "Heals", "Prevents"
- Medical device claims: Unregistered device benefits
- Ingredient claims: Unsubstantiated active ingredient benefits
- Comparative therapeutic claims: "More effective than"

#### 6. Consumer Law (ACL Section 18)
**Definition:** General prohibition on misleading or deceptive conduct

**AI Detection Patterns:**
- False availability: "Limited stock", "Few appointments left"
- Misleading pricing: Hidden fees, unclear total costs
- False urgency: "Act now", "Don't miss out"
- Deceptive practices: Bait and switch, hidden conditions

---

## Implementation Roadmap

### Week 1-2: Web Scraping Foundation
- [ ] Set up Puppeteer + Cheerio integration
- [ ] Implement URL validation and normalization
- [ ] Build page discovery system (sitemap + internal links)
- [ ] Create content extraction pipeline
- [ ] Add error handling and retries
- [ ] Test with 10+ real medical websites

### Week 3-4: AI Compliance Engine
- [ ] Integrate OpenAI GPT-4 API
- [ ] Develop compliance rule prompts
- [ ] Implement context-aware violation detection
- [ ] Add severity ranking system
- [ ] Create compliant content generation
- [ ] Test accuracy with known violations

### Week 5-6: Results Dashboard & Export
- [ ] Build scan results visualization
- [ ] Implement violation mapping by page
- [ ] Add before/after content comparison
- [ ] Create PDF export with Puppeteer
- [ ] Add progress tracking for long scans
- [ ] Implement session-based data storage

### Week 7-8: Performance & Optimization
- [ ] Add concurrent scanning limits
- [ ] Implement scan queue management
- [ ] Optimize content extraction speed
- [ ] Add caching for repeated scans
- [ ] Implement automatic cleanup
- [ ] Load testing and optimization

---

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=./mediguard.db  # SQLite for development
# DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL for production

# AI Service
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4000

# Web Scraping
PUPPETEER_HEADLESS=true
SCRAPING_TIMEOUT=30000
MAX_PAGES_PER_SCAN=10
MAX_CONCURRENT_SCANS=3
USER_AGENT=MediGuard-AI-Scanner/2.0

# Security & Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10   # 10 scans per 15 minutes
CORS_ORIGIN=http://localhost:3000

# Data Cleanup
SCAN_RETENTION_HOURS=24
CLEANUP_INTERVAL_HOURS=6
```

---

## Performance Targets

### Scanning Performance
- **Single Page Analysis**: < 5 seconds
- **Multi-Page Scan (10 pages)**: < 60 seconds
- **Content Extraction**: < 2 seconds per page
- **AI Analysis**: < 10 seconds per page
- **PDF Generation**: < 5 seconds

### System Performance
- **Concurrent Scans**: Maximum 3 simultaneous
- **Memory Usage**: < 1GB per scan process
- **Database Size**: Auto-cleanup after 24 hours
- **API Response Time**: < 2 seconds for status checks

---

## Testing Strategy

### Automated Testing
- **Unit Tests**: Content extraction, compliance rules, API endpoints
- **Integration Tests**: End-to-end scanning workflow
- **Performance Tests**: Load testing with multiple concurrent scans
- **AI Accuracy Tests**: Validation against known compliance violations

### Manual Testing
- **Real Website Testing**: 50+ Australian medical practice websites
- **Compliance Accuracy**: Validation with legal compliance experts
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge
- **Mobile Responsiveness**: Tablet and mobile device testing

### Test Coverage Targets
- **Backend Logic**: 90% code coverage
- **API Endpoints**: 100% endpoint coverage
- **Compliance Rules**: 95% rule coverage
- **Error Scenarios**: 80% error path coverage

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Scan Volume**: Limited to 10 pages per scan (configurable)
2. **Concurrent Processing**: Maximum 3 simultaneous scans
3. **Content Types**: Text-based content only (no OCR for images)
4. **Authentication**: No user accounts or scan history
5. **Real-time Updates**: Polling-based progress updates

### Planned Enhancements
1. **Image Text Analysis**: OCR for text within images
2. **Video Content Analysis**: Transcript analysis for video content
3. **Multi-language Support**: Non-English content analysis
4. **Advanced Reporting**: Trend analysis and benchmarking
5. **API Integration**: Webhook notifications for completed scans

---

## Security Considerations

### Data Protection
- **Temporary Storage**: All scan data expires after 24 hours
- **No Personal Data**: No user accounts or personal information stored
- **Secure Scraping**: Respects robots.txt and rate limiting
- **API Security**: Rate limiting and input validation

### Compliance & Privacy
- **Website Respect**: Follows robots.txt and crawl-delay directives
- **No Data Retention**: Automatic cleanup of all scan data
- **Secure Communication**: HTTPS for all API communications
- **Error Logging**: No sensitive data in application logs

---

## Deployment Strategy

### Development Environment
- **Local Development**: SQLite database, local Puppeteer
- **Testing**: Docker containers for consistent environment
- **CI/CD**: Automated testing on pull requests

### Production Deployment Options

#### Option A: Vercel + PlanetScale (Recommended)
- **Frontend**: Vercel static hosting
- **Backend**: Vercel Serverless Functions
- **Database**: PlanetScale (MySQL-compatible)
- **Benefits**: Automatic scaling, easy deployment

#### Option B: AWS Full Stack
- **Frontend**: AWS Amplify or CloudFront + S3
- **Backend**: AWS Lambda + API Gateway
- **Database**: AWS RDS (PostgreSQL)
- **Benefits**: Enterprise-grade, full AWS ecosystem

#### Option C: Traditional VPS
- **Platform**: DigitalOcean, Linode, or Hetzner
- **Setup**: Docker containers with nginx reverse proxy
- **Database**: Self-managed PostgreSQL
- **Benefits**: Cost-effective, full control

### Cost Estimation (Monthly)

#### Hosting Costs
- **Vercel Pro**: $20/month (frontend + serverless functions)
- **PlanetScale**: $29/month (database)
- **Total Hosting**: ~$50/month

#### AI Service Costs
- **OpenAI GPT-4**: ~$0.03/1K tokens
- **Estimated Usage**: 2M tokens/month = $60
- **Total AI**: ~$60/month

#### Additional Services
- **Monitoring**: $10/month
- **Backup**: $5/month
- **Total Additional**: ~$15/month

**Total Estimated Cost**: $125/month

---

## Success Metrics

### Technical Metrics
- **Scan Accuracy**: >95% correct violation detection
- **Performance**: <60 seconds for 10-page scans
- **Uptime**: >99.5% system availability
- **Error Rate**: <2% failed scans

### Business Metrics
- **User Adoption**: Number of scans per month
- **Compliance Improvement**: Reduction in violations over time
- **User Satisfaction**: Feedback scores and usage patterns
- **Cost Efficiency**: Cost per scan analysis

---

## Conclusion

This updated MediGuard AI PRD removes all dependencies on proprietary platforms and focuses on delivering real website content scanning with AI-powered compliance analysis. The simplified architecture enables rapid development while maintaining the core value proposition of helping Australian medical practitioners ensure AHPRA compliance.

The system is designed to be:
- **Independent**: No external platform dependencies
- **Scalable**: Can handle increasing scan volumes
- **Accurate**: Real content analysis with AI-powered detection
- **User-Friendly**: Simple interface with actionable results
- **Cost-Effective**: Transparent pricing with standard cloud services

Ready for implementation with a clear 8-week development timeline.