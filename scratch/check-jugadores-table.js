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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Testing insert...");
  const tempId = '99999999-9999-9999-9999-999999999999';
  const { data: insertData, error: insertError } = await supabase.from('jugadores').insert({
    id: tempId,
    equipo_id: 'ARG',
    nombre: 'TEST PLAYER',
    posicion: 'DC',
    fecha_nacimiento: '1990-01-01',
    club: 'TEST CLUB',
    estatura: 180
  }).select();

  if (insertError) {
    console.error("Insert failed:", insertError);
  } else {
    console.log("Insert succeeded:", insertData);
    
    console.log("Testing delete of the inserted player...");
    const { data: deleteData, error: deleteError } = await supabase.from('jugadores').delete().eq('id', tempId).select();
    if (deleteError) {
      console.error("Delete failed:", deleteError);
    } else {
      console.log("Delete succeeded:", deleteData);
    }
  }
}

run().catch(console.error);
