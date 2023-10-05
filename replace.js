// const fs = require('fs');

import fs from 'fs'

import path from 'path';

const directoryPath = process.argv[2] || './';  // Default is the current directory if not provided as an argument

const type = process.argv[3] ? process.argv[3] : 'css';

const ignoredDirectories = ['node_modules', 'docker', "dist"]; // Add the names of directories you wish to ignore

function isIgnoredDir(filePath) {
    return !!ignoredDirectories.find( ignore => filePath.includes(ignore) )
}

function replaceStylWithCss(filePath) {

    //  console.log(filePath)
    const data = fs.readFileSync(filePath, 'utf8');
    const updatedData = data.replace(/\.styl/g, `.${type}`);
    
    if (data !== updatedData) {
        fs.writeFileSync(filePath, updatedData, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(dir) {
    // console.log({dir})
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            if (!isIgnoredDir(filePath)) {
                processDirectory(filePath);
            }            
            
        } else if (!isIgnoredDir(filePath) && stats.isFile() && filePath.includes('component.ts')) {
            replaceStylWithCss(filePath);
        }
    }
}

processDirectory(directoryPath?.trim());
