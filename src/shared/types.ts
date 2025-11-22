// Shared types between frontend and backend

export interface WebsiteContent {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  links: {
    text: string;
    href: string;
    isInternal: boolean;
  }[];
  images: {
    src: string;
    alt: string;
    title?: string;
  }[];
  forms: {
    action: string;
    method: string;
    inputs: string[];
  }[];
  scripts: string[];
}

export interface ComplianceViolation {
  id: string;
  type: 'prohibited_inducement' | 'misleading_claims' | 'prohibited_testimonials' | 'unreasonable_expectations' | 'therapeutic_goods' | 'consumer_law';
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pageUrl: string;
  pageTitle: string;
  originalText: string;
  context: string;
  issue: string;
  suggestion: string;
  compliantRewrite: string;
  location: {
    selector?: string;
    xpath?: string;
  };
}

export interface ScanConfiguration {
  maxPages: number;
  maxDepth: number;
  includeSubdomains: boolean;
  excludePatterns: string[];
  timeout: number;
  respectRobotsTxt: boolean;
}

export interface ScanRecord {
  id: number;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  violationsFound: number;
  pagesScanned: number;
  scanResults: ComplianceViolation[];
  contentExtracted: WebsiteContent[];
  createdAt: string;
  expiresAt: string;
  progress?: {
    currentPage: string;
    pagesCompleted: number;
    totalPages: number;
    percentage: number;
  };
}

export interface AdDraft {
  id: number;
  sessionId: string;
  originalContent: string;
  compliantContent: string;
  violationsDetected: ComplianceIssue[];
  status: 'draft' | 'checked' | 'approved';
  createdAt: string;
  expiresAt: string;
}

export interface ComplianceIssue {
  type: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  originalText: string;
  issue: string;
  suggestion: string;
  compliantRewrite: string;
}

export interface ComplianceRule {
  id: string;
  category: 'inducement' | 'misleading' | 'testimonial' | 'expectation' | 'therapeutic' | 'consumer';
  regulation: 'AHPRA_133' | 'TGA_12' | 'ACL_18';
  severity: 'critical' | 'high' | 'medium' | 'low';
  patterns: {
    keywords: string[];
    phrases: string[];
    regex: string[];
    contextual: string[];
  };
  exemptions: string[];
  suggestion: string;
}

// API Request/Response types
export interface StartScanRequest {
  url: string;
  config?: Partial<ScanConfiguration>;
}

export interface StartScanResponse {
  scanId: number;
  status: 'pending';
  message: string;
}

export interface GetScanResponse {
  scan: ScanRecord;
}

export interface CheckComplianceRequest {
  content: string;
  sessionId: string;
}

export interface CheckComplianceResponse {
  draft: AdDraft;
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}