/**
 * Scheduler Service - Runs daily cron jobs for notifications
 */

const cron = require('node-cron');
const logger = require('./logger');
const { sendDailyBibleVerse, sendBirthdayWishes, sendAnniversaryWishes } = require('./notifications');
const { getDb } = require('./database');

let scheduledTask = null;

function initScheduler() {
    // Get send time from settings or env
    const db = getDb();
    let sendHour = parseInt(process.env.SEND_HOUR) || 8;
    let sendMinute = parseInt(process.env.SEND_MINUTE) || 0;

    try {
        const hourSetting = db.prepare("SELECT value FROM settings WHERE key = 'send_hour'").get();
        const minuteSetting = db.prepare("SELECT value FROM settings WHERE key = 'send_minute'").get();
        if (hourSetting) sendHour = parseInt(hourSetting.value);
        if (minuteSetting) sendMinute = parseInt(minuteSetting.value);
    } catch (err) {
        logger.warn('Could not read schedule settings, using defaults');
    }

    const timezone = process.env.TIMEZONE || 'America/Chicago';
    const cronExpression = `${sendMinute} ${sendHour} * * *`;

    // Cancel existing task if any
    if (scheduledTask) {
        scheduledTask.stop();
    }

    logger.info(`Scheduling daily notifications at ${sendHour}:${String(sendMinute).padStart(2, '0')} ${timezone}`);

    scheduledTask = cron.schedule(cronExpression, async () => {
        logger.info('=== Running daily notification job ===');

        try {
            // Check if each type is enabled
            const bibleEnabled = db.prepare("SELECT value FROM settings WHERE key = 'bible_verse_enabled'").get();
            const birthdayEnabled = db.prepare("SELECT value FROM settings WHERE key = 'birthday_enabled'").get();
            const anniversaryEnabled = db.prepare("SELECT value FROM settings WHERE key = 'anniversary_enabled'").get();

            if (!bibleEnabled || bibleEnabled.value === 'true') {
                await sendDailyBibleVerse();
            }

            if (!birthdayEnabled || birthdayEnabled.value === 'true') {
                await sendBirthdayWishes();
            }

            if (!anniversaryEnabled || anniversaryEnabled.value === 'true') {
                await sendAnniversaryWishes();
            }

            logger.info('=== Daily notification job complete ===');
        } catch (err) {
            logger.error('Error in daily notification job:', err);
        }
    }, {
        timezone: timezone,
        scheduled: true
    });

    logger.info('Scheduler initialized successfully');
}

function reschedule() {
    logger.info('Rescheduling notifications...');
    initScheduler();
}

/**
 * Run notifications immediately (for testing/manual trigger)
 */
async function runNow() {
    logger.info('Running notifications immediately (manual trigger)');
    try {
        await sendDailyBibleVerse();
        await sendBirthdayWishes();
        await sendAnniversaryWishes();
        return { success: true };
    } catch (err) {
        logger.error('Error running immediate notifications:', err);
        return { success: false, error: err.message };
    }
}

module.exports = { initScheduler, reschedule, runNow };
