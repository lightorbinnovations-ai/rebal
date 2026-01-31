import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("DATABASE_URL not found in process.env. Checking .env file manually...");
    // Fallback check
    try {
        const envFile = fs.readFileSync('.env', 'utf8');
        const match = envFile.match(/DATABASE_URL=(.*)/);
        if (match) {
            process.env.DATABASE_URL = match[1].trim();
            console.log("Found DATABASE_URL in .env manually.");
        } else {
            console.error("Still not found.");
            process.exit(1);
        }
    } catch (e) {
        console.error("Could not read .env", e);
        process.exit(1);
    }
}

const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        const sql1 = fs.readFileSync('SETUP_PART1.sql', 'utf8');
        const sql2 = fs.readFileSync('SETUP_PART2.sql', 'utf8');
        const sql3 = fs.readFileSync('SETUP_PART3.sql', 'utf8');

        console.log("Running Part 1 (Realtor Stats)...");
        await client.query(sql1);
        console.log("Part 1 Done.");

        console.log("Running Part 2 (Cols)...");
        await client.query(sql2);
        console.log("Part 2 Done.");

        console.log("Running Part 3 (RPC)...");
        await client.query(sql3);
        console.log("Part 3 Done.");

    } catch (e) {
        console.error("Migration Failed:", e);
    } finally {
        await client.end();
    }
}

run();
