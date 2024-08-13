const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeStyles(directory) {
  const styleObjects = {};

  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    traverse(ast, {
      CallExpression(path) {
        if (
          path.node.callee.object &&
          path.node.callee.object.name === 'StyleSheet' &&
          path.node.callee.property.name === 'create'
        ) {
          path.node.arguments[0].properties.forEach(prop => {
            const styleName = prop.key.name;
            const styleValue = JSON.stringify(prop.value);
            
            if (!styleObjects[styleValue]) {
              styleObjects[styleValue] = [];
            }
            styleObjects[styleValue].push({ file: filePath, name: styleName });
          });
        }
      }
    });
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        processFile(filePath);
      }
    });
  }

  walkDir(directory);

  console.log('Potential global styles:');
  Object.entries(styleObjects)
    .filter(([_, occurrences]) => occurrences.length > 1)
    .forEach(([style, occurrences]) => {
      console.log(`\nStyle: ${style}`);
      console.log('Used in:');
      occurrences.forEach(({ file, name }) => {
        console.log(`  ${file} as ${name}`);
      });
    });
}

// Usage
analyzeStyles('./src');