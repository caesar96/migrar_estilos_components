import fs from 'fs';
import path from 'path';

import stylus from 'stylus';
import css2sass from './convert.js';

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

function isIgnoredDir(filePath) {
    return !!ignoredDirectories.find( ignore => filePath.includes(ignore) )
}

async function processStylusFile(filePath) {

    const scssFilePath = path.join(path.dirname(filePath), path.basename(filePath, '.styl') + `.${type}`);

    filePaths.add(getFileName(filePath))

    try {
        
        const stats = fs.statSync(scssFilePath);

        if(stats.isFile()) {
            console.clear();
            console.log(`El archivo ya existe: ${scssFilePath}`)
            return null;
        }
    } catch (error) {
        
    }


    return new Promise( (resolve, reject) => {
        // console.log(`Procesando archivo ${filePath}`)
        fs.readFile(filePath, 'utf8', (err, stylusContent) => {
            if (err) {
                console.log(`Error reading file: ${filePath}`)
                reject(err)
                return;
            }

            resolve(stylusContent)

        });
    })
    .then( (stylusContent) => {

        return new Promise( (resolve, reject) => {
            // Convert stylus to CSS
            stylus(stylusContent)
            .set("filename", filePath)
            .set('paths', [...filePaths])
            .render( (err, cssContent) => {
                
                if (err) {
                    failedFiles.push(filePath);
                    return reject(`Error converting stylus to CSS: ${filePath}\n${err?.message}`);
                }
                resolve(cssContent)
            });             
        })
        .then( async (cssContent) => {
            const scssContent = type === 'css' ? "" : await css2sass(cssContent, type, filePath);

            if(scssContent !== null) {
                await new Promise( (resolve, reject) => {
                    fs.writeFile(scssFilePath, type === 'css' ? cssContent : scssContent, (err) => {
                        if (err) {
                            
                            return reject(err)
                        }
                        fs.close(scssFilePath, () => {});
        
                        resolve(true)
                        
                    });
                })
                .then( () => {
                    console.log(`Converted ${scssFilePath}`);
                })
                .catch( (error) => {
                    console.log('Error writing to file:', scssFilePath);
                })
            }

        })
        .catch( (error) => {
            console.log(error)
        })
       
    })
    .catch(err => {
        
    })

}

function traverseDirectory(directory) {

    return new Promise( (resolve, reject) => {
        fs.readdir(directory, (err, files) => {

            if(err) {
                reject(err)
                return;
            }
            resolve(files)
            
        });
    })
    .then( async (files) => {

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const filePath = path.join(directory, file);

            await new Promise( (resolve, reject) => {
                fs.stat(filePath, async (err, stats) => {
                    if(err) {
                        reject(err)
                        return;
                    }

                    resolve(stats)
                });
            })
            .then( async (stats) => {

                if (stats.isDirectory()) {
                    // Check if the directory is in the ignored list
                    if (!isIgnoredDir(filePath)) {
                        // If it's not ignored, traverse it
                        await traverseDirectory(filePath);
                    }
                } 
                
                if (!isIgnoredDir(filePath) && path.extname(filePath) === '.styl') {
                    // If it's a .styl file, process it
                    await processStylusFile(filePath);
                }

            })
            .catch( (errr) => {
                console.log('Error fetching file stats:', filePath);
            })
        }
    })
    .catch( (err) => {
        console.log('Unable to scan directory: ' + err);
    })

}

function main() {
    return traverseDirectory(directoryPath?.trim())
    .then( () => {
        console.log({failedFiles})
        if(failedFiles.length > 0) {
            failedFiles.forEach(file => {
                processStylusFile(file)
            })
        }
    })
}


await main();
// Start the traversal from the root directory



    