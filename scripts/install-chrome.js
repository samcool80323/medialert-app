#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Chrome for Puppeteer...');

try {
  // Check if we're in a production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Production environment detected, optimizing Chrome installation...');
    
    // Skip Chrome installation on Render - use system Chrome instead
    console.log('🔧 Render environment detected, skipping Chrome download');
    console.log('📋 Will use system Chrome at runtime');
    
    // Set environment variable to skip Puppeteer's Chrome download
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
    
    console.log('✅ Chrome installation optimized for Render');
  } else {
    console.log('🔧 Development environment, skipping Chrome installation');
  }
} catch (error) {
  console.error('❌ Chrome installation script error:', error.message);
  // Don't fail the build, just warn
  console.log('⚠️ Continuing without Chrome installation - Puppeteer will try to use system Chrome');
}

console.log('✅ Chrome installation script completed');