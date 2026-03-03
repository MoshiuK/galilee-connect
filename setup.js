/**
 * Setup script - Initialize database and run seed
 * Run: npm run setup
 */

require('dotenv').config();
const { initDatabase } = require('./services/database');

console.log('🛠️  Setting up Galilee Connect...\n');

try {
    initDatabase();
    console.log('✅ Database initialized\n');

    // Run seed
    require('./seed');
} catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
}
