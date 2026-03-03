/**
 * Notification Service - Sends emails and SMS to members
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');
const { getDb } = require('./database');
const { sendSMS } = require('./sms');
const { getTodayVerse } = require('./bible');

let emailTransporter = null;

/**
 * Get the application base URL for outbound links (reset emails, notifications, etc.)
 * Priority: APP_BASE_URL > BASE_URL > http://localhost:3000
 */
function getAppBaseUrl() {
    return process.env.APP_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
}

function getEmailTransporter() {
    if (!emailTransporter && process.env.EMAIL_ENABLED === 'true') {
        emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return emailTransporter;
}

/**
 * Send an email to a member
 */
async function sendEmail(to, subject, htmlBody, textBody) {
    if (process.env.EMAIL_ENABLED !== 'true') {
        logger.info(`Email disabled. Would send to ${to}: ${subject}`);
        return { success: true, simulated: true };
    }

    const transporter = getEmailTransporter();
    if (!transporter) {
        return { success: false, error: 'Email transporter not configured' };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
            to: to,
            subject: subject,
            html: htmlBody,
            text: textBody
        });

        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        logger.error(`Failed to send email to ${to}:`, err);
        return { success: false, error: err.message };
    }
}

/**
 * Build an HTML email template
 */
function buildEmailHTML(title, body, memberUuid) {
    const baseUrl = getAppBaseUrl();
    const churchName = process.env.CHURCH_NAME || 'Galilee Missionary Baptist Church';
    const unsubscribeUrl = `${baseUrl}/unsubscribe?id=${memberUuid || ''}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; font-family: Georgia, 'Times New Roman', serif; background-color: #f4f1f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #4a1a6b 0%, #2d0f42 100%); padding: 30px; text-align: center;">
                <h1 style="color: #d4a843; margin: 0; font-size: 24px; letter-spacing: 1px;">✝ ${churchName}</h1>
                <p style="color: #c9b3e0; margin: 5px 0 0; font-size: 14px;">Florence, Alabama</p>
            </td>
        </tr>
        <!-- Content -->
        <tr>
            <td style="padding: 30px; color: #333; line-height: 1.6;">
                <h2 style="color: #4a1a6b; margin-top: 0;">${title}</h2>
                ${body}
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td style="background: #f4f1f7; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">${churchName}</p>
                <p style="margin: 5px 0;">Pastor Moshiu Knox</p>
                <p style="margin: 10px 0 0;">
                    <a href="${unsubscribeUrl}" style="color: #888;">Manage subscription preferences</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Log a message to the database
 */
function logMessage(memberId, memberName, channel, messageType, subject, body, status, error) {
    const db = getDb();
    try {
        db.prepare(`
            INSERT INTO message_log (member_id, member_name, channel, message_type, subject, body, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(memberId, memberName, channel, messageType, subject, body, status, error || null);
    } catch (err) {
        logger.error('Failed to log message:', err);
    }
}

/**
 * Send daily Bible verse to all active, subscribed members
 */
