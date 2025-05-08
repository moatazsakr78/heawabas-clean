// Script para aplicar migraciones desde la línea de comandos
import { applyAllMigrations } from '../lib/migrations';

async function runMigrations() {
  console.log('Aplicando migraciones...');
  
  try {
    const result = await applyAllMigrations();
    
    if (result.success) {
      console.log('✅', result.message);
      console.log('Migraciones aplicadas:');
      result.appliedMigrations.forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.error('❌', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error inesperado:', error);
    process.exit(1);
  }
}

runMigrations(); 