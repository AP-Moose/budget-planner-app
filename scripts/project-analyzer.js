const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Define the source directory
const srcDir = path.join(__dirname, '..', 'src');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  const imports = [];
  const exports = [];
  const classes = [];
  const methods = [];

  traverse(ast, {
    ImportDeclaration({ node }) {
      imports.push(node.source.value);
    },
    ExportNamedDeclaration({ node }) {
      if (node.declaration) {
        if (node.declaration.id) {
          exports.push(node.declaration.id.name);
        } else if (node.declaration.declarations) {
          node.declaration.declarations.forEach(dec => {
            exports.push(dec.id.name);
          });
        }
      }
    },
    ExportDefaultDeclaration({ node }) {
      if (node.declaration.id) {
        exports.push(node.declaration.id.name);
      }
    },
    ClassDeclaration({ node }) {
      classes.push(node.id.name);
    },
    ClassMethod({ node }) {
      methods.push(node.key.name);
    },
    FunctionDeclaration({ node }) {
      methods.push(node.id.name);
    },
    ArrowFunctionExpression({ node, parent }) {
      if (parent.id) {
        methods.push(parent.id.name);
      }
    }
  });

  return { imports, exports, classes, methods };
}

function analyzeDirectory(dir, dependencies = {}) {
  const results = {};

  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return results;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      Object.assign(results, analyzeDirectory(filePath, dependencies));
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      try {
        const analysis = analyzeFile(filePath);
        results[filePath] = analysis;
        analysis.imports.forEach(imp => {
          if (!imp.startsWith('.') && !imp.startsWith('/')) {
            dependencies[imp] = (dependencies[imp] || 0) + 1;
          }
        });
      } catch (error) {
        console.error(`Error analyzing file ${filePath}: ${error.message}`);
      }
    }
  }

  return results;
}

function checkCircularDependencies(analysisResults) {
  const graph = {};
  Object.entries(analysisResults).forEach(([file, { imports }]) => {
    graph[file] = imports.map(imp => {
      if (imp.startsWith('.')) {
        return path.resolve(path.dirname(file), imp);
      }
      return imp;
    });
  });

  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node) {
    visited.add(node);
    recursionStack.add(node);

    for (const neighbor of (graph[node] || [])) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        console.log(`Circular dependency detected: ${node} -> ${neighbor}`);
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  Object.keys(graph).forEach(node => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });
}

const dependencies = {};
const analysisResults = analyzeDirectory(srcDir, dependencies);
checkCircularDependencies(analysisResults);

console.log('Project Analysis Results:');
console.log(JSON.stringify(analysisResults, null, 2));

console.log('\nProject Dependencies:');
console.log(JSON.stringify(dependencies, null, 2));