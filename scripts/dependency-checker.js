const { execSync } = require('child_process');
const fs = require('fs');

function resolveDependencyConflicts() {
  console.log('Attempting to resolve dependency conflicts...');

  // Backup package.json
  fs.copyFileSync('package.json', 'package.json.backup');

  try {
    // Uninstall conflicting packages
    execSync('npm uninstall react-native-svg react-native-svg-charts', { stdio: 'inherit' });

    // Install latest compatible versions
    execSync('npm install react-native-svg@7.2.1 react-native-svg-charts@latest --save-exact', { stdio: 'inherit' });

    // Install babel dependencies
    execSync('npm install @babel/parser @babel/traverse --save-dev', { stdio: 'inherit' });

    console.log('Dependencies resolved successfully.');
  } catch (error) {
    console.error('Error resolving dependencies:', error.message);
    console.log('Restoring original package.json...');
    fs.copyFileSync('package.json.backup', 'package.json');
    execSync('npm install', { stdio: 'inherit' });
  } finally {
    // Clean up backup
    fs.unlinkSync('package.json.backup');
  }
}

resolveDependencyConflicts();