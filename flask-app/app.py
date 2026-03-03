import os
import json
import uuid
import markdown
import re
import secrets
import smtplib
import threading
from email.message import EmailMessage
from datetime import datetime, date, timedelta
from functools import wraps

from flask import (Flask, render_template, request, redirect, url_for,
                   flash, jsonify, send_from_directory, abort)
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

from config import Config
from models import db, bcrypt, User, Lesson, LessonMedia, Question, Response

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)
    return decorated_function


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


def get_media_type(filename):
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ('png', 'jpg', 'jpeg', 'gif'):
        return 'image'
    elif ext == 'pdf':
        return 'pdf'
    elif ext in ('mp3', 'wav', 'ogg', 'm4a'):
        return 'audio'
    elif ext == 'html':
        return 'html'
    return 'other'


def render_markdown(text):
    if not text:
        return ''
    return markdown.markdown(text, extensions=['nl2br', 'fenced_code'])



def generate_username_from_email(email):
    base = (email.split('@')[0] if email else 'member').strip().lower()
    base = re.sub(r'[^a-z0-9_]+', '', base) or 'member'
    username = base
    i = 1
    while User.query.filter_by(username=username).first():
        username = f"{base}{i}"
        i += 1
    return username


def send_app_email(to, subject, body, smtp_config=None):
    """Send email using config-based SMTP settings.
    smtp_config can be passed explicitly for use in background threads
    where app context may not be available."""
    try:
        if smtp_config is None:
            smtp_config = {
                'host': app.config['SMTP_HOST'],
                'port': app.config['SMTP_PORT'],
                'user': app.config['SMTP_USER'],
                'pass': app.config['SMTP_PASS'],
                'from': app.config['SMTP_FROM'],
            }

        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = smtp_config['from']
        msg['To'] = to
        msg.set_content(body)

        with smtplib.SMTP(smtp_config['host'], smtp_config['port'], timeout=10) as s:
            s.starttls()
            s.login(smtp_config['user'], smtp_config['pass'])
            s.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email to {to}: {e}")
        return False


def get_smtp_config():
    """Capture SMTP config from app context for use in background threads."""
    return {
        'host': app.config['SMTP_HOST'],
        'port': app.config['SMTP_PORT'],
        'user': app.config['SMTP_USER'],
        'pass': app.config['SMTP_PASS'],
        'from': app.config['SMTP_FROM'],
    }


def notify_new_signup(full_name, email, phone, username, admin_email, smtp_config):
    send_app_email(
        admin_email,
        f"[Galilee Bible] New signup pending approval: {full_name}",
        f"New Galilee Bible signup request\n\n"
        f"Name: {full_name}\n"
        f"Email: {email or 'N/A'}\n"
        f"Phone: {phone or 'N/A'}\n"
        f"Username: {username}\n"
        f"Status: PENDING APPROVAL\n\n"
        f"Approve in Admin -> Members by setting status to Active.",
        smtp_config=smtp_config
    )


def notify_account_approved(email, full_name, smtp_config):
    if not email:
        return
    send_app_email(
        email,
        'Galilee Bible Class: Account Approved',
        f"Hello {full_name},\n\n"
        "Your Galilee Bible Class account has been approved. "
        "You can now sign in using your username and password.\n\n"
        "Blessings,\nGalilee Bible Class",
        smtp_config=smtp_config
    )


# ─── Auth Routes ───

