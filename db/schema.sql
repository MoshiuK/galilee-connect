-- Galilee Connect Database Schema

CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birthday TEXT,          -- MM-DD format
    birthday_full TEXT,     -- YYYY-MM-DD format (optional, for age)
    anniversary TEXT,       -- MM-DD format
    anniversary_full TEXT,  -- YYYY-MM-DD format (optional)
    join_date TEXT,         -- YYYY-MM-DD
    is_active INTEGER DEFAULT 1,
    email_subscribed INTEGER DEFAULT 1,
    sms_subscribed INTEGER DEFAULT 1,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER,
    member_name TEXT,
    channel TEXT NOT NULL,       -- 'email' or 'sms'
    message_type TEXT NOT NULL,  -- 'bible_verse', 'birthday', 'anniversary', 'manual'
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'pending',  -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bible_verse_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,  -- YYYY-MM-DD
    reference TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT DEFAULT 'KJV',
    custom_message TEXT,
    fetched_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_birthday ON members(birthday);
CREATE INDEX IF NOT EXISTS idx_members_anniversary ON members(anniversary);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);
CREATE INDEX IF NOT EXISTS idx_members_uuid ON members(uuid);
CREATE INDEX IF NOT EXISTS idx_message_log_date ON message_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_log_type ON message_log(message_type);
CREATE INDEX IF NOT EXISTS idx_message_log_member ON message_log(member_id);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Bible Study Lessons
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    scripture_reference TEXT,
    content TEXT,
    study_date TEXT,            -- YYYY-MM-DD
    status TEXT DEFAULT 'draft', -- 'draft' or 'published'
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Lesson Attachments
CREATE TABLE IF NOT EXISTS lesson_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(study_date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('send_hour', '8');
INSERT OR IGNORE INTO settings (key, value) VALUES ('send_minute', '0');
INSERT OR IGNORE INTO settings (key, value) VALUES ('bible_verse_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('birthday_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('anniversary_enabled', 'true');
INSERT OR IGNORE INTO settings (key, value) VALUES ('custom_bible_message', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('birthday_template', 'Happy Birthday, {{first_name}}! 🎂 The Galilee family is celebrating YOU today! May God continue to bless you with joy, health, and abundant grace. Have a wonderful day! — Pastor Moshiu Knox & the Galilee Family');
INSERT OR IGNORE INTO settings (key, value) VALUES ('anniversary_template', 'Happy Anniversary, {{first_name}}! 💒 What a blessing to celebrate this milestone with you. May God continue to strengthen and bless your union. — Pastor Moshiu Knox & the Galilee Family');
