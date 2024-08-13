const { execSync } = require('child_process');
const fs = require('fs');

function checkDependencies() {
  console.log('Checking dependencies...');
  
  try {
    // Run npm outdated
    const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
    const outdatedDeps = JSON.parse(outdated);
    
    if (Object.keys(outdatedDeps).length > 0) {
      console.log('Outdated dependencies:');
      console.log(JSON.stringify(outdatedDeps, null, 2));
      console.log('\nTo update these dependencies, you can run:');
      console.log('npm update <package-name>');
      console.log('\nBe cautious when updating. Test thoroughly after any updates.');
    } else {
      console.log('All dependencies are up to date.');
    }
  } catch (error) {
    console.error('Error checking dependencies:', error.message);
  }
  
  // Check for peer dependency issues
  try {
    console.log('\nChecking for peer dependency issues...');
    execSync('npm ls', { stdio: 'inherit' });
  } catch (error) {
    console.error('\nPeer dependency issues detected. Please review the above output and resolve manually if needed.');
  }
}

function analyzeDependencies() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  console.log('\nCurrent dependencies:');
  Object.entries(dependencies).forEach(([dep, version]) => {
    console.log(`${dep}: ${version}`);
  });
}

checkDependencies();
analyzeDependencies();