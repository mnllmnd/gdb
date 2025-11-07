import pool from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        // Lire le fichier SQL
        const sql = fs.readFileSync(
            path.join(__dirname, '../src/migrations/20231107_create_password_reset_tokens.sql'),
            'utf8'
        );

        // Exécuter la migration
        await pool.query(sql);
        console.log('✅ Migration réussie : table password_reset_tokens créée');
    } catch (error) {
        console.error('❌ Erreur lors de la migration :', error);
        process.exit(1);
    }
}

// Exécuter la migration
runMigration();