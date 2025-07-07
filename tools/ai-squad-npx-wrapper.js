#!/usr/bin/env node

/**
 * AI-SQUAD CLI - Direct execution wrapper for npx
 * This file ensures proper execution when run via npx from GitHub
 * Based on BMad Method by Brian (BMad) Madison
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if we're running in an npx temporary directory
const isNpxExecution = __dirname.includes('_npx') || __dirname.includes('.npm');

// If running via npx, we need to handle things differently
if (isNpxExecution) {
  // The actual ai-squad.js is in installer/bin/ (relative to tools directory)
  const aiSquadScriptPath = path.join(__dirname, 'installer', 'bin', 'ai-squad.js');
  
  // Verify the file exists
  if (!fs.existsSync(aiSquadScriptPath)) {
    console.error('Error: Could not find ai-squad.js at', aiSquadScriptPath);
    console.error('Current directory:', __dirname);
    process.exit(1);
  }
  
  // Execute with proper working directory
  try {
    execSync(`node "${aiSquadScriptPath}" ${process.argv.slice(2).join(' ')}`, {
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
  } catch (error) {
    // execSync will throw if the command exits with non-zero
    // But the stdio is inherited, so the error is already displayed
    process.exit(error.status || 1);
  }
} else {
  // Local execution - just require the installer directly
  require('./installer/bin/ai-squad.js');
}