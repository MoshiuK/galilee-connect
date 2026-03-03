/**
 * API Routes - Used by admin dashboard AJAX calls
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../services/database');
const { sendManualMessage } = require('../services/notifications');
const { getVersePreview, fetchVerse, getTodayVerseReference } = require('../services/bible');
const { runNow, reschedule } = require('../services/scheduler');
const logger = require('../services/logger');

// File upload config
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// Lesson attachment upload config
const lessonUploadDir = path.join(__dirname, '..', 'data', 'uploads', 'lessons');
if (!fs.existsSync(lessonUploadDir)) {
    fs.mkdirSync(lessonUploadDir, { recursive: true });
}
const lessonUpload = multer({
    dest: lessonUploadDir,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * Auth middleware for API
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// ==================== MEMBERS API ====================

// List all members
router.get('/members', requireAuth, (req, res) => {
    const db = getDb();
    const search = req.query.search || '';
    const activeOnly = req.query.active !== 'false';

    let query = 'SELECT * FROM members';
    const params = [];

    const conditions = [];
    if (activeOnly) {
        conditions.push('is_active = 1');
    }
    if (search) {
        conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY last_name, first_name';

    const members = db.prepare(query).all(...params);
    res.json({ success: true, members });
});

// Get single member
router.get('/members/:id', requireAuth, (req, res) => {
    const db = getDb();
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) {
        return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ success: true, member });
});

// Add member
router.post('/members', requireAuth, (req, res) => {
    const { first_name, last_name, email, phone, birthday, birthday_full, anniversary, anniversary_full, join_date, notes } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First and last name are required' });
    }

    const db = getDb();
    try {
        const uuid = uuidv4();
        const result = db.prepare(`
            INSERT INTO members (uuid, first_name, last_name, email, phone, birthday, birthday_full, anniversary, anniversary_full, join_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uuid, first_name.trim(), last_name.trim(), email?.trim() || null, phone?.trim() || null,
            birthday || null, birthday_full || null, anniversary || null, anniversary_full || null,
            join_date || new Date().toISOString().split('T')[0], notes || null);

        logger.info(`Member added: ${first_name} ${last_name} (ID: ${result.lastInsertRowid})`);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        logger.error('Error adding member:', err);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Update member
router.put('/members/:id', requireAuth, (req, res) => {
    const { first_name, last_name, email, phone, birthday, birthday_full, anniversary, anniversary_full, join_date, notes, is_active, email_subscribed, sms_subscribed } = req.body;

    const db = getDb();
    try {
        db.prepare(`
            UPDATE members SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                email = ?,
                phone = ?,
                birthday = ?,
                birthday_full = ?,
                anniversary = ?,
                anniversary_full = ?,
                join_date = COALESCE(?, join_date),
                notes = ?,
                is_active = COALESCE(?, is_active),
                email_subscribed = COALESCE(?, email_subscribed),
                sms_subscribed = COALESCE(?, sms_subscribed),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(first_name, last_name, email || null, phone || null,
            birthday || null, birthday_full || null, anniversary || null, anniversary_full || null,
            join_date, notes || null,
            is_active != null ? (is_active ? 1 : 0) : null,
            email_subscribed != null ? (email_subscribed ? 1 : 0) : null,
            sms_subscribed != null ? (sms_subscribed ? 1 : 0) : null,
            req.params.id);

        logger.info(`Member updated: ID ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating member:', err);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// Delete (deactivate) member
router.delete('/members/:id', requireAuth, (req, res) => {
    const db = getDb();
    try {
        db.prepare('UPDATE members SET is_active = 0, updated_at = datetime(\'now\') WHERE id = ?').run(req.params.id);
        logger.info(`Member deactivated: ID ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error deleting member:', err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// Import members from CSV
router.post('/members/import', requireAuth, upload.single('csvfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true
        });

        const db = getDb();
        let imported = 0;
        let skipped = 0;
        const errors = [];

        const insertStmt = db.prepare(`
            INSERT INTO members (uuid, first_name, last_name, email, phone, birthday, anniversary, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const record of records) {
            // Flexible column name mapping
            const firstName = record.first_name || record.firstName || record['First Name'] || record.first || '';
            const lastName = record.last_name || record.lastName || record['Last Name'] || record.last || '';
            const email = record.email || record.Email || record['E-mail'] || '';
            const phone = record.phone || record.Phone || record['Phone Number'] || record.mobile || '';
            const birthday = record.birthday || record.Birthday || record['Birth Date'] || '';
            const anniversary = record.anniversary || record.Anniversary || '';
            const joinDate = record.join_date || record.joinDate || record['Join Date'] || '';

            if (!firstName || !lastName) {
                skipped++;
                continue;
            }

            // Parse birthday to MM-DD format
            let birthdayMMDD = null;
            if (birthday) {
                birthdayMMDD = parseDateToMMDD(birthday);
            }

            let anniversaryMMDD = null;
            if (anniversary) {
                anniversaryMMDD = parseDateToMMDD(anniversary);
            }

            try {
                // Check for duplicate email
                if (email) {
                    const existing = db.prepare('SELECT id FROM members WHERE email = ? AND is_active = 1').get(email);
                    if (existing) {
                        skipped++;
                        continue;
                    }
                }

                insertStmt.run(
                    uuidv4(),
                    firstName.trim(),
                    lastName.trim(),
                    email.trim() || null,
                    phone.trim() || null,
                    birthdayMMDD,
                    anniversaryMMDD,
                    joinDate || new Date().toISOString().split('T')[0]
                );
                imported++;
            } catch (err) {
                errors.push(`Row ${firstName} ${lastName}: ${err.message}`);
                skipped++;
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        logger.info(`CSV import: ${imported} imported, ${skipped} skipped`);
        res.json({
            success: true,
            imported,
            skipped,
            total: records.length,
            errors: errors.slice(0, 5) // Return first 5 errors
        });
    } catch (err) {
        logger.error('CSV import error:', err);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to import CSV: ' + err.message });
    }
});

// ==================== MESSAGES API ====================

// Get message log
router.get('/messages', requireAuth, (req, res) => {
    const db = getDb();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const type = req.query.type;

    let query = 'SELECT * FROM message_log';
    const params = [];

    if (type) {
        query += ' WHERE message_type = ?';
        params.push(type);
    }

    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;

    query += ' ORDER BY sent_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const messages = db.prepare(query).all(...params);

    res.json({
        success: true,
        messages,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// Send manual message
router.post('/messages/send', requireAuth, async (req, res) => {
    const { subject, message, member_ids, channel } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (!member_ids || member_ids.length === 0) {
        return res.status(400).json({ error: 'Please select at least one recipient' });
    }

    try {
        const results = await sendManualMessage(subject, message, member_ids, channel || 'email');
        res.json({ success: true, ...results });
    } catch (err) {
        logger.error('Error sending manual message:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// ==================== SETTINGS API ====================

router.get('/settings', requireAuth, (req, res) => {
    const db = getDb();
    const settings = {};
    const rows = db.prepare('SELECT * FROM settings').all();
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    res.json({ success: true, settings });
});

router.put('/settings', requireAuth, (req, res) => {
    const db = getDb();
    const updates = req.body;

    try {
        const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))");
        for (const [key, value] of Object.entries(updates)) {
            stmt.run(key, String(value));
        }

        // If schedule changed, reschedule
        if (updates.send_hour !== undefined || updates.send_minute !== undefined) {
            reschedule();
        }

        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating settings:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ==================== BIBLE VERSE API ====================

router.get('/verse/today', requireAuth, async (req, res) => {
    try {
        const verse = await getVersePreview();
        res.json({ success: true, verse });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch verse' });
    }
});

router.put('/verse/custom-message', requireAuth, (req, res) => {
    const { message } = req.body;
    const db = getDb();

    try {
        db.prepare("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('custom_bible_message', ?, datetime('now'))").run(message || '');

        // Update today's cache too
        const today = new Date().toISOString().split('T')[0];
        db.prepare('UPDATE bible_verse_cache SET custom_message = ? WHERE date = ?').run(message || '', today);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update custom message' });
    }
});

// ==================== SCHEDULER API ====================

router.post('/scheduler/run-now', requireAuth, async (req, res) => {
    try {
        const result = await runNow();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to run notifications' });
    }
});

// ==================== STATS API ====================

router.get('/stats', requireAuth, (req, res) => {
    const db = getDb();

    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM members WHERE is_active = 1').get().count;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM message_log').get().count;
    const messagesSent = db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'sent'").get().count;
    const messagesFailed = db.prepare("SELECT COUNT(*) as count FROM message_log WHERE status = 'failed'").get().count;

    // Messages by type
    const byType = db.prepare(
        "SELECT message_type, COUNT(*) as count FROM message_log GROUP BY message_type"
    ).all();

    // Messages last 7 days
    const last7Days = db.prepare(`
        SELECT date(sent_at) as date, COUNT(*) as count
        FROM message_log
        WHERE sent_at >= date('now', '-7 days')
        GROUP BY date(sent_at)
        ORDER BY date
    `).all();

    res.json({
        success: true,
        stats: {
            totalMembers,
            totalMessages,
            messagesSent,
            messagesFailed,
            byType,
            last7Days
        }
    });
});

// ==================== ADMIN PASSWORD ====================

router.put('/admin/password', requireAuth, (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = getDb();
    const username = req.session.adminUsername;
    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    try {
        const hash = bcrypt.hashSync(new_password, 10);
        db.prepare("UPDATE admin_users SET password_hash = ?, updated_at = datetime('now') WHERE username = ?").run(hash, username);
        logger.info(`Admin password changed for: ${username}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error changing password:', err);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Get admin profile (email)
router.get('/admin/profile', requireAuth, (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT id, username, email, created_at FROM admin_users WHERE username = ?').get(req.session.adminUsername);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
});

// Update admin email
router.put('/admin/email', requireAuth, (req, res) => {
    const { email } = req.body;

    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    const db = getDb();
    try {
        db.prepare("UPDATE admin_users SET email = ?, updated_at = datetime('now') WHERE username = ?").run(email.trim(), req.session.adminUsername);
        logger.info(`Admin email updated for: ${req.session.adminUsername}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating admin email:', err);
        res.status(500).json({ error: 'Failed to update email' });
    }
});

// ==================== LESSONS API ====================

// List all lessons
router.get('/lessons', requireAuth, (req, res) => {
    const db = getDb();
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = 'SELECT l.*, (SELECT COUNT(*) FROM lesson_attachments WHERE lesson_id = l.id) as attachment_count FROM lessons l';
    const params = [];
    const conditions = [];

    if (search) {
        conditions.push("(l.title LIKE ? OR l.scripture_reference LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
        conditions.push('l.status = ?');
        params.push(status);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.study_date DESC, l.created_at DESC';

    const lessons = db.prepare(query).all(...params);
    res.json({ success: true, lessons });
});

// Get single lesson with attachments
router.get('/lessons/:id', requireAuth, (req, res) => {
    const db = getDb();
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.id);
    if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
    }
    const attachments = db.prepare('SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY created_at').all(lesson.id);
    res.json({ success: true, lesson, attachments });
});

// Create lesson
router.post('/lessons', requireAuth, (req, res) => {
    const { title, description, scripture_reference, content, study_date, status } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const db = getDb();
    try {
        const result = db.prepare(`
            INSERT INTO lessons (title, description, scripture_reference, content, study_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title.trim(), description?.trim() || null, scripture_reference?.trim() || null,
            content?.trim() || null, study_date || null, status || 'draft');

        logger.info(`Lesson created: "${title}" (ID: ${result.lastInsertRowid})`);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        logger.error('Error creating lesson:', err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// Update lesson
router.put('/lessons/:id', requireAuth, (req, res) => {
    const { title, description, scripture_reference, content, study_date, status } = req.body;

    const db = getDb();
    try {
        db.prepare(`
            UPDATE lessons SET
                title = COALESCE(?, title),
                description = ?,
                scripture_reference = ?,
                content = ?,
                study_date = ?,
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ?
        `).run(title?.trim(), description?.trim() || null, scripture_reference?.trim() || null,
            content?.trim() || null, study_date || null, status, req.params.id);

        logger.info(`Lesson updated: ID ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error updating lesson:', err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// Delete lesson (and its attachments)
router.delete('/lessons/:id', requireAuth, (req, res) => {
    const db = getDb();
    try {
        // Delete attachment files from disk
        const attachments = db.prepare('SELECT * FROM lesson_attachments WHERE lesson_id = ?').all(req.params.id);
        for (const att of attachments) {
            const filePath = path.join(__dirname, '..', att.file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from DB (cascade handles lesson_attachments)
        db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id);
        logger.info(`Lesson deleted: ID ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error deleting lesson:', err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

// ==================== LESSON ATTACHMENTS API ====================

// Upload attachment(s) to a lesson
router.post('/lessons/:id/attachments', requireAuth, lessonUpload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const db = getDb();
    const lesson = db.prepare('SELECT id FROM lessons WHERE id = ?').get(req.params.id);
    if (!lesson) {
        // Clean up uploaded files
        for (const file of req.files) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
        return res.status(404).json({ error: 'Lesson not found' });
    }

    try {
        const inserted = [];
        const stmt = db.prepare(`
            INSERT INTO lesson_attachments (lesson_id, filename, original_name, file_path, file_size, mime_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const file of req.files) {
            // Rename to UUID-based name to prevent conflicts
            const ext = path.extname(file.originalname);
            const newFilename = uuidv4() + ext;
            const newPath = path.join(lessonUploadDir, newFilename);
            fs.renameSync(file.path, newPath);

            const relativePath = path.join('data', 'uploads', 'lessons', newFilename);
            const result = stmt.run(req.params.id, newFilename, file.originalname, relativePath, file.size, file.mimetype);
            inserted.push({
                id: result.lastInsertRowid,
                original_name: file.originalname,
                file_size: file.size,
                mime_type: file.mimetype
            });
        }

        logger.info(`${inserted.length} attachment(s) uploaded to lesson ${req.params.id}`);
        res.json({ success: true, attachments: inserted });
    } catch (err) {
        logger.error('Error uploading attachments:', err);
        res.status(500).json({ error: 'Failed to upload attachments' });
    }
});

// Download attachment
router.get('/lessons/:id/attachments/:attachmentId/download', requireAuth, (req, res) => {
    const db = getDb();
    const att = db.prepare('SELECT * FROM lesson_attachments WHERE id = ? AND lesson_id = ?').get(req.params.attachmentId, req.params.id);
    if (!att) {
        return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(__dirname, '..', att.file_path);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(filePath, att.original_name);
});

// Replace attachment
router.put('/lessons/:id/attachments/:attachmentId', requireAuth, lessonUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDb();
    const att = db.prepare('SELECT * FROM lesson_attachments WHERE id = ? AND lesson_id = ?').get(req.params.attachmentId, req.params.id);
    if (!att) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Attachment not found' });
    }

    try {
        // Delete old file
        const oldPath = path.join(__dirname, '..', att.file_path);
        if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
        }

        // Rename new file
        const ext = path.extname(req.file.originalname);
        const newFilename = uuidv4() + ext;
        const newPath = path.join(lessonUploadDir, newFilename);
        fs.renameSync(req.file.path, newPath);

        const relativePath = path.join('data', 'uploads', 'lessons', newFilename);
        db.prepare(`
            UPDATE lesson_attachments SET
                filename = ?, original_name = ?, file_path = ?, file_size = ?, mime_type = ?, created_at = datetime('now')
            WHERE id = ?
        `).run(newFilename, req.file.originalname, relativePath, req.file.size, req.file.mimetype, att.id);

        logger.info(`Attachment replaced: ID ${att.id} on lesson ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error replacing attachment:', err);
        res.status(500).json({ error: 'Failed to replace attachment' });
    }
});

// Delete attachment
router.delete('/lessons/:id/attachments/:attachmentId', requireAuth, (req, res) => {
    const db = getDb();
    const att = db.prepare('SELECT * FROM lesson_attachments WHERE id = ? AND lesson_id = ?').get(req.params.attachmentId, req.params.id);
    if (!att) {
        return res.status(404).json({ error: 'Attachment not found' });
    }

    try {
        const filePath = path.join(__dirname, '..', att.file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        db.prepare('DELETE FROM lesson_attachments WHERE id = ?').run(att.id);
        logger.info(`Attachment deleted: ID ${att.id} from lesson ${req.params.id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error('Error deleting attachment:', err);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

// ==================== HELPERS ====================

function parseDateToMMDD(dateStr) {
    // Try various date formats
    const str = dateStr.trim();

    // Already in MM-DD format
    if (/^\d{1,2}-\d{1,2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }

    // MM/DD or MM/DD/YYYY
    if (/^\d{1,2}\/\d{1,2}/.test(str)) {
        const parts = str.split('/');
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    // Try native Date parsing
    try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    } catch (e) {}

    return null;
}

module.exports = router;
