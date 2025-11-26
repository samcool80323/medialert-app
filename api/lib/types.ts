// Shared types for API functions
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

export interface ComplianceIssue {
  type: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  originalText: string;
  issue: string;
  suggestion: string;
  compliantRewrite: string;
}