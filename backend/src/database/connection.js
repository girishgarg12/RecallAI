import { Pool } from "pg";
import config from "../config/index.js";

const pool = new Pool(config.database);

export async function connectDatabase() {
    try {
        const result = await pool.query("SELECT NOW();");
        console.log("✅ Connected to PostgreSQL");
        console.log("Database Time:", result.rows[0].now);
    } catch (error) {
        console.error("❌ Failed to connect to PostgreSQL");
        console.error(error.message);
        process.exit(1);
    }
}

export default pool;