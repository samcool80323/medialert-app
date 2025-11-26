import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 DEBUG: Starting comprehensive diagnostic test');
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
      },
      imports: {
        vercelNode: 'SUCCESS',
        zod: 'UNKNOWN',
        uuid: 'UNKNOWN',
        axios: 'UNKNOWN',
        cheerio: 'UNKNOWN',
        webScraperServerless: 'UNKNOWN',
        complianceAnalyzer: 'UNKNOWN',
        sharedTypes: 'UNKNOWN'
      },
      errors: [] as string[]
    };

    // Test basic imports
    try {
      const { z } = await import('zod');
      diagnostics.imports.zod = 'SUCCESS';
      console.log('✅ zod import successful');
    } catch (error) {
      diagnostics.imports.zod = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`zod import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ zod import failed:', error);
    }

    try {
      const { v4 } = await import('uuid');
      diagnostics.imports.uuid = 'SUCCESS';
      console.log('✅ uuid import successful');
    } catch (error) {
      diagnostics.imports.uuid = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`uuid import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ uuid import failed:', error);
    }

    try {
      const axios = await import('axios');
      diagnostics.imports.axios = 'SUCCESS';
      console.log('✅ axios import successful');
    } catch (error) {
      diagnostics.imports.axios = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`axios import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ axios import failed:', error);
    }

    try {
      const cheerio = await import('cheerio');
      diagnostics.imports.cheerio = 'SUCCESS';
      console.log('✅ cheerio import successful');
    } catch (error) {
      diagnostics.imports.cheerio = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`cheerio import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ cheerio import failed:', error);
    }

    // Test problematic imports from src/
    try {
      const { serverlessWebScraper } = await import('../src/server/services/webScraperServerless');
      diagnostics.imports.webScraperServerless = 'SUCCESS';
      console.log('✅ webScraperServerless import successful');
    } catch (error) {
      diagnostics.imports.webScraperServerless = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`webScraperServerless import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ webScraperServerless import failed:', error);
    }

    try {
      const { ComplianceAnalyzer } = await import('../src/server/services/complianceAnalyzer');
      diagnostics.imports.complianceAnalyzer = 'SUCCESS';
      console.log('✅ ComplianceAnalyzer import successful');
    } catch (error) {
      diagnostics.imports.complianceAnalyzer = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`ComplianceAnalyzer import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ ComplianceAnalyzer import failed:', error);
    }

    try {
      const types = await import('../src/shared/types');
      diagnostics.imports.sharedTypes = 'SUCCESS';
      console.log('✅ shared types import successful');
    } catch (error) {
      diagnostics.imports.sharedTypes = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      diagnostics.errors.push(`shared types import failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('❌ shared types import failed:', error);
    }

    // Test ComplianceAnalyzer initialization
    let complianceAnalyzerTest = 'NOT_TESTED';
    if (diagnostics.imports.complianceAnalyzer === 'SUCCESS') {
      try {
        if (process.env.OPENAI_API_KEY) {
          const { ComplianceAnalyzer } = await import('../src/server/services/complianceAnalyzer');
          const analyzer = new ComplianceAnalyzer();
          complianceAnalyzerTest = 'INITIALIZED_SUCCESS';
          console.log('✅ ComplianceAnalyzer initialized successfully');
        } else {
          complianceAnalyzerTest = 'SKIPPED_NO_API_KEY';
          console.log('⚠️ ComplianceAnalyzer initialization skipped - no API key');
        }
      } catch (error) {
        complianceAnalyzerTest = `INIT_ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
        diagnostics.errors.push(`ComplianceAnalyzer initialization failed: ${error instanceof Error ? error.message : 'Unknown'}`);
        console.error('❌ ComplianceAnalyzer initialization failed:', error);
      }
    }

    console.log('🔍 DEBUG: Diagnostic test completed');

    return res.status(200).json({
      message: 'Comprehensive diagnostic test completed',
      diagnostics: {
        ...diagnostics,
        complianceAnalyzerTest
      },
      summary: {
        totalErrors: diagnostics.errors.length,
        criticalIssues: diagnostics.errors.filter(e => 
          e.includes('webScraperServerless') || 
          e.includes('complianceAnalyzer') || 
          e.includes('shared types')
        ).length,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      }
    });

  } catch (error) {
    console.error('🚨 DEBUG: Diagnostic test failed:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return res.status(500).json({
      error: 'Diagnostic test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}