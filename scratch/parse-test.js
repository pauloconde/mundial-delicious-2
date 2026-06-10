import fs from 'node:fs';
import path from 'node:path';

const csvPath = path.join(process.cwd(), 'jugadores.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n').filter(Boolean);

for (let i = 0; i < lines.length; i++) {
  const cols = lineToCols(lines[i]);
  const dateIdx = cols.findIndex(col => /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(col.trim()));
  if (dateIdx === 10) {
    console.log(`Sample Line ${i + 1}:`, lines[i]);
    cols.forEach((col, idx) => console.log(`  ${idx}: "${col}"`));
    break;
  }
}

function lineToCols(line) {
  return line.split(',');
}
