/**
 * Admin Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { getDb } = require('../services/database');
const { getVersePreview } = require('../services/bible');
const { reschedule, runNow } = require('../services/scheduler');
const { sendEmail, buildEmailHTML, getAppBaseUrl } = require('../services/notifications');
const logger = require('../services/logger');

// File upload config
const upload = multer({ dest: path.join(__dirname, '..', 'data', 'uploads') });

/**
 * Auth middleware
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// ==================== LOGIN ====================

router.get('/login', (req, res) => {
    const error = req.query.error ? 'Invalid username or password' : '';
    res.send(getLoginPage(error));
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password_hash)) {
        req.session.isAdmin = true;
        req.session.adminUsername = user.username;
        req.session.save(() => {
            res.redirect('/admin');
        });
    } else {
        res.redirect('/admin/login?error=1');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// ==================== FORGOT PASSWORD ====================

router.get('/forgot-password', (req, res) => {
    const message = req.query.sent === '1'
        ? 'If an account with that username exists and has an email on file, a reset link has been sent.'
        : '';
    const error = req.query.error === '1'
        ? 'Please enter your username.'
        : '';
    res.send(getForgotPasswordPage(message, error));
});

router.post('/forgot-password', async (req, res) => {
    const { username } = req.body;

    if (!username || !username.trim()) {
        return res.redirect('/admin/forgot-password?error=1');
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username.trim());

    if (user && user.email) {
        try {
            // Generate secure token
            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

            // Invalidate any existing tokens for this user
            db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

            // Store new token
            db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

            // Build reset URL using APP_BASE_URL
            const baseUrl = getAppBaseUrl();
            const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

            const emailBody = `
                <p>Hello <strong>${user.username}</strong>,</p>
                <p>We received a request to reset your admin password for Galilee Connect.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background: #4a1a6b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #888; font-size: 13px;">Or copy this link: <br><a href="${resetUrl}" style="color: #4a1a6b; word-break: break-all;">${resetUrl}</a></p>
                <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            `;
            const textBody = `Password reset for Galilee Connect\n\nHello ${user.username},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;

            const html = buildEmailHTML('Password Reset', emailBody);
            await sendEmail(user.email, '🔑 Password Reset - Galilee Connect', html, textBody);

            logger.info(`Password reset email sent for user: ${user.username}`);
        } catch (err) {
            logger.error('Error sending password reset email:', err);
        }
    } else {
        logger.info(`Password reset requested for username "${username}" - no email on file or user not found`);
    }

    // Always redirect with same message (prevent username enumeration)
    res.redirect('/admin/forgot-password?sent=1');
});

// ==================== RESET PASSWORD ====================

router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/admin/login');
    }

    const db = getDb();
    const resetToken = db.prepare(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(token);

    if (!resetToken) {
        return res.send(getResetPasswordPage('', 'This reset link is invalid or has expired. Please request a new one.', null));
    }

    res.send(getResetPasswordPage('', '', token));
});

router.post('/reset-password', (req, res) => {
    const { token, new_password, confirm_password } = req.body;

    if (!token) {
        return res.redirect('/admin/login');
    }

    const db = getDb();
    const resetToken = db.prepare(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(token);

    if (!resetToken) {
        return res.send(getResetPasswordPage('', 'This reset link is invalid or has expired. Please request a new one.', null));
    }

    if (!new_password || new_password.length < 6) {
        return res.send(getResetPasswordPage('', 'Password must be at least 6 characters.', token));
    }

    if (new_password !== confirm_password) {
        return res.send(getResetPasswordPage('', 'Passwords do not match.', token));
    }

    try {
        const hash = bcrypt.hashSync(new_password, 10);
        db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, resetToken.user_id);
        db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(resetToken.id);

        const user = db.prepare('SELECT username FROM admin_users WHERE id = ?').get(resetToken.user_id);
        logger.info(`Password reset completed for user: ${user?.username}`);

        res.send(getResetPasswordPage('Your password has been reset successfully. You can now sign in.', '', null));
    } catch (err) {
        logger.error('Error resetting password:', err);
        res.send(getResetPasswordPage('', 'Something went wrong. Please try again.', token));
    }
});

// ==================== DASHBOARD ====================

router.get('/', requireAuth, async (req, res) => {
    const db = getDb();

    // Stats
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').get().count;
    const totalEmails = db.prepare("SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND email IS NOT NULL AND email != ''").get().count;
    const totalPhones = db.prepare("SELECT COUNT(*) as count FROM members WHERE is_active = 1 AND phone IS NOT NULL AND phone != ''").get().count;

    // Messages sent today
    const today = new Date().toISOString().split('T')[0];
    const messagesToday = db.prepare("SELECT COUNT(*) as count FROM message_log WHERE sent_at >= ?").get(today + ' 00:00:00').count;

    // Upcoming birthdays (next 7 days)
    const upcomingBirthdays = getUpcomingDates('birthday', 7);
    const upcomingAnniversaries = getUpcomingDates('anniversary', 7);

    // Today's verse
    let verse;
    try {
        verse = await getVersePreview();
    } catch (e) {
        verse = { reference: 'Loading...', text: 'Verse will be available shortly', translation: 'KJV' };
    }

    // Recent messages
    const recentMessages = db.prepare(
        'SELECT * FROM message_log ORDER BY sent_at DESC LIMIT 10'
    ).all();

    // Settings
    const settings = {};
    const settingsRows = db.prepare('SELECT * FROM settings').all();
    for (const row of settingsRows) {
        settings[row.key] = row.value;
    }

    const renderPage = req.app.locals.renderPage;
    renderPage(res, 'admin/dashboard.html', {
        title: 'Admin Dashboard',
        pageTitle: 'Dashboard',
        totalMembers,
        totalEmails,
        totalPhones,
        messagesToday,
        upcomingBirthdaysJSON: JSON.stringify(upcomingBirthdays),
        upcomingAnniversariesJSON: JSON.stringify(upcomingAnniversaries),
        verseReference: verse.reference,
        verseText: verse.text,
        verseTranslation: verse.translation,
        customBibleMessage: verse.customMessage || '',
        settingsJSON: JSON.stringify(settings),
        recentMessagesJSON: JSON.stringify(recentMessages)
    });
});

// ==================== MEMBERS PAGE ====================

router.get('/members', requireAuth, (req, res) => {
    const renderPage = req.app.locals.renderPage;
    renderPage(res, 'admin/members.html', {
        title: 'Manage Members',
        pageTitle: 'Members'
    });
});

// ==================== MESSAGES PAGE ====================

router.get('/messages', requireAuth, (req, res) => {
    const renderPage = req.app.locals.renderPage;
    renderPage(res, 'admin/messages.html', {
        title: 'Messages',
        pageTitle: 'Messages & History'
    });
});

// ==================== LESSONS PAGE ====================

router.get('/lessons', requireAuth, (req, res) => {
    const renderPage = req.app.locals.renderPage;
    renderPage(res, 'admin/lessons.html', {
        title: 'Bible Study Lessons',
        pageTitle: 'Lessons'
    });
});

// ==================== HELPER FUNCTIONS ====================

function getUpcomingDates(field, days) {
    const db = getDb();
    const dates = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const members = db.prepare(
            `SELECT * FROM members WHERE is_active = 1 AND ${field} = ?`
        ).all(mmdd);

        for (const member of members) {
            dates.push({
                name: `${member.first_name} ${member.last_name}`,
                date: mmdd,
                daysAway: i,
                label: i === 0 ? 'Today!' : i === 1 ? 'Tomorrow' : `In ${i} days`
            });
        }
    }

    return dates;
}

function getLoginPage(error) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Galilee Connect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        purple: { 900: '#2d0f42', 800: '#3d1559', 700: '#4a1a6b', 600: '#5c2382' },
                        gold: { 400: '#d4a843', 500: '#c49a38', 600: '#b08a2e' }
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="text-5xl mb-3">✝</div>
            <h1 class="text-2xl font-bold text-purple-900">Galilee Connect</h1>
            <p class="text-gray-500 mt-1">Admin Dashboard</p>
        </div>
        ${error ? '<div class="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">' + error + '</div>' : ''}
        <form method="POST" action="/admin/login">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" name="username" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Enter username">
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" name="password" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Enter password">
            </div>
            <button type="submit"
                class="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                Sign In
            </button>
        </form>
        <p class="text-center mt-4">
            <a href="/admin/forgot-password" class="text-purple-600 hover:text-purple-800 text-sm">Forgot password?</a>
        </p>
        <p class="text-center text-gray-400 text-xs mt-4">Galilee Missionary Baptist Church</p>
    </div>
</body>
</html>`;
}

function getForgotPasswordPage(message, error) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Galilee Connect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        purple: { 900: '#2d0f42', 800: '#3d1559', 700: '#4a1a6b', 600: '#5c2382' },
                        gold: { 400: '#d4a843', 500: '#c49a38', 600: '#b08a2e' }
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="text-5xl mb-3">🔑</div>
            <h1 class="text-2xl font-bold text-purple-900">Forgot Password</h1>
            <p class="text-gray-500 mt-1">Enter your admin username to receive a reset link</p>
        </div>
        ${message ? '<div class="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm text-center">' + message + '</div>' : ''}
        ${error ? '<div class="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">' + error + '</div>' : ''}
        ${message ? '' : `
        <form method="POST" action="/admin/forgot-password">
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" name="username" required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Enter your admin username">
            </div>
            <button type="submit"
                class="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                Send Reset Link
            </button>
        </form>
        `}
        <p class="text-center mt-4">
            <a href="/admin/login" class="text-purple-600 hover:text-purple-800 text-sm">← Back to Sign In</a>
        </p>
        <p class="text-center text-gray-400 text-xs mt-4">Galilee Missionary Baptist Church</p>
    </div>
</body>
</html>`;
}

function getResetPasswordPage(message, error, token) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Galilee Connect</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        purple: { 900: '#2d0f42', 800: '#3d1559', 700: '#4a1a6b', 600: '#5c2382' },
                        gold: { 400: '#d4a843', 500: '#c49a38', 600: '#b08a2e' }
                    }
                }
            }
        }
    </script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'Playfair Display', serif; }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="text-5xl mb-3">🔒</div>
            <h1 class="text-2xl font-bold text-purple-900">Reset Password</h1>
            <p class="text-gray-500 mt-1">${token ? 'Enter your new password' : ''}</p>
        </div>
        ${message ? '<div class="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm text-center">' + message + '</div>' : ''}
        ${error ? '<div class="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">' + error + '</div>' : ''}
        ${token ? `
        <form method="POST" action="/admin/reset-password">
            <input type="hidden" name="token" value="${token}">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" name="new_password" required minlength="6"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="At least 6 characters">
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" name="confirm_password" required minlength="6"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Re-enter new password">
            </div>
            <button type="submit"
                class="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-lg transition-colors duration-200">
                Reset Password
            </button>
        </form>
        ` : ''}
        <p class="text-center mt-4">
            <a href="/admin/login" class="text-purple-600 hover:text-purple-800 text-sm">← Back to Sign In</a>
        </p>
        <p class="text-center text-gray-400 text-xs mt-4">Galilee Missionary Baptist Church</p>
    </div>
</body>
</html>`;
}

module.exports = router;
