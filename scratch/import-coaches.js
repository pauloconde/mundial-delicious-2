import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Read .env file
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const csvPath = path.join(process.cwd(), 'entrenadores.csv');
const rawText = fs.readFileSync(csvPath, 'utf8');
const cleanedText = rawText.replace(/\u0000/g, ''); // strip null bytes

const lines = cleanedText.split('\n').filter(Boolean);

const coaches = [];

// Skip header (i = 0)
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  if (cols.length < 6) continue;

  const teamField = cols[0];
  const teamMatch = teamField.match(/\(([A-Z]{3})\)/);
  if (!teamMatch) {
    console.warn(`Line ${i + 1}: Could not parse team code from "${teamField}". Skipping.`);
    continue;
  }
  let equipoId = teamMatch[1];
  if (equipoId === 'CUW') {
    equipoId = 'CUR';
  }

  const cargo = cols[1]?.trim() || 'Entrenador';
  const nombre = cols[2]?.trim();
  const nacionalidad = cols[5]?.trim() || null;

  if (!nombre) {
    console.warn(`Line ${i + 1}: Empty coach name. Skipping.`);
    continue;
  }

  coaches.push({
    equipo_id: equipoId,
    nombre,
    cargo,
    nacionalidad
  });
}

async function run() {
  console.log(`Parsed ${coaches.length} coaches from CSV.`);
  
  console.log("Deleting existing coaches from database...");
  const { error: deleteError } = await supabase.from('entrenadores').delete().neq('nombre', '');
  if (deleteError) {
    throw new Error(`Delete failed: ${deleteError.message}`);
  }
  console.log("Existing coaches deleted successfully.");

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < coaches.length; i += batchSize) {
    const batch = coaches.slice(i, i + batchSize);
    console.log(`Inserting batch ${i / batchSize + 1}...`);
    const { error: insertError } = await supabase.from('entrenadores').insert(batch);
    if (insertError) {
      throw new Error(`Insert failed at batch starting at index ${i}: ${insertError.message}`);
    }
  }
  
  console.log("All coaches imported successfully!");
}

run().catch(err => {
  console.error("Error during import:", err);
  process.exit(1);
});
