# MediAlert: Render → Vercel Migration Guide

## 🎯 **Migration Overview**

Moving from Render to Vercel requires architectural changes due to Vercel's serverless nature. Your current Express.js server needs to be adapted for Vercel's Edge/Serverless Functions.

## 📊 **Current vs Target Architecture**

### **Current (Render)**
- Full Express.js server running continuously
- PostgreSQL database with persistent connections
- Puppeteer with Chrome for scanning and PDF generation
- Background cleanup scheduler
- Long-running scan processes

### **Target (Vercel)**
- Serverless/Edge Functions for API endpoints
- External database (PlanetScale, Supabase, or Neon)
- Serverless-compatible scanning approach
- Event-driven cleanup
- Stateless operations

## 🚀 **Migration Approaches**

### **Option 1: Full Serverless Migration (Recommended)**

#### **Pros:**
- ✅ Cost-effective (pay per request)
- ✅ Auto-scaling
- ✅ Global edge distribution
- ✅ Zero server management
- ✅ Excellent frontend performance

#### **Cons:**
- ⚠️ 10-second function timeout limit
- ⚠️ No persistent connections
- ⚠️ Limited Puppeteer support
- ⚠️ Requires architectural changes

#### **Implementation Steps:**

1. **Convert Express routes to Vercel API routes**
2. **Replace Puppeteer with external services**
3. **Implement stateless scanning**
4. **Use external database with connection pooling**
5. **Replace background jobs with webhooks/cron**

### **Option 2: Hybrid Approach**

#### **Architecture:**
- **Frontend**: Vercel (React app)
- **API**: Vercel Functions (lightweight endpoints)
- **Heavy Processing**: External service (Railway, Fly.io, or AWS Lambda)
- **Database**: External (PlanetScale, Supabase)

### **Option 3: Keep Current Architecture on Alternative Platform**

If you prefer minimal changes, consider:
- **Railway**: Similar to Render, better performance
- **Fly.io**: Global deployment, Docker-based
- **DigitalOcean App Platform**: Simple deployment
- **AWS App Runner**: Managed container service

## 🛠 **Detailed Migration Plan (Option 1)**

### **Step 1: Project Structure Changes**

```
medialert-vercel/
├── api/                          # Vercel API routes
│   ├── health.ts
│   ├── scanner/
│   │   ├── start.ts
│   │   ├── [id].ts
│   │   └── [id]/progress.ts
│   └── ad-creator/
│       └── check.ts
├── lib/                          # Shared utilities
│   ├── database.ts
│   ├── compliance-analyzer.ts
│   └── web-scraper.ts
├── src/                          # Frontend (unchanged)
└── vercel.json                   # Vercel configuration
```

### **Step 2: Database Migration**

#### **Option A: PlanetScale (Recommended)**
```bash
# Install PlanetScale CLI
npm install -g @planetscale/cli

# Create database
pscale database create medialert

# Create connection string
pscale connect medialert main --port 3309
```

#### **Option B: Supabase**
```bash
# Create project at supabase.com
# Get connection string from dashboard
```

#### **Option C: Neon**
```bash
# Create project at neon.tech
# Serverless PostgreSQL with connection pooling
```

### **Step 3: Replace Puppeteer**

#### **Option A: Browserless.io (Recommended)**
```typescript
// lib/web-scraper-serverless.ts
import axios from 'axios';

export class ServerlessWebScraper {
  private browserlessToken = process.env.BROWSERLESS_TOKEN;
  
  async scrapePage(url: string) {
    const response = await axios.post(
      `https://chrome.browserless.io/content?token=${this.browserlessToken}`,
      {
        url,
        waitFor: 2000,
        gotoOptions: {
          waitUntil: 'networkidle2'
        }
      }
    );
    
    return response.data;
  }
}
```

#### **Option B: ScrapingBee**
```typescript
import axios from 'axios';

export class ScrapingBeeService {
  async scrapePage(url: string) {
    const response = await axios.get('https://app.scrapingbee.com/api/v1/', {
      params: {
        api_key: process.env.SCRAPINGBEE_API_KEY,
        url: url,
        render_js: 'true',
        wait: 2000
      }
    });
    
    return response.data;
  }
}
```

### **Step 4: API Route Conversion**

#### **Convert Express routes to Vercel API routes:**

```typescript
// api/scanner/start.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../../lib/database';
import { ServerlessWebScraper } from '../../lib/web-scraper-serverless';