async function sendDailyBibleVerse() {
    logger.info('Starting daily Bible verse send...');
    const db = getDb();

    const verse = await getTodayVerse();
    if (!verse || !verse.text) {
        logger.error('No verse available for today');
        return;
    }

    const members = db.prepare(
        'SELECT * FROM members WHERE is_active = 1 AND email_subscribed = 1 AND email IS NOT NULL'
    ).all();

    logger.info(`Sending Bible verse to ${members.length} members`);

    const customMsg = verse.customMessage
        ? `<p style="font-style: italic; color: #4a1a6b; margin-top: 20px;">${verse.customMessage}</p>`
        : '';

    const subject = `📖 Daily Verse: ${verse.reference}`;
    const body = `
        <div style="background: #f9f7fb; border-left: 4px solid #d4a843; padding: 20px; margin: 10px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 18px; font-style: italic; color: #333; margin: 0;">"${verse.text}"</p>
            <p style="font-weight: bold; color: #4a1a6b; margin: 10px 0 0;">— ${verse.reference} (${verse.translation})</p>
        </div>
        ${customMsg}
        <p style="margin-top: 20px; color: #555;">Have a blessed day! 🙏</p>
    `;
    const textBody = `📖 ${verse.reference}\n\n"${verse.text}" — ${verse.reference} (${verse.translation})\n\n${verse.customMessage || ''}\n\nHave a blessed day! 🙏`;

    for (const member of members) {
        try {
            const html = buildEmailHTML(`Daily Verse: ${verse.reference}`, body, member.uuid);
            const result = await sendEmail(member.email, subject, html, textBody);
            logMessage(member.id, `${member.first_name} ${member.last_name}`, 'email', 'bible_verse', subject, verse.reference, result.success ? 'sent' : 'failed', result.error);
        } catch (err) {
            logger.error(`Error sending verse to ${member.email}:`, err);
            logMessage(member.id, `${member.first_name} ${member.last_name}`, 'email', 'bible_verse', subject, verse.reference, 'failed', err.message);
        }
    }

    // SMS if enabled
    if (process.env.SMS_ENABLED === 'true') {
        const smsMembers = db.prepare(
            'SELECT * FROM members WHERE is_active = 1 AND sms_subscribed = 1 AND phone IS NOT NULL'
        ).all();

        for (const member of smsMembers) {
            try {
                const smsText = `✝ ${process.env.CHURCH_NAME}\n\n📖 ${verse.reference}\n"${verse.text}"\n\nHave a blessed day! 🙏`;
                const result = await sendSMS(member.phone, smsText);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'sms', 'bible_verse', null, verse.reference, result.success ? 'sent' : 'failed', result.error);
            } catch (err) {
                logger.error(`Error sending SMS verse to ${member.phone}:`, err);
            }
        }
    }

    logger.info('Daily Bible verse send complete');
}

/**
 * Send birthday wishes to members whose birthday is today
 */
async function sendBirthdayWishes() {
    logger.info('Checking for birthdays...');
    const db = getDb();

    const today = new Date();
    const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const birthdayMembers = db.prepare(
        'SELECT * FROM members WHERE is_active = 1 AND birthday = ?'
    ).all(mmdd);

    if (birthdayMembers.length === 0) {
        logger.info('No birthdays today');
        return;
    }

    logger.info(`Found ${birthdayMembers.length} birthday(s) today`);

    const templateSetting = db.prepare("SELECT value FROM settings WHERE key = 'birthday_template'").get();
    const template = templateSetting?.value || 'Happy Birthday, {{first_name}}! 🎂 Have a blessed day!';

    for (const member of birthdayMembers) {
        const personalMessage = template
            .replace(/\{\{first_name\}\}/g, member.first_name)
            .replace(/\{\{last_name\}\}/g, member.last_name)
            .replace(/\{\{full_name\}\}/g, `${member.first_name} ${member.last_name}`);

        const subject = `🎂 Happy Birthday, ${member.first_name}!`;
        const body = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 48px; margin: 0;">🎂</p>
                <h2 style="color: #4a1a6b; margin: 10px 0;">Happy Birthday, ${member.first_name}!</h2>
                <p style="font-size: 16px; color: #555; line-height: 1.8; max-width: 400px; margin: 0 auto;">${personalMessage}</p>
            </div>
        `;

        // Email
        if (member.email && member.email_subscribed) {
            try {
                const html = buildEmailHTML(`Happy Birthday, ${member.first_name}!`, body, member.uuid);
                const result = await sendEmail(member.email, subject, html, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'email', 'birthday', subject, personalMessage, result.success ? 'sent' : 'failed', result.error);
            } catch (err) {
                logger.error(`Error sending birthday email to ${member.email}:`, err);
            }
        }

        // SMS
        if (process.env.SMS_ENABLED === 'true' && member.phone && member.sms_subscribed) {
            try {
                const result = await sendSMS(member.phone, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'sms', 'birthday', null, personalMessage, result.success ? 'sent' : 'failed', result.error);
            } catch (err) {
                logger.error(`Error sending birthday SMS to ${member.phone}:`, err);
            }
        }
    }

    logger.info('Birthday wishes sent');
}

/**
 * Send anniversary wishes to members whose anniversary is today
 */
async function sendAnniversaryWishes() {
    logger.info('Checking for anniversaries...');
    const db = getDb();

    const today = new Date();
    const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const anniversaryMembers = db.prepare(
        'SELECT * FROM members WHERE is_active = 1 AND anniversary = ?'
    ).all(mmdd);

    if (anniversaryMembers.length === 0) {
        logger.info('No anniversaries today');
        return;
    }

    logger.info(`Found ${anniversaryMembers.length} anniversary/ies today`);

    const templateSetting = db.prepare("SELECT value FROM settings WHERE key = 'anniversary_template'").get();
    const template = templateSetting?.value || 'Happy Anniversary, {{first_name}}! 💒 God bless your union!';

    for (const member of anniversaryMembers) {
        const personalMessage = template
            .replace(/\{\{first_name\}\}/g, member.first_name)
            .replace(/\{\{last_name\}\}/g, member.last_name)
            .replace(/\{\{full_name\}\}/g, `${member.first_name} ${member.last_name}`);

        const subject = `💒 Happy Anniversary, ${member.first_name}!`;
        const body = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 48px; margin: 0;">💒</p>
                <h2 style="color: #4a1a6b; margin: 10px 0;">Happy Anniversary, ${member.first_name}!</h2>
                <p style="font-size: 16px; color: #555; line-height: 1.8; max-width: 400px; margin: 0 auto;">${personalMessage}</p>
            </div>
        `;

        if (member.email && member.email_subscribed) {
            try {
                const html = buildEmailHTML(`Happy Anniversary, ${member.first_name}!`, body, member.uuid);
                const result = await sendEmail(member.email, subject, html, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'email', 'anniversary', subject, personalMessage, result.success ? 'sent' : 'failed', result.error);
            } catch (err) {
                logger.error(`Error sending anniversary email to ${member.email}:`, err);
            }
        }

        if (process.env.SMS_ENABLED === 'true' && member.phone && member.sms_subscribed) {
            try {
                const result = await sendSMS(member.phone, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'sms', 'anniversary', null, personalMessage, result.success ? 'sent' : 'failed', result.error);
            } catch (err) {
                logger.error(`Error sending anniversary SMS to ${member.phone}:`, err);
            }
        }
    }

    logger.info('Anniversary wishes sent');
}

