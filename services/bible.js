/**
 * Bible Verse Fetcher Service
 * Fetches daily Bible verses from bible-api.com
 */

const logger = require('./logger');
const { getDb } = require('./database');

// Curated list of uplifting/daily devotional verses
const DAILY_VERSES = [
    'Psalm 118:24', 'Proverbs 3:5-6', 'Jeremiah 29:11', 'Philippians 4:13',
    'Isaiah 40:31', 'Romans 8:28', 'Psalm 23:1-3', 'Matthew 6:33',
    'Joshua 1:9', 'Psalm 46:1', 'Proverbs 16:3', 'Isaiah 41:10',
    'Psalm 37:4', 'Romans 12:2', 'Philippians 4:6-7', 'Psalm 119:105',
    'Proverbs 22:6', 'Isaiah 26:3', '2 Timothy 1:7', 'Psalm 91:1-2',
    'Matthew 11:28', 'Hebrews 11:1', 'Psalm 27:1', 'Romans 15:13',
    'Lamentations 3:22-23', 'Psalm 121:1-2', 'Proverbs 18:10', 'John 3:16',
    'Psalm 34:8', 'Isaiah 43:2', '2 Corinthians 5:7', 'Psalm 139:14',
    'Ephesians 2:10', 'Psalm 100:4-5', 'Proverbs 4:23', 'Micah 6:8',
    'Psalm 19:14', 'Colossians 3:23', 'Psalm 51:10', 'Galatians 5:22-23',
    'Psalm 143:8', 'Romans 8:31', 'Psalm 16:11', 'James 1:5',
    'Psalm 145:9', 'Proverbs 3:9-10', 'Psalm 103:1-2', 'Ephesians 6:10',
    'Psalm 62:1-2', 'Isaiah 55:8-9', 'Psalm 90:12', 'Romans 5:8',
    'Psalm 73:26', 'Matthew 5:16', 'Psalm 86:15', 'Hebrews 12:1-2',
    'Psalm 147:3', 'Philippians 1:6', 'Psalm 33:4', 'Colossians 3:15',
    '1 Thessalonians 5:16-18', 'Psalm 46:10', 'John 14:27', 'Psalm 30:5',
    'Proverbs 11:25', 'Psalm 107:1', 'Ephesians 3:20', 'Psalm 40:1-3',
    '2 Chronicles 7:14', 'Psalm 56:3', 'Romans 10:17', 'Psalm 18:2',
    'Isaiah 53:5', 'Psalm 63:1', 'Deuteronomy 31:6', 'Psalm 150:6',
    'Revelation 21:4', 'Psalm 1:1-3', 'John 15:5', 'Psalm 84:11',
    'Proverbs 31:25', 'Psalm 138:8', 'Matthew 28:20', 'Psalm 25:4-5',
    'James 4:8', 'Psalm 42:11', 'Numbers 6:24-26', 'Psalm 55:22',
    '1 Peter 5:7', 'Psalm 66:16-17', 'Isaiah 40:29', 'Psalm 9:1-2',
    'Nahum 1:7', 'Psalm 36:5-6', 'John 16:33', 'Psalm 145:18'
];

/**
 * Get the verse reference for today based on day of year
 */
function getTodayVerseReference() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

/**
 * Fetch a verse from the Bible API
 */
async function fetchVerse(reference) {
    const apiUrl = process.env.BIBLE_API_URL || 'https://bible-api.com';
    const url = `${apiUrl}/${encodeURIComponent(reference)}?translation=kjv`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Bible API returned ${response.status}`);
        }
        const data = await response.json();
        return {
            reference: data.reference || reference,
            text: data.text ? data.text.trim() : '',
            translation: 'KJV'
        };
    } catch (err) {
        logger.error(`Failed to fetch verse "${reference}":`, err);
        // Return a fallback verse
        return {
            reference: 'Proverbs 3:5-6',
            text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
            translation: 'KJV'
        };
    }
}

/**
 * Get today's Bible verse (cached in DB)
 */
async function getTodayVerse() {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Check cache
    const cached = db.prepare('SELECT * FROM bible_verse_cache WHERE date = ?').get(today);
    if (cached) {
        return {
            reference: cached.reference,
            text: cached.text,
            translation: cached.translation,
            customMessage: cached.custom_message
        };
    }

    // Fetch new verse
    const reference = getTodayVerseReference();
    const verse = await fetchVerse(reference);

    // Get custom message from settings
    const customSetting = db.prepare("SELECT value FROM settings WHERE key = 'custom_bible_message'").get();
    const customMessage = customSetting?.value || '';

    // Cache it
    try {
        db.prepare(`
            INSERT OR REPLACE INTO bible_verse_cache (date, reference, text, translation, custom_message)
            VALUES (?, ?, ?, ?, ?)
        `).run(today, verse.reference, verse.text, verse.translation, customMessage);
    } catch (err) {
        logger.error('Failed to cache verse:', err);
    }

    return { ...verse, customMessage };
}

/**
 * Get a preview of today's verse (for admin dashboard)
 */
async function getVersePreview() {
    return getTodayVerse();
}

module.exports = { getTodayVerse, fetchVerse, getVersePreview, getTodayVerseReference, DAILY_VERSES };
