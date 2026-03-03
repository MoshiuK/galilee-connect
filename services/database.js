const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

let db;

function getDb() {
    if (!db) {
        const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'galilee.db');
        const dbDir = path.dirname(dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function initDatabase() {
    const database = getDb();
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema statements one at a time
    const statements = schema.split(';').filter(s => s.trim());
    for (const stmt of statements) {
        try {
            database.exec(stmt + ';');
        } catch (err) {
            // Ignore "already exists" type errors during init
            if (!err.message.includes('already exists')) {
                logger.warn(`Schema statement warning: ${err.message}`);
            }
        }
    }
    logger.info('Database schema initialized');

    // Migration: add email column to admin_users if missing (for forgot-password flow)
    try {
        const columns = database.pragma('table_info(admin_users)');
        const hasEmail = columns.some(c => c.name === 'email');
        if (!hasEmail) {
            database.exec('ALTER TABLE admin_users ADD COLUMN email TEXT');
            logger.info('Migrated admin_users: added email column');
        }
    } catch (err) {
        logger.warn('Migration check for admin_users.email:', err.message);
    }

    // Seed default admin user if none exists
    const adminCount = database.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
    if (adminCount === 0) {
        const username = process.env.ADMIN_USERNAME || 'pastor';
        const password = process.env.ADMIN_PASSWORD || 'galilee2024';
        const email = process.env.ADMIN_EMAIL || null;
        const hash = bcrypt.hashSync(password, 10);
        database.prepare('INSERT INTO admin_users (username, email, password_hash) VALUES (?, ?, ?)').run(username, email, hash);
        logger.info(`Default admin user "${username}" created`);
    }
}

module.exports = { getDb, initDatabase };
