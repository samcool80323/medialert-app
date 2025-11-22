#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Chrome for Puppeteer...');

try {
  // Check if we're in a production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Production environment detected, installing Chrome dependencies...');
    
    // Install Puppeteer with Chrome
    try {
      execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
      console.log('✅ Chrome installed successfully via Puppeteer');
    } catch (error) {
      console.log('⚠️ Puppeteer Chrome install failed, trying alternative method...');
      
      // Alternative: Try to install Chrome manually
      try {
        execSync('apt-get update && apt-get install -y google-chrome-stable', { stdio: 'inherit' });
        console.log('✅ Chrome installed successfully via apt-get');
      } catch (aptError) {
        console.log('⚠️ apt-get install failed, Chrome may already be available in the system');
      }
    }
  } else {
    console.log('🔧 Development environment, skipping Chrome installation');
  }
} catch (error) {
  console.error('❌ Chrome installation failed:', error.message);
  // Don't fail the build, just warn
  console.log('⚠️ Continuing without Chrome installation - Puppeteer will try to use system Chrome');
}

console.log('✅ Chrome installation script completed');