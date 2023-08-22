// import 'node-fetch';

// const fs = require('fs');
import fs from 'fs'
import path from 'path'
// const path = require('path');

import stylus from 'stylus';
// const stylus = require('stylus');
// const cssConverter = require('css-to-scss');
// const sass = require('sass');
// const css2sass = require('./cssToSass')

import css2sass from './convert.js';
// const css2sass = require('./convert')

const directoryPath = process.argv[2];
const type = process.argv[3] ? process.argv[3] : 'scss';

if(!directoryPath)
    throw new Error("Falta la ruta hacía la carpeta que contiene los archivos .styl")

const ignoredDirectories = ['node_modules', 'docker', "dist"]; // Add the names of directories you wish to ignore

const filePaths = new Set()

const failedFiles = []

function getFileName(filePath) {
    return path.join(path.dirname(filePath));
} 

function processStylusFile(filePath) {
    // console.log(`Procesando archivo ${filePath}`)
    fs.readFile(filePath, 'utf8', (err, stylusContent) => {
        if (err) {
            return console.log('Error reading file:', filePath);
        }

        filePaths.add(getFileName(filePath))


        // console.log('Convert stylus to CSS: ', filePath);
        // Convert stylus to CSS
        stylus(stylusContent)
        .set("filename", filePath)
        .set('paths', [...filePaths])
        .render( async (err, cssContent) => {
            
            if (err) {
                failedFiles.push(filePath)
                return console.log('Error converting stylus to CSS: ', filePath, "\n", err?.message);
            }

            const scssContent = type === 'css' ? "" : await css2sass(cssContent, type, filePath);

            // Write to new .scss file
            const scssFilePath = path.join(path.dirname(filePath), path.basename(filePath, '.styl') + `.${type}`);

            // console.log('Convert CSS to SCSS: ', scssFilePath);
            fs.writeFile(scssFilePath, type === 'css' ? cssContent : scssContent, (err) => {
                if (err) {
                    return console.log('Error writing to file:', scssFilePath);
                }
                console.log(`Converted ${path.basename(filePath)} to ${path.basename(scssFilePath)}`);
            });
        });
    });
}

function traverseDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        files.forEach((file) => {
            // console.log({file})
            const filePath = path.join(directory, file);

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.log('Error fetching file stats:', filePath);
                    return;
                }

                if (stats.isDirectory()) {
                    // Check if the directory is in the ignored list
                    if (!ignoredDirectories.includes(file)) {
                        // If it's not ignored, traverse it
                        traverseDirectory(filePath);
                    }
                } else if (path.extname(filePath) === '.styl') {
                    // If it's a .styl file, process it
                    processStylusFile(filePath);
                }
            });
        });
    });
}

// Start the traversal from the root directory
traverseDirectory(directoryPath?.trim());

if(failedFiles.length > 0) {
    failedFiles.forEach(file => {
        processStylusFile(file)
    })
}
    