@app.route('/login', methods=['GET'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template('login.html')


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    # Allow login with username or email
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User.query.filter_by(email=username.lower()).first()
    if user and user.check_password(password):
        if not user.is_active:
            return jsonify({'success': False, 'message': 'Your account is pending approval.'}), 403
        login_user(user, remember=True)
        redirect_url = url_for('admin_dashboard') if user.is_admin else url_for('lesson_current')
        return jsonify({'success': True, 'redirect': redirect_url})

    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401



@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    phone = data.get('phone_number', '').strip()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not full_name or not email or not phone or not username or not password or not confirm_password:
        return jsonify({'success': False, 'message': 'Name, email, phone, username, and password are required'}), 400

    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

    if len(password) < 8:
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

    if not re.match(r'^[A-Za-z0-9_]{3,30}$', username):
        return jsonify({'success': False, 'message': 'Username must be 3-30 characters (letters, numbers, underscore only)'}), 400

    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({'success': False, 'message': 'Email already registered. Please log in or contact admin.'}), 400

    existing_username = User.query.filter_by(username=username).first()
    if existing_username:
        return jsonify({'success': False, 'message': 'Username is already taken'}), 400

    user = User(
        username=username,
        full_name=full_name,
        email=email,
        phone_number=phone,
        role='member',
        is_active_user=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    smtp_cfg = get_smtp_config()
    admin_notify = app.config['ADMIN_NOTIFY_EMAIL']
    threading.Thread(target=notify_new_signup,
                     args=(user.full_name, user.email, user.phone_number, user.username, admin_notify, smtp_cfg),
                     daemon=True).start()

    return jsonify({'success': True, 'message': 'Registration successful! You can now log in.'})


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# ─── Password Reset Routes ───

@app.route('/forgot-password', methods=['GET'])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template('forgot_password.html')


@app.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

    email = data.get('email', '').strip().lower()
    if not email:
        return jsonify({'success': False, 'message': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        # For security, don't reveal if email exists
        return jsonify({'success': True, 'message': 'If this email exists in our system, a password reset link has been sent.'})

    # Generate reset token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    # Send email in background thread — capture all values before leaving request context
    base_url = app.config['APP_BASE_URL'].rstrip('/')
    reset_link = f"{base_url}/reset-password/{token}"
    user_email = user.email
    user_name = user.full_name
    smtp_cfg = get_smtp_config()

    def send_reset_email():
        send_app_email(
            user_email,
            "Password Reset - Galilee Bible Class",
            f"Dear {user_name},\n\n"
            f"You requested a password reset for your Galilee Bible Class account.\n\n"
            f"Click the link below to reset your password (valid for 1 hour):\n"
            f"{reset_link}\n\n"
            f"If you did not request this reset, please ignore this email.\n\n"
            f"God bless,\n"
            f"Galilee Missionary Baptist Church",
            smtp_config=smtp_cfg
        )

    threading.Thread(target=send_reset_email, daemon=True).start()

    return jsonify({'success': True, 'message': 'If this email exists in our system, a password reset link has been sent.'})


@app.route('/reset-password/<token>', methods=['GET'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    # Verify token exists and is not expired
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        flash('This password reset link is invalid or has expired.', 'error')
        return redirect(url_for('login'))
    
    return render_template('reset_password.html', token=token)


@app.route('/api/reset-password/<token>', methods=['POST'])
def api_reset_password(token):
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

    password = data.get('password', '')
    if not password or len(password) < 8:
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

    # Verify token
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return jsonify({'success': False, 'message': 'This password reset link is invalid or has expired.'}), 400

    # Update password and clear token
    user.set_password(password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({'success': True, 'message': 'Your password has been reset successfully! Redirecting to login...'})


# ─── Index ───

@app.route('/')
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    if current_user.is_admin:
        return redirect(url_for('admin_dashboard'))
    return redirect(url_for('lesson_current'))


# ─── Member Routes ───

@app.route('/lesson')
@login_required
def lesson_current():
    today = date.today()
    # Get the most recent published lesson (on or before today, or the next upcoming one)
    lesson = Lesson.query.filter_by(status='published') \
        .order_by(db.case((Lesson.lesson_date >= today, 0), else_=1), 
                  db.func.abs(db.func.julianday(Lesson.lesson_date) - db.func.julianday(today))) \
        .first()
    if lesson:
        return redirect(url_for('lesson_view', lesson_id=lesson.id))
    return render_template('no_lesson.html')


@app.route('/lesson/<int:lesson_id>')
@login_required
def lesson_view(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.status != 'published' and not current_user.is_admin:
        abort(404)

    lesson.content_html = render_markdown(lesson.content)

    # Check if user has submitted responses for this lesson
    user_responses = Response.query.filter_by(
        lesson_id=lesson_id, user_id=current_user.id
    ).all()
    has_submitted = len(user_responses) > 0

    # Get all published lessons for navigation
    all_lessons = Lesson.query.filter_by(status='published').order_by(Lesson.lesson_date.desc()).all()

    return render_template('lesson.html', lesson=lesson, has_submitted=has_submitted,
                           all_lessons=all_lessons)


@app.route('/submit/<int:lesson_id>')
@login_required
def submit_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.status != 'published' and not current_user.is_admin:
        abort(404)

    questions = Question.query.filter_by(lesson_id=lesson_id).order_by(Question.order_num).all()

    # Get existing responses
    existing = {}
    for r in Response.query.filter_by(lesson_id=lesson_id, user_id=current_user.id).all():
        existing[r.question_id] = r.answer_text

    # Parse MC options
    for q in questions:
        if q.question_type == 'multiple_choice' and q.options_json:
            q.options = json.loads(q.options_json)
        else:
            q.options = []

    can_edit = True

    return render_template('submit.html', lesson=lesson, questions=questions,
                           existing=existing, can_edit=can_edit)


@app.route('/api/submit/<int:lesson_id>', methods=['POST'])
@login_required
def api_submit(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    if lesson.status != 'published' and not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Lesson not available'}), 404

    data = request.get_json()
    if not data or 'answers' not in data:
        return jsonify({'success': False, 'message': 'No answers provided'}), 400

    answers = data['answers']  # {question_id: answer_text}

    for qid_str, answer_text in answers.items():
        qid = int(qid_str)
        question = Question.query.get(qid)
        if not question or question.lesson_id != lesson_id:
            continue

        # Auto-grade
        is_correct = None
        if question.question_type == 'multiple_choice' and question.correct_answer:
            is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()
        elif question.question_type == 'fill_blank' and question.correct_answer:
            is_correct = answer_text.strip().lower() == question.correct_answer.strip().lower()

        # Upsert response
        existing = Response.query.filter_by(question_id=qid, user_id=current_user.id).first()
        if existing:
            existing.answer_text = answer_text
            existing.is_correct = is_correct
            existing.updated_at = datetime.utcnow()
        else:
            resp = Response(
                question_id=qid,
                user_id=current_user.id,
                lesson_id=lesson_id,
                answer_text=answer_text,
                is_correct=is_correct
            )
            db.session.add(resp)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Your answers have been submitted!'})


@app.route('/my-submissions')
@login_required
def my_submissions():
    # Get lessons where user has submitted responses
    lesson_ids = db.session.query(Response.lesson_id).filter_by(
        user_id=current_user.id
    ).distinct().all()
    lesson_ids = [lid[0] for lid in lesson_ids]

    lessons = Lesson.query.filter(Lesson.id.in_(lesson_ids)).order_by(Lesson.lesson_date.desc()).all()

    # Get all published lessons to show completion status
    all_published = Lesson.query.filter_by(status='published').order_by(Lesson.lesson_date.desc()).all()

    submitted_ids = set(lesson_ids)

    return render_template('my_submissions.html', lessons=lessons,
                           all_published=all_published, submitted_ids=submitted_ids)


@app.route('/my-submissions/<int:lesson_id>')
@login_required
def my_submission_detail(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    questions = Question.query.filter_by(lesson_id=lesson_id).order_by(Question.order_num).all()

    responses = {}
    for r in Response.query.filter_by(lesson_id=lesson_id, user_id=current_user.id).all():
        responses[r.question_id] = r

    for q in questions:
        if q.question_type == 'multiple_choice' and q.options_json:
            q.options = json.loads(q.options_json)
        else:
            q.options = []

    return render_template('my_submission_detail.html', lesson=lesson,
                           questions=questions, responses=responses)


# ─── Admin Routes ───

@app.route('/admin')
@admin_required
def admin_dashboard():
    total_members = User.query.filter_by(role='member', is_active_user=True).count()
    total_lessons = Lesson.query.count()
    published_lessons = Lesson.query.filter_by(status='published').count()

    # This week's submissions
    today = date.today()
    from datetime import timedelta
    week_start = today - timedelta(days=today.weekday())

    # Get current/upcoming lesson
    current_lesson = Lesson.query.filter_by(status='published') \
        .filter(Lesson.lesson_date >= today) \
        .order_by(Lesson.lesson_date.asc()).first()

    submissions_this_week = 0
    participation_rate = 0
    if current_lesson:
        submitters = db.session.query(Response.user_id).filter_by(
            lesson_id=current_lesson.id
        ).distinct().count()
        submissions_this_week = submitters
        if total_members > 0:
            participation_rate = round((submitters / total_members) * 100)

    recent_lessons = Lesson.query.order_by(Lesson.lesson_date.desc()).limit(5).all()

    # Upcoming birthdays and anniversaries (next 30 days)
    upcoming_birthdays = []
    upcoming_anniversaries = []
    all_active_members = User.query.filter_by(is_active_user=True).all()
    for m in all_active_members:
        if m.birthday:
            this_year_bday = m.birthday.replace(year=today.year)
            if this_year_bday < today:
                this_year_bday = m.birthday.replace(year=today.year + 1)
            days_until = (this_year_bday - today).days
            if days_until <= 30:
                upcoming_birthdays.append({
                    'name': m.full_name,
                    'date': this_year_bday,
                    'days_until': days_until
                })
        if m.anniversary:
            this_year_anniv = m.anniversary.replace(year=today.year)
            if this_year_anniv < today:
                this_year_anniv = m.anniversary.replace(year=today.year + 1)
            days_until = (this_year_anniv - today).days
            years = today.year - m.anniversary.year
            if this_year_anniv.year > today.year:
                years += 1
            if days_until <= 30:
                upcoming_anniversaries.append({
                    'name': m.full_name,
                    'date': this_year_anniv,
                    'days_until': days_until,
                    'years': years
                })

    upcoming_birthdays.sort(key=lambda x: x['days_until'])
    upcoming_anniversaries.sort(key=lambda x: x['days_until'])

    return render_template('admin/dashboard.html',
                           total_members=total_members,
                           total_lessons=total_lessons,
                           published_lessons=published_lessons,
                           submissions_this_week=submissions_this_week,
                           participation_rate=participation_rate,
                           current_lesson=current_lesson,
                           recent_lessons=recent_lessons,
                           upcoming_birthdays=upcoming_birthdays,
                           upcoming_anniversaries=upcoming_anniversaries)


@app.route('/admin/lessons')
@admin_required
def admin_lessons():
    lessons = Lesson.query.order_by(Lesson.lesson_date.desc()).all()
    return render_template('admin/lessons.html', lessons=lessons)


@app.route('/admin/lessons/new')
@admin_required
def admin_lesson_new():
    return render_template('admin/lesson_form.html', lesson=None)


@app.route('/admin/lessons/<int:lesson_id>/edit')
@admin_required
def admin_lesson_edit(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    return render_template('admin/lesson_form.html', lesson=lesson)


@app.route('/api/admin/lessons', methods=['POST'])
@admin_required
def api_create_lesson():
    data = request.form if request.form else request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    # Handle both form data and JSON
    if hasattr(data, 'get'):
        title = data.get('title', '').strip()
        lesson_date_str = data.get('lesson_date', '')
        description = data.get('description', '').strip()
        scripture = data.get('scripture_reference', '').strip()
        content = data.get('content', '').strip()
        status = data.get('status', 'draft')
    else:
        return jsonify({'success': False, 'message': 'Invalid data format'}), 400

    if not title or not lesson_date_str:
        return jsonify({'success': False, 'message': 'Title and date are required'}), 400

    try:
        lesson_date = datetime.strptime(lesson_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'success': False, 'message': 'Invalid date format'}), 400

    lesson = Lesson(
        title=title,
        lesson_date=lesson_date,
        description=description,
        scripture_reference=scripture,
        content=content,
        status=status,
        created_by=current_user.id
    )
    db.session.add(lesson)
    db.session.commit()

    # Handle file uploads
    if request.files:
        files = request.files.getlist('media')
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                media = LessonMedia(
                    lesson_id=lesson.id,
                    filename=file.filename,
                    file_path=filename,
                    media_type=get_media_type(file.filename)
                )
                db.session.add(media)
        db.session.commit()

    return jsonify({'success': True, 'message': 'Lesson created!', 'lesson_id': lesson.id})


@app.route('/api/admin/lessons/<int:lesson_id>', methods=['PUT'])
@admin_required
def api_update_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)

    data = request.form if request.form else request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400

    lesson.title = data.get('title', lesson.title).strip()
    lesson_date_str = data.get('lesson_date', '')
    if lesson_date_str:
        try:
            lesson.lesson_date = datetime.strptime(lesson_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    lesson.description = data.get('description', lesson.description)
    lesson.scripture_reference = data.get('scripture_reference', lesson.scripture_reference)
    lesson.content = data.get('content', lesson.content)
    lesson.status = data.get('status', lesson.status)
    lesson.updated_at = datetime.utcnow()

    # Handle file uploads
    if request.files:
        files = request.files.getlist('media')
        for file in files:
            if file and file.filename and allowed_file(file.filename):
                ext = file.filename.rsplit('.', 1)[1].lower()
                filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                media = LessonMedia(
                    lesson_id=lesson.id,
                    filename=file.filename,
                    file_path=filename,
                    media_type=get_media_type(file.filename)
                )
                db.session.add(media)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Lesson updated!'})


@app.route('/api/admin/lessons/<int:lesson_id>', methods=['DELETE'])
@admin_required
def api_delete_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    # Delete media files
    for media in lesson.media:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], media.file_path)
        if os.path.exists(filepath):
            os.remove(filepath)
    db.session.delete(lesson)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Lesson deleted!'})


@app.route('/api/admin/lessons/<int:lesson_id>/publish', methods=['POST'])
@admin_required
def api_publish_lesson(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    lesson.status = 'published'
    db.session.commit()
    return jsonify({'success': True, 'message': 'Lesson published!'})


@app.route('/api/admin/media/<int:media_id>', methods=['DELETE'])
@admin_required
def api_delete_media(media_id):
    media = LessonMedia.query.get_or_404(media_id)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], media.file_path)
    if os.path.exists(filepath):
        os.remove(filepath)
    db.session.delete(media)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Media deleted!'})


# ─── Questions Management ───

@app.route('/admin/lessons/<int:lesson_id>/questions')
@admin_required
def admin_questions(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    questions = Question.query.filter_by(lesson_id=lesson_id).order_by(Question.order_num).all()
    for q in questions:
        if q.question_type == 'multiple_choice' and q.options_json:
            q.options = json.loads(q.options_json)
        else:
            q.options = []
    return render_template('admin/questions.html', lesson=lesson, questions=questions)


@app.route('/api/admin/questions', methods=['POST'])
@admin_required
def api_create_question():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data'}), 400

    lesson_id = data.get('lesson_id')
    question_text = data.get('question_text', '').strip()
    question_type = data.get('question_type', 'essay')
    options = data.get('options', [])
    correct_answer = data.get('correct_answer', '').strip()

    if not lesson_id or not question_text:
        return jsonify({'success': False, 'message': 'Lesson ID and question text required'}), 400

    # Get next order number
    max_order = db.session.query(db.func.max(Question.order_num)).filter_by(
        lesson_id=lesson_id).scalar() or 0

    q = Question(
        lesson_id=lesson_id,
        question_text=question_text,
        question_type=question_type,
        order_num=max_order + 1,
        options_json=json.dumps(options) if options else None,
        correct_answer=correct_answer if correct_answer else None
    )
    db.session.add(q)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Question added!', 'question_id': q.id})


@app.route('/api/admin/questions/<int:question_id>', methods=['PUT'])
@admin_required
def api_update_question(question_id):
    q = Question.query.get_or_404(question_id)
    data = request.get_json()

    q.question_text = data.get('question_text', q.question_text).strip()
    q.question_type = data.get('question_type', q.question_type)
    options = data.get('options')
    if options is not None:
        q.options_json = json.dumps(options) if options else None
    correct = data.get('correct_answer')
    if correct is not None:
        q.correct_answer = correct.strip() if correct else None

    db.session.commit()
    return jsonify({'success': True, 'message': 'Question updated!'})


@app.route('/api/admin/questions/<int:question_id>', methods=['DELETE'])
@admin_required
def api_delete_question(question_id):
    q = Question.query.get_or_404(question_id)
    db.session.delete(q)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Question deleted!'})


# ─── Submissions Review (Admin) ───

@app.route('/admin/lessons/<int:lesson_id>/submissions')
@admin_required
def admin_submissions(lesson_id):
    lesson = Lesson.query.get_or_404(lesson_id)
    questions = Question.query.filter_by(lesson_id=lesson_id).order_by(Question.order_num).all()

    # Get all members
    members = User.query.filter_by(role='member', is_active_user=True).order_by(User.full_name).all()

    # Get all responses for this lesson
    all_responses = Response.query.filter_by(lesson_id=lesson_id).all()

    # Organize: {user_id: {question_id: response}}
    response_map = {}
    for r in all_responses:
        if r.user_id not in response_map:
            response_map[r.user_id] = {}
        response_map[r.user_id][r.question_id] = r

    # Parse options for display
    for q in questions:
        if q.question_type == 'multiple_choice' and q.options_json:
            q.options = json.loads(q.options_json)
        else:
            q.options = []

    submitter_ids = set(response_map.keys())

    return render_template('admin/submissions.html', lesson=lesson, questions=questions,
                           members=members, response_map=response_map,
                           submitter_ids=submitter_ids)


# ─── Member Management ───

@app.route('/admin/members')
@admin_required
def admin_members():
    members = User.query.order_by(User.role, User.full_name).all()
    return render_template('admin/members.html', members=members)


@app.route('/api/admin/members', methods=['POST'])
@admin_required
def api_create_member():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data'}), 400

    username = data.get('username', '').strip()
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip() or None
    phone_number = data.get('phone_number', '').strip() or None
    password = data.get('password', '')
    role = data.get('role', 'member')

    birthday_str = data.get('birthday', '').strip() if data.get('birthday') else None
    anniversary_str = data.get('anniversary', '').strip() if data.get('anniversary') else None

    if not username or not full_name or not password:
        return jsonify({'success': False, 'message': 'Username, full name, and password required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already exists'}), 400

    user = User(
        username=username,
        full_name=full_name,
        email=email,
        phone_number=phone_number,
        role=role
    )
    user.set_password(password)

    if birthday_str:
        try:
            user.birthday = datetime.strptime(birthday_str, '%Y-%m-%d').date()
        except ValueError:
            pass
    if anniversary_str:
        try:
            user.anniversary = datetime.strptime(anniversary_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Member {full_name} added!'})


@app.route('/api/admin/members/<int:user_id>', methods=['PUT'])
@admin_required
def api_update_member(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    was_inactive = not user.is_active_user

    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'email' in data:
        user.email = data['email'].strip() or None
    if 'phone_number' in data:
        user.phone_number = data['phone_number'].strip() or None
    if 'birthday' in data:
        if data['birthday']:
            try:
                user.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        else:
            user.birthday = None
    if 'anniversary' in data:
        if data['anniversary']:
            try:
                user.anniversary = datetime.strptime(data['anniversary'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        else:
            user.anniversary = None
    if 'is_active' in data:
        user.is_active_user = data['is_active']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    if 'role' in data:
        user.role = data['role']

    became_active = was_inactive and user.is_active_user

    db.session.commit()

    if became_active:
        smtp_cfg = get_smtp_config()
        threading.Thread(target=notify_account_approved,
                         args=(user.email, user.full_name, smtp_cfg),
                         daemon=True).start()

    return jsonify({'success': True, 'message': 'Member updated!'})


@app.route('/api/admin/members/<int:user_id>', methods=['DELETE'])
@admin_required
def api_delete_member(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        return jsonify({'success': False, 'message': 'Cannot delete yourself'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Member deleted!'})


# ─── Participation ───

@app.route('/admin/participation')
@admin_required
def admin_participation():
    lessons = Lesson.query.filter_by(status='published').order_by(Lesson.lesson_date.desc()).all()
    members = User.query.filter_by(role='member', is_active_user=True).order_by(User.full_name).all()

    # Build participation matrix
    participation = {}
    for lesson in lessons:
        submitter_ids = set(
            r[0] for r in db.session.query(Response.user_id)
            .filter_by(lesson_id=lesson.id).distinct().all()
        )
        participation[lesson.id] = submitter_ids

    return render_template('admin/participation.html', lessons=lessons,
                           members=members, participation=participation)


# ─── Static/Uploads ───

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ─── PWA Manifest ───

@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')


# ─── Initialize DB ───

def init_db():
    with app.app_context():
        db.create_all()

        # Auto-migrate: add birthday and anniversary columns if missing
        from sqlalchemy import inspect, text
        inspector = inspect(db.engine)
        existing_cols = [c['name'] for c in inspector.get_columns('users')]
        with db.engine.connect() as conn:
            if 'birthday' not in existing_cols:
                conn.execute(text('ALTER TABLE users ADD COLUMN birthday DATE'))
                conn.commit()
                print("Added 'birthday' column to users table.")
            if 'anniversary' not in existing_cols:
                conn.execute(text('ALTER TABLE users ADD COLUMN anniversary DATE'))
                conn.commit()
                print("Added 'anniversary' column to users table.")

        # Create admin user if not exists
        if not User.query.filter_by(username='pastor').first():
            admin = User(
                username='pastor',
                full_name='Pastor Admin',
                email='pastor@galileembchurch.com',
                role='admin'
            )
            admin.set_password('galilee2026!')
            db.session.add(admin)
            db.session.commit()
            print("Admin user 'pastor' created.")


def seed_data():
    with app.app_context():
        # Create sample member
        if not User.query.filter_by(username='member1').first():
            member = User(
                username='member1',
                full_name='John Smith',
                email='member1@example.com',
                role='member'
            )
            member.set_password('galilee2026!')
            db.session.add(member)
            db.session.commit()
            print("Member 'member1' created.")

        # Create sample lesson
        if not Lesson.query.first():
            admin = User.query.filter_by(username='pastor').first()
            lesson = Lesson(
                title='The Power of Faith',
                lesson_date=date(2026, 2, 8),
                description='Exploring how faith moves mountains and transforms lives.',
                scripture_reference='Hebrews 11:1-6; Matthew 17:20',
                content="""## Introduction

Faith is the foundation of our walk with God. In today's lesson, we will explore what the Bible teaches us about the **power of faith** and how it applies to our daily lives.

## Scripture Reading

> "Now faith is the substance of things hoped for, the evidence of things not seen." — Hebrews 11:1 (KJV)

## Key Points

1. **Faith is substance** — It is not just a feeling, but something real and tangible in the spiritual realm.

2. **Faith pleases God** — "But without faith it is impossible to please him" (Hebrews 11:6).

3. **Faith as small as a mustard seed** — Jesus told His disciples that even the smallest genuine faith can move mountains (Matthew 17:20).

## Application

- How can we exercise our faith daily?
- What are the "mountains" in your life that need to be moved?
- How does faith differ from mere hope or wishing?

## Conclusion

Let us remember that faith is not about the size of our belief, but the size of our God. As we study these scriptures this week, let us ask God to increase our faith and help us trust Him more fully in every area of our lives.

*"Lord, I believe; help thou mine unbelief." — Mark 9:24*""",
                status='published',
                created_by=admin.id
            )
            db.session.add(lesson)
            db.session.commit()

            # Add sample questions
            q1 = Question(
                lesson_id=lesson.id,
                question_text='According to Hebrews 11:1, faith is the _______ of things hoped for.',
                question_type='fill_blank',
                order_num=1,
                correct_answer='substance'
            )

            q2 = Question(
                lesson_id=lesson.id,
                question_text='In Matthew 17:20, Jesus compares faith to what?',
                question_type='multiple_choice',
                order_num=2,
                options_json=json.dumps([
                    'A grain of wheat',
                    'A mustard seed',
                    'A pearl',
                    'A fig tree'
                ]),
                correct_answer='A mustard seed'
            )

            q3 = Question(
                lesson_id=lesson.id,
                question_text='How can you apply the lesson of faith to a current challenge in your life? Share your thoughts.',
                question_type='essay',
                order_num=3
            )

            db.session.add_all([q1, q2, q3])
            db.session.commit()
            print("Sample lesson and questions created.")


@app.route('/sw.js')
def service_worker():
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')


# Always run init_db on import (gunicorn loads app module, doesn't call __main__)
init_db()

if __name__ == '__main__':
    seed_data()
    app.run(host='0.0.0.0', port=5003, debug=True)
