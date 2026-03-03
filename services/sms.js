/**
 * SMS Service - Twilio integration (pluggable for KLT Connect VoIP later)
 */

const logger = require('./logger');

let twilioClient = null;

function getClient() {
    if (!twilioClient && process.env.SMS_ENABLED === 'true') {
        try {
            const twilio = require('twilio');
            twilioClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
        } catch (err) {
            logger.error('Failed to initialize Twilio client:', err);
        }
    }
    return twilioClient;
}

/**
 * Send an SMS message
 * @param {string} to - Phone number (E.164 format)
 * @param {string} body - Message body
 * @returns {object} { success, messageId, error }
 */
async function sendSMS(to, body) {
    if (process.env.SMS_ENABLED !== 'true') {
        logger.info(`SMS disabled. Would send to ${to}: ${body.substring(0, 50)}...`);
        return { success: false, error: 'SMS not enabled' };
    }

    const client = getClient();
    if (!client) {
        return { success: false, error: 'SMS client not initialized' };
    }

    try {
        // Ensure phone number is in E.164 format
        let formattedNumber = to.replace(/[^\d+]/g, '');
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+1' + formattedNumber; // Assume US
        }

        const message = await client.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber
        });

        logger.info(`SMS sent to ${formattedNumber}: ${message.sid}`);
        return { success: true, messageId: message.sid };
    } catch (err) {
        logger.error(`Failed to send SMS to ${to}:`, err);
        return { success: false, error: err.message };
    }
}

module.exports = { sendSMS };
