import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'galilee-bible-class-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "galilee.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max upload
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'mp3', 'wav', 'ogg', 'm4a', 'html'}

    # Base URL for outbound links (reset emails, notifications)
    # Set APP_BASE_URL in env for production (e.g. https://study.galileembchurch.com)
    APP_BASE_URL = os.environ.get('APP_BASE_URL', 'http://localhost:5003')

    # SMTP settings for email
    SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USER = os.environ.get('SMTP_USER', 'moshiu@knoxmediagroupinc.org')
    SMTP_PASS = os.environ.get('SMTP_PASS', 'vace jfzn ozbo prps')
    SMTP_FROM = os.environ.get('SMTP_FROM', 'moshiu@knoxmediagroupinc.org')
    ADMIN_NOTIFY_EMAIL = os.environ.get('ADMIN_NOTIFY_EMAIL', 'moshiu@knoxmediagroupinc.org, support@eritn.com')
