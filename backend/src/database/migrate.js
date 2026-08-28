import pool from "./connection.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDirectory = path.join(__dirname, "migrations");

async function createMigrationTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await pool.query(query);

    console.log("Migration table ready");
}

async function getMigrationFiles() {
    const files = await fs.readdir(migrationsDirectory);

    return files
        .filter(file => file.endsWith(".sql"))
        .sort();
}


async function getExecutedMigrations() {
    const query = `
    SELECT name
    FROM schema_migrations
    ORDER BY id;
    `;

    const result = await pool.query(query);
    
    return result.rows.map(row => row.name);
}


async function executeMigration(file) {
    const filePath = path.join(migrationsDirectory, file);
    const sql = await fs.readFile(filePath, "utf-8");
    
    await pool.query("BEGIN");
    
    try {
        await pool.query(sql);
        
        await pool.query(
            `INSERT INTO schema_migrations (name)
             VALUES ($1)`,
            [file]
        );

        await pool.query("COMMIT");
        
        console.log(`Applied migration: ${file}`);
    } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
    }
}

async function runMigrations() {
    await createMigrationTable();

    const files = await getMigrationFiles();
    const executedMigrations = await getExecutedMigrations();

    for (const file of files) {
        if (executedMigrations.includes(file)) {
            continue;
        }

        await executeMigration(file);
    }
}

runMigrations()
    .catch((error) => {
        console.error("Migration failed:", error);
    })
    .finally(() => {
        pool.end();
    });