const startScanSchema = z.object({
  url: z.string().url(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = startScanSchema.parse(req.body);
    const scanId = uuidv4();
    
    const db = await getDatabase();
    
    // Create scan record
    await db.query(
      'INSERT INTO scans (id, url, status, created_at) VALUES ($1, $2, $3, $4)',
      [scanId, url, 'pending', new Date()]
    );

    // Start async scanning (trigger background function)
    await triggerScanProcess(scanId, url);

    res.status(201).json({
      scanId,
      status: 'pending',
      message: 'Scan started successfully'
    });

  } catch (error) {
    console.error('Scan start error:', error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
}

async function triggerScanProcess(scanId: string, url: string) {
  // Option 1: Use Vercel Cron or external webhook
  // Option 2: Queue system (Upstash Redis, AWS SQS)
  // Option 3: Immediate processing (within timeout limits)
  
  const scraper = new ServerlessWebScraper();
  const content = await scraper.scrapePage(url);
  
  // Process and save results...
}
```

### **Step 5: PDF Generation**

#### **Replace Puppeteer PDF with:**

```typescript
// lib/pdf-generator-serverless.ts
import PDFDocument from 'pdfkit';

export class ServerlessPDFGenerator {
  async generateComplianceReport(data: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Generate PDF content (your existing PDFKit code)
      this.addContent(doc, data);
      doc.end();
    });
  }

  private addContent(doc: PDFDocument, data: any) {
    // Your existing PDF generation logic
  }
}
```

### **Step 6: Environment Configuration**

```typescript
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "DATABASE_URL": "@database-url",
    "OPENAI_API_KEY": "@openai-api-key",
    "BROWSERLESS_TOKEN": "@browserless-token"
  },
  "build": {
    "env": {
      "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD": "true"
    }
  }
}
```

## 💰 **Cost Comparison**

### **Render (Current)**
- **Starter Plan**: $7/month
- **PostgreSQL**: $7/month
- **Total**: ~$14/month

### **Vercel + External Services**
- **Vercel Pro**: $20/month (if needed)
- **PlanetScale**: $29/month (Scaler plan)
- **Browserless.io**: $15/month (Starter)
- **Total**: ~$64/month

### **Cost Optimization Options**
- **Vercel Hobby**: Free (with limits)
- **Supabase**: Free tier available
- **ScrapingBee**: $29/month (cheaper than Browserless)

## ⚡ **Performance Considerations**

### **Advantages of Vercel**
- **Global CDN**: Faster frontend loading
- **Edge Functions**: Lower latency
- **Auto-scaling**: Handle traffic spikes
- **Optimized builds**: Better caching

### **Potential Issues**
- **Cold starts**: First request latency
- **Timeout limits**: 10-second max execution
- **Memory limits**: 1GB max per function
- **Concurrent limits**: Based on plan

## 🔧 **Migration Checklist**

### **Pre-Migration**
- [ ] Backup current database
- [ ] Test external scraping services
- [ ] Set up new database (PlanetScale/Supabase)
- [ ] Create Vercel project
- [ ] Configure environment variables

### **Migration Steps**
- [ ] Convert API routes to Vercel functions
- [ ] Replace Puppeteer with external service
- [ ] Update database connection logic
- [ ] Implement serverless PDF generation
- [ ] Update frontend API calls (if needed)
- [ ] Configure domain and SSL

### **Post-Migration**
- [ ] Monitor function performance
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics
- [ ] Test all functionality
- [ ] Update documentation

## 🚨 **Potential Challenges**

### **Technical Challenges**
1. **Timeout Limits**: Long scans may exceed 10-second limit
2. **Cold Starts**: First requests may be slower
3. **Stateless Nature**: No persistent connections or background jobs
4. **Memory Constraints**: Large PDF generation may hit limits

### **Solutions**
1. **Async Processing**: Use queues for long operations
2. **Warming Functions**: Keep functions warm with cron jobs
3. **External Services**: Offload heavy processing
4. **Streaming**: Stream large responses

## 🎯 **Recommendation**

Based on your current architecture, I recommend:

### **Short-term (Quick Win)**
Stay with **Render** or migrate to **Railway** for minimal changes and better performance.

### **Long-term (Scalability)**
Migrate to **Vercel** with the hybrid approach:
- Frontend on Vercel
- API on Vercel Functions (lightweight)
- Heavy processing on Railway/Fly.io
- Database on PlanetScale

This gives you the best of both worlds: Vercel's excellent frontend performance with the flexibility to handle complex backend operations.

## 📞 **Next Steps**

Would you like me to:
1. **Create the Vercel migration files** for your project?
2. **Set up the hybrid architecture** with external services?
3. **Help you evaluate alternative platforms** like Railway or Fly.io?
4. **Optimize your current Render setup** instead?

Let me know your preference and I'll provide detailed implementation!