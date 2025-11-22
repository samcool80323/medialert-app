# MediGuard AI - AHPRA Compliance Platform

![MediGuard AI Logo](https://img.shields.io/badge/MediGuard-AI-blue?style=for-the-badge&logo=shield&logoColor=white)

**Version:** 2.0.0  
**Status:** Production Ready  
**License:** MIT

MediGuard AI is a comprehensive AHPRA compliance platform designed specifically for Australian medical and aesthetic practitioners. The platform helps practitioners ensure their digital marketing and website content comply with Australian healthcare regulations through real website scanning and AI-powered analysis.

## 🚀 Features

### ✅ Real Website Scanning
- **Multi-Page Analysis**: Scans up to 10 pages from your website
- **JavaScript Rendering**: Handles dynamic content with Puppeteer
- **Content Categorization**: Intelligently categorizes content by page type
- **Violation Location Mapping**: Pinpoints exact location of compliance issues

### 🤖 AI-Powered Compliance Analysis
- **Context-Aware Detection**: Understands content context to minimize false positives
- **Comprehensive Rule Coverage**: AHPRA National Law, TGA Code, ACL compliance
- **Severity Assessment**: Ranks violations by priority (Critical, High, Medium, Low)
- **Ready-to-Use Rewrites**: Generates compliant alternatives for every violation

### 📋 Safe-Harbour Ad Creator
- **Real-Time Analysis**: Instant compliance checking for marketing copy
- **Side-by-Side Comparison**: Original vs compliant content display
- **Copy-to-Clipboard**: Easy content copying for immediate use
- **Violation Explanations**: Detailed explanations of why content violates regulations

### 📊 Professional Reporting
- **Detailed PDF Reports**: Professional compliance reports
- **Violation Breakdown**: Organized by severity and regulation type
- **Implementation Guidance**: Step-by-step fix instructions
- **Progress Tracking**: Real-time scan progress updates

## 🏗️ Architecture

### Frontend Stack
- **React 19** with TypeScript
- **React Router** for client-side routing
- **React Query** for server state management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend Stack
- **Node.js** with TypeScript
- **Express.js** RESTful API
- **SQLite** database (development) / **PostgreSQL** (production)
- **Puppeteer** for web scraping
- **Cheerio** for HTML parsing
- **OpenAI GPT-4** for AI analysis

### Key Components
```
src/
├── client/                 # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   └── shared/           # Shared types and utilities
├── server/               # Backend Node.js application
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── middleware/      # Express middleware
│   └── database/        # Database configuration
└── shared/              # Shared types between frontend/backend
```

## 🚦 Getting Started

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** or **yarn**
- **OpenAI API Key** (for AI analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/mediguard-ai.git
   cd mediguard-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Required: Add your OpenAI API key
   OPENAI_API_KEY=your-openai-api-key-here
   
   # Optional: Customize other settings
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=./mediguard.db
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

## 📖 Usage Guide

### Website Scanner

1. **Navigate to Scanner**: Go to `/scanner` or click "Website Scanner" in the navigation
2. **Enter URL**: Input the medical practice website URL to scan
3. **Start Scan**: Click "Start Compliance Scan" to begin analysis
4. **View Results**: Review violations with severity levels and compliant alternatives
5. **Export Report**: Generate PDF report for documentation

### Ad Creator

1. **Navigate to Ad Creator**: Go to `/ad-creator` or click "Ad Creator" in the navigation
2. **Input Content**: Paste your marketing copy or ad content
3. **Analyze**: Click "Check Compliance" for AI analysis
4. **Review Results**: See violations found and compliant rewrites
5. **Copy Content**: Use the compliant version for your marketing

## 🔧 API Documentation

### Scanner Endpoints

#### Start Website Scan
```http
POST /api/scanner/start
Content-Type: application/json

{
  "url": "https://example-medical-practice.com.au",
  "config": {
    "maxPages": 10,
    "maxDepth": 2,
    "respectRobotsTxt": true
  }
}
```

#### Get Scan Results
```http
GET /api/scanner/{scanId}
```

#### Get Scan Progress
```http
GET /api/scanner/{scanId}/progress
```

### Ad Creator Endpoints

#### Check Content Compliance
```http
POST /api/ad-creator/check
Content-Type: application/json

{
  "content": "Your marketing content here",
  "sessionId": "unique-session-id"
}
```

## 🛡️ Compliance Rules

### AHPRA National Law Section 133
- **Prohibited Inducements** (133(1)(e)): Discounts, special offers, time-limited deals
- **Misleading Claims** (133(1)(a)(b)): Guaranteed outcomes, unsubstantiated claims
- **Prohibited Testimonials** (133(1)(c)): Patient testimonials, before/after photos
- **Unreasonable Expectations** (133(1)(d)): Exaggerated outcome claims

### TGA Code Section 12
- **Therapeutic Goods**: Unsubstantiated therapeutic claims
- **Required Disclaimers**: Missing mandatory disclaimers
- **Restricted Language**: Prohibited therapeutic terminology

### Australian Consumer Law Section 18
- **Misleading Conduct**: False or deceptive marketing practices
- **False Representations**: Incorrect pricing or availability claims
- **Consumer Protection**: General consumer protection violations

## 🔒 Security & Privacy

### Data Protection
- **Temporary Storage**: All scan data expires after 24 hours
- **No Personal Data**: No user accounts or personal information stored
- **Secure Communication**: HTTPS for all API communications
- **Rate Limiting**: Prevents abuse with configurable limits

### Compliance Considerations
- **Robots.txt Respect**: Follows website crawling guidelines
- **No Data Retention**: Automatic cleanup of all scan data
- **Secure Scraping**: Respectful crawling with delays and limits

## 🚀 Deployment

### Recommended Hosting Options

#### Option A: Vercel + PlanetScale
```bash
# Deploy frontend to Vercel
vercel --prod

# Deploy backend to Vercel Functions
# Configure PlanetScale database
```

#### Option B: AWS Full Stack
```bash
# Frontend: AWS Amplify or S3 + CloudFront
# Backend: AWS Lambda + API Gateway
# Database: AWS RDS PostgreSQL
```

#### Option C: Traditional VPS
```bash
# Use Docker for containerized deployment
docker build -t mediguard-ai .
docker run -p 3001:3001 mediguard-ai
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=your-production-api-key
CORS_ORIGIN=https://your-domain.com
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "compliance"
```

### Test Coverage
- **Backend Logic**: 90% code coverage
- **API Endpoints**: 100% endpoint coverage
- **Compliance Rules**: 95% rule coverage
- **Error Scenarios**: 80% error path coverage

## 📊 Performance

### Benchmarks
- **Single Page Analysis**: < 5 seconds
- **Multi-Page Scan (10 pages)**: < 60 seconds
- **AI Analysis**: < 10 seconds per page
- **PDF Generation**: < 5 seconds

### Optimization Features
- **Concurrent Scanning**: Maximum 3 simultaneous scans
- **Memory Management**: Automatic browser cleanup
- **Rate Limiting**: Prevents API abuse
- **Caching**: Intelligent content caching

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React and Node.js
- **Prettier**: Code formatting
- **Conventional Commits**: Commit message format

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

MediGuard AI is a compliance assistance tool designed to help identify potential regulatory issues in healthcare marketing content. While we strive for accuracy and keep our analysis updated with current regulations, this tool does not constitute legal advice. 

**The final responsibility for compliance with AHPRA, TGA, and ACL regulations remains with the practitioner.** We recommend consulting with qualified legal professionals for specific compliance matters and complex regulatory questions.

## 📞 Support

### Documentation
- **API Docs**: [/docs/api](./docs/api.md)
- **User Guide**: [/docs/user-guide](./docs/user-guide.md)
- **Deployment Guide**: [/docs/deployment](./docs/deployment.md)

### Community
- **Issues**: [GitHub Issues](https://github.com/your-org/mediguard-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mediguard-ai/discussions)
- **Email**: support@mediguard-ai.com

### Resources
- [AHPRA Advertising Guidelines](https://www.ahpra.gov.au/Publications/Advertising-resources/Advertising-guidelines.aspx)
- [TGA Advertising Code](https://www.tga.gov.au/resources/resource/guidance/advertising-therapeutic-goods-guidance)
- [ACL Guidelines](https://www.accc.gov.au/business/advertising-promoting-your-business/false-or-misleading-claims)

---

**Built with ❤️ for Australian Healthcare Professionals**

*Ensuring compliance, enabling growth.*