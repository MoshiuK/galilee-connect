from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone_number = db.Column(db.String(30), nullable=True)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='member')  # admin or member
    is_active_user = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Personal dates
    birthday = db.Column(db.Date, nullable=True)
    anniversary = db.Column(db.Date, nullable=True)

    # Password reset fields
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    responses = db.relationship('Response', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == 'admin'

    @property
    def is_active(self):
        return self.is_active_user


class Lesson(db.Model):
    __tablename__ = 'lessons'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    lesson_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text, nullable=True)
    scripture_reference = db.Column(db.String(300), nullable=True)
    content = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='draft')  # draft or published
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    media = db.relationship('LessonMedia', backref='lesson', lazy=True, cascade='all, delete-orphan')
    questions = db.relationship('Question', backref='lesson', lazy=True, cascade='all, delete-orphan',
                                order_by='Question.order_num')
    responses = db.relationship('Response', backref='lesson', lazy=True, cascade='all, delete-orphan')

    creator = db.relationship('User', backref='lessons_created')


class LessonMedia(db.Model):
    __tablename__ = 'lesson_media'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)  # image, pdf, audio
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)


class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(30), nullable=False)  # multiple_choice, fill_blank, essay
    order_num = db.Column(db.Integer, default=0)
    options_json = db.Column(db.Text, nullable=True)  # JSON array for MC options
    correct_answer = db.Column(db.String(500), nullable=True)  # For MC and fill_blank

    responses = db.relationship('Response', backref='question', lazy=True, cascade='all, delete-orphan')


class Response(db.Model):
    __tablename__ = 'responses'
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=True)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('question_id', 'user_id', name='uq_question_user'),
    )
