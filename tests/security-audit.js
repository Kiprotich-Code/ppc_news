#!/usr/bin/env node

/**
 * Security Audit Script - Find Remaining Console Logs
 * Run this script to identify any remaining console.log statements that need to be secured
 */

const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', '.next', '.git', 'public', 'uploads'];
const excludeFiles = ['security-audit.js', 'logger.ts'];
const targetExtensions = ['.ts', '.tsx', '.js', '.jsx'];

let findings = [];

function shouldSkip(filePath) {
  return excludeDirs.some(dir => filePath.includes(dir)) ||
         excludeFiles.some(file => filePath.endsWith(file));
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for console.log, console.error, etc.
      const consoleMatch = line.match(/console\.(log|info|warn|error|debug)/g);
      if (consoleMatch) {
        findings.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          severity: getSeverity(line)
        });
      }
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

function getSeverity(line) {
  // Check for sensitive patterns
  const sensitivePatterns = [
    /password|token|secret|key/i,
    /user|session|auth/i,
    /phone|email|id/i,
    /payment|transaction|mpesa|payhero/i
  ];
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(line)) {
      return 'HIGH';
    }
  }
  
  return 'MEDIUM';
}

function scanDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    
    if (shouldSkip(fullPath)) continue;
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && targetExtensions.some(ext => fullPath.endsWith(ext))) {
      scanFile(fullPath);
    }
  }
}

// Run the scan
console.log('🔍 Scanning for remaining console.log statements...\n');

scanDirectory('.');

// Report findings
if (findings.length === 0) {
  console.log('✅ No console.log statements found - Good job!');
} else {
  console.log(`⚠️  Found ${findings.length} console.log statements:\n`);
  
  // Group by severity
  const high = findings.filter(f => f.severity === 'HIGH');
  const medium = findings.filter(f => f.severity === 'MEDIUM');
  
  if (high.length > 0) {
    console.log('🚨 HIGH PRIORITY (potentially sensitive):');
    high.forEach(finding => {
      console.log(`   ${finding.file}:${finding.line}`);
      console.log(`   📝 ${finding.content}`);
      console.log('');
    });
  }
  
  if (medium.length > 0) {
    console.log('⚠️  MEDIUM PRIORITY:');
    medium.forEach(finding => {
      console.log(`   ${finding.file}:${finding.line}`);
      console.log(`   📝 ${finding.content}`);
      console.log('');
    });
  }
  
  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. Replace console.log with logger.info() or logger.debug()');
  console.log('2. Use logger.error() for error scenarios');
  console.log('3. Use logger.payment() for payment operations');
  console.log('4. Import logger from "@/lib/logger"');
  console.log('\nExample:');
  console.log('  import { logger } from "@/lib/logger";');
  console.log('  logger.info("Operation completed", data); // Auto-sanitized');
}

console.log(`\n📊 Scan complete. Checked TypeScript/JavaScript files.`);
console.log(`🔒 Remember: The logger automatically sanitizes sensitive data!`);
