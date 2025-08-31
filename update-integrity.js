#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * Calculate SHA384 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {string} Base64 encoded SHA384 hash
 */
function calculateSHA384(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha384');
    hashSum.update(fileBuffer);
    return hashSum.digest('base64');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Update integrity hash in HTML file
 * @param {string} htmlPath - Path to HTML file
 * @param {string} scriptPath - Path to script file
 * @param {string} scriptSrc - Script src attribute value
 */
function updateIntegrity(htmlPath, scriptPath, scriptSrc) {
  try {
    // Read HTML file
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Calculate new hash
    const newHash = calculateSHA384(scriptPath);
    const integrityValue = `sha384-${newHash}`;

    // Create regex pattern to match the script tag
    const scriptRegex = new RegExp(
      `(<script\\s+src="${scriptSrc.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )}"\\s+integrity="sha384-[^"]*"[^>]*>)`,
      'g'
    );

    // Check if script tag with integrity exists
    if (!scriptRegex.test(htmlContent)) {
      console.error(
        `❌ Script tag with src="${scriptSrc}" and integrity attribute not found in ${htmlPath}`
      );
      console.log('💡 Make sure the script tag has an integrity attribute to update.');
      process.exit(1);
    }

    // Replace the integrity value
    const updatedHtml = htmlContent.replace(
      scriptRegex,
      `$1`.replace(/integrity="sha384-[^"]*"/, `integrity="${integrityValue}"`)
    );

    // Write updated HTML back to file
    fs.writeFileSync(htmlPath, updatedHtml, 'utf8');

    console.log(`✅ Integrity hash updated successfully!`);
    console.log(`📁 Script: ${scriptPath}`);
    console.log(`🔗 HTML: ${htmlPath}`);
    console.log(`🔐 New hash: ${integrityValue}`);
  } catch (error) {
    console.error(`❌ Error updating integrity:`, error.message);
    process.exit(1);
  }
}

/**
 * Watch for file changes and auto-update integrity
 * @param {string} htmlPath - Path to HTML file
 * @param {string} scriptPath - Path to script file
 * @param {string} scriptSrc - Script src attribute value
 */
function watchAndUpdate(htmlPath, scriptPath, scriptSrc) {
  console.log(`👀 Watching ${scriptPath} for changes...`);
  console.log(`🔄 Auto-updating integrity hash in ${htmlPath}`);
  console.log(`⏹️  Press Ctrl+C to stop watching\n`);

  fs.watch(scriptPath, (eventType, filename) => {
    if (eventType === 'change') {
      console.log(`📝 ${filename} changed, updating integrity...`);
      updateIntegrity(htmlPath, scriptPath, scriptSrc);
      console.log(`⏰ ${new Date().toLocaleTimeString()}\n`);
    }
  });
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Default file paths
  const htmlPath = 'index.html';
  const scriptPath = 'script.js';
  const scriptSrc = 'script.js';

  switch (command) {
    case 'update':
    case undefined:
      // One-time update
      console.log('🔄 Updating script integrity hash...\n');
      updateIntegrity(htmlPath, scriptPath, scriptSrc);
      break;

    case 'watch':
      // Watch for changes
      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script file not found: ${scriptPath}`);
        process.exit(1);
      }
      if (!fs.existsSync(htmlPath)) {
        console.error(`❌ HTML file not found: ${htmlPath}`);
        process.exit(1);
      }

      // Initial update
      updateIntegrity(htmlPath, scriptPath, scriptSrc);
      console.log();

      // Start watching
      watchAndUpdate(htmlPath, scriptPath, scriptSrc);
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`
🔧 Script Integrity Updater

Usage:
  node update-integrity.js [command]

Commands:
  update    Update integrity hash once (default)
  watch     Watch for changes and auto-update
  help      Show this help message

Examples:
  node update-integrity.js          # Update once
  node update-integrity.js update   # Update once
  node update-integrity.js watch    # Watch for changes

Files:
  HTML: ${htmlPath}
  Script: ${scriptPath}
  Script src: ${scriptSrc}

The script will:
1. Calculate SHA384 hash of ${scriptPath}
2. Update the integrity attribute in ${htmlPath}
3. Preserve all other attributes in the script tag
            `);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('💡 Use "node update-integrity.js help" for usage information.');
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { calculateSHA384, updateIntegrity };
