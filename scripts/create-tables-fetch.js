// Script para crear las tablas mediante fetch
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpwsohttsxsmyhasvudy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd3NvaHR0c3hzbXloYXN2dWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDc0OTAsImV4cCI6MjA2MjAyMzQ5MH0.3smkZyO8z7B69lCEPebl3nI7WKHfkl2badoVYxvIgnw';

async function createTables() {
  try {
    console.log('Leyendo archivo SQL...');
    const sqlPath = path.join(__dirname, '..', 'migrations', 'supabase-sql-editor.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Enviando SQL a Supabase...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        'sql_query': sql
      })
    });
    
    const result = await response.text();
    console.log('Resultado:', result);

    console.log('Proceso completado.');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTables(); 