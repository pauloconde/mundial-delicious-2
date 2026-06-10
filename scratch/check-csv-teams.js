import fs from 'node:fs';
import path from 'node:path';

// Valid FIFA codes in DB
const dbCodes = new Set([
  'MEX', 'RSA', 'KOR', 'CZE', 'CAN', 'BIH', 'USA', 'PAR', 'QAT', 'SUI', 'BRA', 'MAR', 
  'HAI', 'SCO', 'AUS', 'TUR', 'GER', 'CUR', 'NED', 'JPN', 'CIV', 'ECU', 'SWE', 'TUN', 
  'ESP', 'CPV', 'BEL', 'EGY', 'KSA', 'URU', 'IRN', 'NZL', 'FRA', 'SEN', 'IRQ', 'NOR', 
  'ARG', 'ALG', 'AUT', 'JOR', 'POR', 'COD', 'ENG', 'CRO', 'GHA', 'PAN', 'UZB', 'COL'
]);

const csvPath = path.join(process.cwd(), 'jugadores.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);

const csvCodes = new Set();
lines.forEach(line => {
  const cols = line.split(',');
  const teamField = cols[0]; // e.g., "Algeria (ALG)"
  const match = teamField.match(/\(([A-Z]{3})\)/);
  if (match) {
    csvCodes.add(match[1]);
  } else {
    console.log("Could not parse team field:", teamField);
  }
});

console.log("Unique CSV codes:", Array.from(csvCodes).sort());

const missingInDb = [];
csvCodes.forEach(code => {
  if (!dbCodes.has(code)) {
    missingInDb.push(code);
  }
});

console.log("Missing in DB:", missingInDb);
