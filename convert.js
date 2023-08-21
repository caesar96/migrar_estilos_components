import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function enviar(css, type, filename = '') {
    const params = { css, type };

    const formBody = [];

    for (const property in params) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(params[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }

    const body = formBody.join("&");

    try {
        const response = await fetch("https://css2sass.herokuapp.com/", {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
            },
            referrer: "https://css2sass.herokuapp.com/",
            body,
        });

        const data = await response.json();

        if (!data.success) {
            const filePath = `./logs/${path.basename(filename, '.styl')}.log.css`;

            const log = `/* ERROR: ${data.output}*/\n/* File Path: ${filename} */\n\n${css}`;

            fs.writeFile(filePath, log, (err) => {
                if (err) {
                    return console.log('Error writing to file:', filePath);
                }
            });
            throw new Error(`Error al hacer la petición: ${filename}`);
        } else if (data.output) {
            return data.output;
        }

        return null;
    } catch (error) {
        console.error("Error:", error);
    }
}

export default enviar;