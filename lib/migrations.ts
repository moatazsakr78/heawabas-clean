import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * Aplica una migración SQL a la base de datos
 * @param sql El SQL a ejecutar
 * @returns Resultado de la migración
 */
export async function applyMigration(sql: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error al aplicar la migración:', error);
      return {
        success: false,
        message: `Error al aplicar la migración: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Migración aplicada correctamente'
    };
  } catch (error) {
    console.error('Error inesperado al aplicar la migración:', error);
    return {
      success: false,
      message: `Error inesperado: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Aplica todas las migraciones en el directorio /migrations
 * @returns Resultado de la aplicación de migraciones
 */
export async function applyAllMigrations(): Promise<{
  success: boolean;
  message: string;
  appliedMigrations: string[];
}> {
  try {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordena por nombre de archivo
    
    const appliedMigrations: string[] = [];
    
    for (const file of migrationFiles) {
      console.log(`Aplicando migración: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      const result = await applyMigration(sqlContent);
      
      if (!result.success) {
        return {
          success: false,
          message: `Error al aplicar la migración ${file}: ${result.message}`,
          appliedMigrations
        };
      }
      
      appliedMigrations.push(file);
    }
    
    return {
      success: true,
      message: `Se aplicaron ${appliedMigrations.length} migraciones correctamente`,
      appliedMigrations
    };
  } catch (error) {
    console.error('Error al aplicar migraciones:', error);
    return {
      success: false,
      message: `Error al aplicar migraciones: ${error instanceof Error ? error.message : String(error)}`,
      appliedMigrations: []
    };
  }
} 