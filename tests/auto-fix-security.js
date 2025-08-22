#!/usr/bin/env node

/**
 * Automated Security Fix Script
 * This script automatically replaces common unsafe console.log patterns with secure logger calls
 */

const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'app/api/wallet/deposit/route.ts',
  'app/api/wallet/withdrawal/route.ts',
  'app/api/wallet/course-payment/route.ts',
  'app/api/webhooks/payhero/b2c/route.ts',
  'components/MpesaPayment.tsx',
  'components/PayHeroPayment.tsx'
];

const replacements = [
  // High priority payment logs
  {
    pattern: /console\.log\('=== PayHero.*?==='\);?/g,
    replacement: "logger.info('PayHero operation started');"
  },
  {
    pattern: /console\.error\('Unauthorized.*?session'\);?/g,
    replacement: "logger.error('Unauthorized access attempt');"
  },
  {
    pattern: /console\.log\('Request body:', .*?\);?/g,
    replacement: "logger.debug('Request received');"
  },
  {
    pattern: /console\.error\('Missing required fields:', .*?\);?/g,
    replacement: "logger.error('Missing required fields');"
  },
  {
    pattern: /console\.log\('Initiating PayHero.*?, .*?\);?/g,
    replacement: "logger.payment('Initiating PayHero operation');"
  },
  {
    pattern: /console\.log\('PayHero response received:', .*?\);?/g,
    replacement: "logger.debug('PayHero response received');"
  },
  {
    pattern: /console\.error\('PayHero error:', .*?\);?/g,
    replacement: "logger.error('PayHero operation failed');"
  },
  {
    pattern: /console\.log\('Original phone number:', .*?\);?/g,
    replacement: "logger.debug('Processing phone number');"
  },
  {
    pattern: /console\.log\('Converted phone number:', .*?\);?/g,
    replacement: "logger.debug('Phone number processed');"
  },
  {
    pattern: /console\.log\('Phone number length:', .*?\);?/g,
    replacement: "logger.debug('Phone number validated');"
  },
  {
    pattern: /console\.log\('Submitting.*?payment:', \{[\s\S]*?\}\);?/g,
    replacement: "logger.payment('Submitting payment request');"
  },
  // User data protection
  {
    pattern: /console\.log\('Processing withdrawal request:', \{.*?\}\);?/g,
    replacement: "logger.payment('Processing withdrawal request');"
  },
  {
    pattern: /console\.log\(`Manual withdrawal request created: .*?\`\);?/g,
    replacement: "logger.info('Manual withdrawal request created');"
  }
];

function addLoggerImport(content, filePath) {
  if (content.includes("import { logger }")) {
    return content;
  }
  
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, "import { logger } from '@/lib/logger';");
  return lines.join('\n');
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Apply replacements
  for (const { pattern, replacement } of replacements) {
    const before = content.length;
    content = content.replace(pattern, replacement);
    if (content.length !== before) {
      changed = true;
    }
  }
  
  // Add logger import if needed and changes were made
  if (changed && !content.includes("import { logger }")) {
    content = addLoggerImport(content, filePath);
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

console.log('🔧 Applying automated security fixes...\n');

let totalFixed = 0;

for (const file of criticalFiles) {
  if (fixFile(file)) {
    totalFixed++;
  }
}

console.log(`\n✨ Fixed ${totalFixed} critical files automatically.`);
console.log('📝 Note: Additional manual review may be needed for complex cases.');
console.log('🔍 Run "node security-audit.js" again to check progress.');
