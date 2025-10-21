// csv-to-json.js
import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser'; // si tu n'as pas encore installé: npm install csv-parser

const __dirname = path.resolve(); // équivalent de __dirname en ESM
const csvFilePath = path.join(__dirname, 'data', 'products.csv');
const jsonFilePath = path.join(__dirname, 'data', 'products.json');

const results = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(results, null, 2), 'utf-8');
    console.log('products.json créé avec succès !');
  });
