/**
 * Member-Facing Routes (Registration, Unsubscribe)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../services/database');
const logger = require('../services/logger');

// Member self-registration
router.post('/register', (req, res) => {
    const { first_name, last_name, email, phone, birthday_month, birthday_day, anniversary_month, anniversary_day } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ success: false, error: 'First and last name are required' });
    }

    if (!email && !phone) {
        return res.status(400).json({ success: false, error: 'Please provide either an email or phone number' });
    }

    const db = getDb();

    // Check for duplicate email
    if (email) {
        const existing = db.prepare('SELECT id FROM members WHERE email = ? AND is_active = 1').get(email);
        if (existing) {
            return res.status(400).json({ success: false, error: 'This email is already registered. Contact the church office if you need to update your information.' });
        }
    }

    // Format birthday and anniversary
    let birthday = null;
    if (birthday_month && birthday_day) {
        birthday = `${String(birthday_month).padStart(2, '0')}-${String(birthday_day).padStart(2, '0')}`;
    }

    let anniversary = null;
    if (anniversary_month && anniversary_day) {
        anniversary = `${String(anniversary_month).padStart(2, '0')}-${String(anniversary_day).padStart(2, '0')}`;
    }

    try {
        const uuid = uuidv4();
        db.prepare(`
            INSERT INTO members (uuid, first_name, last_name, email, phone, birthday, anniversary, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'))
        `).run(uuid, first_name.trim(), last_name.trim(), email?.trim() || null, phone?.trim() || null, birthday, anniversary);

        logger.info(`New member registered: ${first_name} ${last_name}`);
        res.json({ success: true, message: 'Welcome to the Galilee family! You\'re now signed up to receive our daily blessings.' });
    } catch (err) {
        logger.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
    }
});

// Unsubscribe
router.post('/unsubscribe', (req, res) => {
    const { uuid, email, unsubscribe_email, unsubscribe_sms } = req.body;
    const db = getDb();

    let member;
    if (uuid) {
        member = db.prepare('SELECT * FROM members WHERE uuid = ?').get(uuid);
    } else if (email) {
        member = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
    }

    if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found. Please check your email address.' });
    }

    try {
        if (unsubscribe_email === 'true' || unsubscribe_email === true) {
            db.prepare('UPDATE members SET email_subscribed = 0, updated_at = datetime(\'now\') WHERE id = ?').run(member.id);
        }
        if (unsubscribe_sms === 'true' || unsubscribe_sms === true) {
            db.prepare('UPDATE members SET sms_subscribed = 0, updated_at = datetime(\'now\') WHERE id = ?').run(member.id);
        }

        logger.info(`Member unsubscribed: ${member.first_name} ${member.last_name} (email: ${unsubscribe_email}, sms: ${unsubscribe_sms})`);
        res.json({ success: true, message: 'Your subscription preferences have been updated.' });
    } catch (err) {
        logger.error('Unsubscribe error:', err);
        res.status(500).json({ success: false, error: 'Failed to update preferences. Please try again.' });
    }
});

module.exports = router;
