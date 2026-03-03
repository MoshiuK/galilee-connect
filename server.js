/**
 * Galilee Connect - Church Member Notification System
 * Galilee Missionary Baptist Church, Florence, Alabama
 * Pastor Moshiu Knox
 */

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { initDatabase } = require('./services/database');
const { initScheduler } = require('./services/scheduler');
const logger = require('./services/logger');

const adminRoutes = require('./routes/admin');
const memberRoutes = require('./routes/members');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'galilee-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true behind HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Template helper - simple HTML template engine
app.set('views', path.join(__dirname, 'views'));

// Helper to render HTML files with layout
function renderPage(res, viewPath, data = {}) {
    const layoutPath = path.join(__dirname, 'views', 'layouts', 'base.html');
    const contentPath = path.join(__dirname, 'views', viewPath);

    let layout = fs.readFileSync(layoutPath, 'utf8');
    let content = fs.readFileSync(contentPath, 'utf8');

    // Replace template variables
    const allData = {
        churchName: process.env.CHURCH_NAME || 'Galilee Missionary Baptist Church',
        churchPastor: process.env.CHURCH_PASTOR || 'Pastor Moshiu Knox',
        churchCity: process.env.CHURCH_CITY || 'Florence, Alabama',
        baseUrl: process.env.APP_BASE_URL || process.env.BASE_URL || `http://localhost:${PORT}`,
        year: new Date().getFullYear(),
        ...data
    };

    // Insert content into layout
    layout = layout.replace('{{content}}', content);

    // Replace all template variables
    for (const [key, value] of Object.entries(allData)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        layout = layout.replace(regex, value != null ? String(value) : '');
    }

    // Clean up any unreplaced variables
    layout = layout.replace(/\{\{[^}]+\}\}/g, '');

    res.send(layout);
}

// Make renderPage available to routes
app.locals.renderPage = renderPage;

// Routes
app.use('/admin', adminRoutes);
app.use('/members', memberRoutes);
app.use('/api', apiRoutes);

// Home - redirect to registration page
app.get('/', (req, res) => {
    renderPage(res, 'public/register.html', {
        title: 'Welcome',
        pageTitle: 'Stay Connected'
    });
});

// Unsubscribe page
app.get('/unsubscribe', (req, res) => {
    renderPage(res, 'public/unsubscribe.html', {
        title: 'Unsubscribe',
        pageTitle: 'Manage Subscriptions'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Page Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <a href="/">Return Home</a>
        </body>
        </html>
    `);
});

// Error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>Something went wrong</h1>
            <p>We're sorry, but something went wrong. Please try again later.</p>
            <a href="/">Return Home</a>
        </body>
        </html>
    `);
});

// Initialize and start
async function start() {
    try {
        // Initialize database
        initDatabase();
        logger.info('Database initialized');

        // Initialize scheduler
        initScheduler();
        logger.info('Scheduler initialized');

        // Start server
        app.listen(PORT, HOST, () => {
            logger.info(`🙏 Galilee Connect is running at http://${HOST}:${PORT}`);
            logger.info(`   Admin Dashboard: http://localhost:${PORT}/admin`);
            logger.info(`   Member Registration: http://localhost:${PORT}/`);
            console.log(`\n🙏 Galilee Connect is running!`);
            console.log(`   🌐 http://localhost:${PORT}`);
            console.log(`   👤 Admin: http://localhost:${PORT}/admin`);
            console.log(`   📝 Register: http://localhost:${PORT}/\n`);
        });
    } catch (err) {
        logger.error('Failed to start server:', err);
        console.error('Failed to start:', err.message);
        process.exit(1);
    }
}

start();
