import { writeFileSync } from 'node:fs';
import app from '../src/index.js';

async function generateDocs() {
    const response = await app.request('/openapi.json');
    if (!response.ok) {
        console.error(await response.text());
        console.error('Failed to generate OpenAPI spec');
        process.exit(1);
    }
    writeFileSync('./openapi.json', await response.text());
    console.log('✅ openapi.json generated');
}

generateDocs();
