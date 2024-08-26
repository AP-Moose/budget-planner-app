const fs = require('fs');
const path = require('path');

const directories = ['src/screens/', 'src/services/', 'src/utils/'];
const outputFilePath = 'consolidated_code.js';

function collectFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(collectFiles(file));
        } else {
            results.push(file);
        }
    });

    return results;
}

function consolidateFiles(files, output) {
    let consolidatedContent = '';
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        consolidatedContent += `\n\n// File: ${file}\n${content}`;
    });

    fs.writeFileSync(output, consolidatedContent);
    console.log(`Consolidated code has been saved to ${output}`);
}

function main() {
    let allFiles = [];
    directories.forEach(dir => {
        allFiles = allFiles.concat(collectFiles(dir));
    });

    consolidateFiles(allFiles, outputFilePath);
}

main();