/**
 * Send a manual message to selected members
 */
async function sendManualMessage(subject, message, memberIds, channel = 'email') {
    logger.info(`Sending manual message to ${memberIds.length} member(s) via ${channel}`);
    const db = getDb();

    const placeholders = memberIds.map(() => '?').join(',');
    const members = db.prepare(
        `SELECT * FROM members WHERE id IN (${placeholders}) AND is_active = 1`
    ).all(...memberIds);

    const results = { sent: 0, failed: 0 };

    for (const member of members) {
        const personalMessage = message
            .replace(/\{\{first_name\}\}/g, member.first_name)
            .replace(/\{\{last_name\}\}/g, member.last_name)
            .replace(/\{\{full_name\}\}/g, `${member.first_name} ${member.last_name}`);

        if (channel === 'email' && member.email) {
            try {
                const body = `<p style="line-height: 1.8; color: #333;">${personalMessage.replace(/\n/g, '<br>')}</p>`;
                const html = buildEmailHTML(subject, body, member.uuid);
                const result = await sendEmail(member.email, subject, html, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'email', 'manual', subject, personalMessage, result.success ? 'sent' : 'failed', result.error);
                if (result.success) results.sent++;
                else results.failed++;
            } catch (err) {
                results.failed++;
                logger.error(`Error sending manual email to ${member.email}:`, err);
            }
        }

        if (channel === 'sms' && member.phone) {
            try {
                const result = await sendSMS(member.phone, personalMessage);
                logMessage(member.id, `${member.first_name} ${member.last_name}`, 'sms', 'manual', subject, personalMessage, result.success ? 'sent' : 'failed', result.error);
                if (result.success) results.sent++;
                else results.failed++;
            } catch (err) {
                results.failed++;
                logger.error(`Error sending manual SMS to ${member.phone}:`, err);
            }
        }
    }

    logger.info(`Manual message complete: ${results.sent} sent, ${results.failed} failed`);
    return results;
}

module.exports = {
    sendDailyBibleVerse,
    sendBirthdayWishes,
    sendAnniversaryWishes,
    sendManualMessage,
    sendEmail,
    buildEmailHTML,
    logMessage,
    getAppBaseUrl
};
