const fs = require('fs');
const path = require('path');

function readFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      readFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function combineFiles() {
  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const outputFile = path.join(rootDir, 'combined_code.txt');

  let combinedContent = '';

  // Read app.js from root
  const appJsPath = path.join(rootDir, 'app.js');
  if (fs.existsSync(appJsPath)) {
    combinedContent += `File: app.js\n\n${fs.readFileSync(appJsPath, 'utf8')}\n\n`;
  }

  // Read all files from src directory
  const srcFiles = readFilesRecursively(srcDir);

  srcFiles.forEach(filePath => {
    const relativePath = path.relative(rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    combinedContent += `File: ${relativePath}\n\n${content}\n\n`;
  });

  // Write combined content to output file
  fs.writeFileSync(outputFile, combinedContent);

  console.log(`All code has been combined into ${outputFile}`);
}

combineFiles();