import os
from flask import Flask, render_template, request, redirect, url_for, flash, abort, send_from_directory # Added send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import or_, and_
from flask_migrate import Migrate
import atexit
from flask_cors import CORS # Import CORS

# Инициализация приложения
app = Flask(__name__)
# CORS Configuration: Update origins if your React app runs on a different port or domain
CORS(app, resources={r"/*": {"origins": ["http://localhost:3002", "http://127.0.0.1:3002"]}}, supports_credentials=True)

app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///notes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Создаем директорию для загрузок, если она не существует
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Инициализация расширений
db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
login_manager.login_view = 'login' # This is for server-side redirects, less relevant for SPA API calls
login_manager.session_protection = "strong"

# Модели данных
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    notes = db.relationship('Note', backref='author', lazy=True)
    schedules = db.relationship('Schedule', backref='user', lazy=True)
    shared_notes = db.relationship('NoteShare', foreign_keys='NoteShare.user_id', backref='recipient', lazy=True)
    topics = db.relationship('Topic', backref='user', lazy=True)

class Topic(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    notes = db.relationship('Note', backref='topic', lazy=True)

class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic_id = db.Column(db.Integer, db.ForeignKey('topic.id'))
    shares = db.relationship('NoteShare', backref='note', lazy=True, cascade="all, delete-orphan")
    images = db.relationship('NoteImage', backref='note', lazy=True, cascade="all, delete-orphan")

class NoteImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100), nullable=False)
    note_id = db.Column(db.Integer, db.ForeignKey('note.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order = db.Column(db.Integer, default=0) 

class NoteShare(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    note_id = db.Column(db.Integer, db.ForeignKey('note.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    can_edit = db.Column(db.Boolean, default=False)
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)

class Schedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    frequency = db.Column(db.String(20), nullable=False)  # daily/weekly/monthly
    time_of_day = db.Column(db.Time, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Reminder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    note = db.Column(db.Text)
    remind_time = db.Column(db.DateTime, nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Инициализация планировщика
scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# Функции помощники
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def save_uploaded_files(files):
    """Сохраняет несколько файлов и возвращает список имен файлов"""
    saved_files = []
    for file in files:
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Добавляем timestamp для уникальности
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            saved_files.append(filename)
    return saved_files

def delete_note_images(note_id):
    """Удаляет все изображения заметки"""
    note_images = NoteImage.query.filter_by(note_id=note_id).all()
    for note_image in note_images:
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], note_image.filename))
        except OSError:
            pass
    NoteImage.query.filter_by(note_id=note_id).delete()
    db.session.commit()
    
def create_schedule_reminders(schedule):
    current_date = schedule.start_date
    end_date = schedule.end_date or (datetime.now().date() + timedelta(days=365))
    
    while current_date <= end_date:
        remind_time = datetime.combine(current_date, schedule.time_of_day)
        if remind_time > datetime.now():
            reminder = Reminder(
                title=f"{schedule.title} (по расписанию)",
                note=schedule.description,
                remind_time=remind_time,
                user_id=schedule.user_id
            )
            db.session.add(reminder)
            # Removed scheduler.add_job here, as it might cause issues if app context is not available
            # Consider a different mechanism for job scheduling or ensure context.
        
        if schedule.frequency == 'daily':
            current_date += timedelta(days=1)
        elif schedule.frequency == 'weekly':
            current_date += timedelta(weeks=1)
        elif schedule.frequency == 'monthly':
            # A more accurate way to add a month
            month = current_date.month - 1 + 1
            year = current_date.year + month // 12
            month = month % 12 + 1
            day = min(current_date.day, [31,
                                          29 if year % 4 == 0 and not year % 100 == 0 or year % 400 == 0 else 28,
                                          31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
            current_date = current_date.replace(day=day, month=month, year=year)

    db.session.commit()

def send_reminder(reminder_id):
    with app.app_context():
        reminder = Reminder.query.get(reminder_id)
        if reminder and not reminder.is_completed:
            print(f"Напоминание: {reminder.title}") # In a real app, this would be an email/notification
            reminder.is_completed = True
            db.session.commit()

# Аутентификация
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Add a route to check authentication status
@app.route('/api/auth/status', methods=['GET'])
@login_required
def auth_status():
    return {"isLoggedIn": True, "user": {"id": current_user.id, "username": current_user.username}}, 200

@app.route('/api/auth/login', methods=['POST'])
def login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or not check_password_hash(user.password, password):
        return {'message': 'Неверное имя пользователя или пароль'}, 401
    
    login_user(user, remember=True) # remember=True is important for SPAs
    return {'message': 'Вход выполнен успешно', 'user': {'id': user.id, 'username': user.username}}, 200

@app.route('/api/auth/signup', methods=['POST'])
def signup_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if User.query.filter_by(username=username).first():
        return {'message': 'Пользователь с таким именем уже существует'}, 409
    
    new_user = User(
        username=username,
        password=generate_password_hash(password)
    )
    db.session.add(new_user)
    db.session.commit()
    login_user(new_user, remember=True)
    return {'message': 'Регистрация прошла успешно', 'user': {'id': new_user.id, 'username': new_user.username}}, 201

@app.route('/api/auth/logout', methods=['POST']) # Changed to POST for SPA best practices
@login_required
def logout_api():
    logout_user()
    return {'message': 'Выход выполнен успешно'}, 200

# Заметки API
@app.route('/api/notes', methods=['GET'])
@login_required
def get_notes_api():
    notes_query = Note.query.filter(
        or_(
            Note.user_id == current_user.id,
            Note.shares.any(user_id=current_user.id)
        )
    ).order_by(Note.created_at.desc())
    
    notes_data = []
    for note in notes_query.all():
        # Получаем первое изображение для превью
        first_image = NoteImage.query.filter_by(note_id=note.id).order_by(NoteImage.order).first()
        image_url = None
        if first_image:
            image_url = url_for('static', filename=f'uploads/{first_image.filename}', _external=True)
        
        notes_data.append({
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'first_image': image_url,
            'image_count': len(note.images),
            'created_at': note.created_at.isoformat(),
            'user_id': note.user_id,
            'topic_id': note.topic_id,
            'author_username': note.author.username,
            'topic_name': note.topic.name if note.topic else None,
            'is_owner': note.user_id == current_user.id,
            'can_edit_shared': any(s.can_edit for s in note.shares if s.user_id == current_user.id)
        })
    return {'notes': notes_data}, 200

@app.route('/api/notes', methods=['POST'])
@login_required
def add_note_api():
    title = request.form.get('title')
    content = request.form.get('content')
    topic_id = request.form.get('topic_id')
    
    # Получаем все файлы с ключом 'images[]'
    files = request.files.getlist('images[]')
    
    if not title or not content:
        return {'message': 'Заполните обязательные поля'}, 400
    
    # Создаем заметку
    note = Note(
        title=title,
        content=content,
        user_id=current_user.id,
        topic_id=topic_id if topic_id and topic_id != "null" and topic_id != "" else None
    )
    db.session.add(note)
    db.session.commit()  # Коммитим, чтобы получить note.id
    
    # Сохраняем изображения
    saved_filenames = save_uploaded_files(files)
    for i, filename in enumerate(saved_filenames):
        note_image = NoteImage(
            filename=filename,
            note_id=note.id,
            order=i
        )
        db.session.add(note_image)
    
    db.session.commit()
    
    return {
        'message': 'Заметка успешно создана!', 
        'note_id': note.id,
        'image_count': len(saved_filenames)
    }, 201
    
@app.route('/api/notes/<int:id>', methods=['GET'])
@login_required
def view_note_api(id):
    note = Note.query.get_or_404(id)
    is_owner = note.user_id == current_user.id
    share_info = NoteShare.query.filter_by(note_id=id, user_id=current_user.id).first()

    if not is_owner and not share_info:
        abort(403)
    
    # Получаем все изображения заметки
    note_images = NoteImage.query.filter_by(note_id=id).order_by(NoteImage.order).all()
    images_data = [
        {
            'id': img.id,
            'filename': img.filename,
            'url': url_for('static', filename=f'uploads/{img.filename}', _external=True),
            'created_at': img.created_at.isoformat(),
            'order': img.order
        }
        for img in note_images
    ]
    
    shares_data = []
    for share in note.shares:
        shares_data.append({
            'id': share.id,
            'user_id': share.user_id,
            'username': share.recipient.username,
            'can_edit': share.can_edit
        })

    return {
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'images': images_data,
        'created_at': note.created_at.isoformat(),
        'user_id': note.user_id,
        'author_username': note.author.username,
        'topic_id': note.topic_id,
        'topic_name': note.topic.name if note.topic else None,
        'shares': shares_data,
        'is_owner': is_owner,
        'can_edit_shared': share_info.can_edit if share_info else False
    }, 200
    
@app.route('/api/notes/<int:id>', methods=['PUT'])
@login_required
def edit_note_api(id):
    note = Note.query.get_or_404(id)
    is_owner = note.user_id == current_user.id
    can_edit_shared = NoteShare.query.filter_by(note_id=id, user_id=current_user.id, can_edit=True).first()

    if not is_owner and not can_edit_shared:
        abort(403)
    
    note.title = request.form.get('title', note.title)
    note.content = request.form.get('content', note.content)
    topic_id = request.form.get('topic_id')
    note.topic_id = topic_id if topic_id and topic_id != "null" and topic_id != "" else None
    
    # Получаем новые изображения
    new_files = request.files.getlist('new_images[]')
    
    if new_files and any(f.filename != '' for f in new_files):
        saved_filenames = save_uploaded_files(new_files)
        for i, filename in enumerate(saved_filenames):
            note_image = NoteImage(
                filename=filename,
                note_id=note.id,
                order=len(note.images) + i  # добавляем в конец
            )
            db.session.add(note_image)
    
    # Обработка удаления изображений
    images_to_delete = request.form.getlist('delete_images[]')
    if images_to_delete:
        for image_id in images_to_delete:
            note_image = NoteImage.query.get(image_id)
            if note_image and note_image.note_id == note.id:
                try:
                    os.remove(os.path.join(app.config['UPLOAD_FOLDER'], note_image.filename))
                except OSError:
                    pass
                db.session.delete(note_image)
    
    # Обновление порядка изображений
    order_data = request.form.get('images_order')
    if order_data:
        try:
            order_list = json.loads(order_data)
            for img_data in order_list:
                note_image = NoteImage.query.get(img_data['id'])
                if note_image and note_image.note_id == note.id:
                    note_image.order = img_data['order']
        except:
            pass
    
    db.session.commit()
    return {'message': 'Заметка успешно обновлена!'}, 200

@app.route('/api/notes/<int:id>', methods=['DELETE'])
@login_required
def delete_note_api(id):
    note = Note.query.get_or_404(id)
    
    if note.user_id != current_user.id:
        abort(403)
    
    # Удаляем все изображения
    delete_note_images(id)
            
    db.session.delete(note)
    db.session.commit()
    return {'message': 'Заметка успешно удалена!'}, 200

@app.route('/api/notes/<int:note_id>/images/<int:image_id>', methods=['DELETE'])
@login_required
def delete_note_image_api(note_id, image_id):
    note = Note.query.get_or_404(note_id)
    is_owner = note.user_id == current_user.id
    can_edit_shared = NoteShare.query.filter_by(note_id=note_id, user_id=current_user.id, can_edit=True).first()

    if not is_owner and not can_edit_shared:
        abort(403)
    
    note_image = NoteImage.query.get_or_404(image_id)
    
    if note_image.note_id != note_id:
        abort(400)
    
    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], note_image.filename))
    except OSError:
        pass
    
    db.session.delete(note_image)
    db.session.commit()
    
    return {'message': 'Изображение удалено'}, 200
    
# Темы API
@app.route('/api/topics', methods=['GET'])
@login_required
def list_topics_api():
    topics = Topic.query.filter_by(user_id=current_user.id).all()
    topics_data = [{'id': topic.id, 'name': topic.name} for topic in topics]
    return {'topics': topics_data}, 200

@app.route('/api/topics', methods=['POST'])
@login_required
def add_topic_api():
    data = request.get_json()
    name = data.get('name')
    if not name:
        return {'message': 'Название темы не может быть пустым'}, 400
    if Topic.query.filter_by(name=name, user_id=current_user.id).first():
        return {'message': 'Тема с таким названием уже существует'}, 409
    
    topic = Topic(name=name, user_id=current_user.id)
    db.session.add(topic)
    db.session.commit()
    return {'message': 'Тема успешно создана', 'topic': {'id': topic.id, 'name': topic.name}}, 201

@app.route('/api/topics/<int:topic_id>', methods=['GET'])
@login_required
def view_topic_api(topic_id):
    topic = Topic.query.get_or_404(topic_id)
    if topic.user_id != current_user.id:
        abort(403)
    
    notes_query = Note.query.filter_by(topic_id=topic_id, user_id=current_user.id) # Or also shared notes within this topic
    notes_data = []
    for note in notes_query.all():
        notes_data.append({
            'id': note.id,
            'title': note.title,
            'content_preview': note.content[:100] + ('...' if len(note.content) > 100 else ''),
            'created_at': note.created_at.isoformat()
        })
    return {'topic': {'id': topic.id, 'name': topic.name}, 'notes': notes_data}, 200

@app.route('/api/topics/<int:topic_id>', methods=['DELETE'])
@login_required
def delete_topic_api(topic_id):
    topic = Topic.query.get_or_404(topic_id)
    if topic.user_id != current_user.id:
        abort(403)
    
    # Notes associated with this topic will have their topic_id set to null or be deleted
    # Current implementation deletes notes within the topic
    for note in topic.notes:
        if note.image:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], note.image))
            except OSError:
                pass
        db.session.delete(note) # Or set note.topic_id = None if you want to keep notes
    
    db.session.delete(topic)
    db.session.commit()
    return {'message': 'Тема и все связанные заметки удалены'}, 200

# Совместный доступ API
@app.route('/api/notes/<int:note_id>/share', methods=['POST'])
@login_required
def share_note_api(note_id):
    note = Note.query.get_or_404(note_id)
    if note.user_id != current_user.id:
        abort(403)
    
    data = request.get_json()
    username = data.get('username')
    can_edit = data.get('can_edit', False)
    
    user_to_share_with = User.query.filter_by(username=username).first()
    if not user_to_share_with:
        return {'message': 'Пользователь не найден'}, 404
    if user_to_share_with.id == current_user.id:
        return {'message': 'Нельзя поделиться с самим собой'}, 400
    
    existing_share = NoteShare.query.filter_by(note_id=note_id, user_id=user_to_share_with.id).first()
    if existing_share:
        return {'message': 'Вы уже поделились этой заметкой с данным пользователем'}, 409
        
    share = NoteShare(note_id=note_id, user_id=user_to_share_with.id, can_edit=can_edit)
    db.session.add(share)
    db.session.commit()
    return {'message': f'Заметка успешно расшарена с {username}', 
            'share': {'id': share.id, 'username': user_to_share_with.username, 'can_edit': share.can_edit}}, 201

@app.route('/api/shares/<int:share_id>', methods=['DELETE'])
@login_required
def revoke_share_api(share_id):
    share = NoteShare.query.get_or_404(share_id)
    if share.note.user_id != current_user.id: # Only the note owner can revoke
        abort(403)
    
    db.session.delete(share)
    db.session.commit()
    return {'message': 'Доступ к заметке отозван'}, 200

@app.route('/api/shared_notes', methods=['GET'])
@login_required
def shared_notes_api():
    shared_notes_query = Note.query.join(NoteShare).filter(NoteShare.user_id == current_user.id)

    shared_notes_data = []
    for note in shared_notes_query.all():
        shared_notes_data.append({
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'image': note.image,
            'created_at': note.created_at.isoformat(),
            'user_id': note.user_id,
            'author_username': note.author.username,
            'topic_id': note.topic_id,
            'topic_name': note.topic.name if note.topic else None,
            'can_edit': any(s.can_edit for s in note.shares if s.user_id == current_user.id)
        })
    return {'shared_notes': shared_notes_data}, 200


# Расписания API
@app.route('/api/schedules', methods=['GET'])
@login_required
def schedules_api():
    schedules_q = Schedule.query.filter_by(user_id=current_user.id).all()
    schedules_data = []
    for s in schedules_q:
        schedules_data.append({
            'id': s.id,
            'title': s.title,
            'description': s.description,
            'frequency': s.frequency,
            'time_of_day': s.time_of_day.strftime('%H:%M'),
            'start_date': s.start_date.strftime('%Y-%m-%d'),
            'end_date': s.end_date.strftime('%Y-%m-%d') if s.end_date else None
        })
    return {'schedules': schedules_data}, 200

@app.route('/api/schedules', methods=['POST'])
@login_required
def add_schedule_api():
    data = request.get_json()
    try:
        time_of_day = datetime.strptime(data['time_of_day'], '%H:%M').time()
        start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
        end_date_str = data.get('end_date')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else None

        schedule = Schedule(
            title=data['title'],
            description=data.get('description', ''),
            frequency=data['frequency'],
            time_of_day=time_of_day,
            start_date=start_date,
            end_date=end_date,
            user_id=current_user.id
        )
        db.session.add(schedule)
        db.session.commit()
        create_schedule_reminders(schedule) # This might need to be an async task
        return {'message': 'Расписание успешно создано!', 'schedule_id': schedule.id}, 201
    except Exception as e:
        app.logger.error(f"Error adding schedule: {e}")
        return {'message': f'Ошибка при создании расписания: {str(e)}'}, 400

@app.route('/api/schedules/<int:id>', methods=['DELETE'])
@login_required
def delete_schedule_api(id):
    schedule = Schedule.query.get_or_404(id)
    if schedule.user_id != current_user.id:
        abort(403)
    
    # Delete associated reminders - more robustly
    Reminder.query.filter(
        Reminder.user_id == current_user.id,
        Reminder.title.like(f"{schedule.title}%") # This might be too broad; consider a direct link if possible
    ).delete(synchronize_session=False)
    
    db.session.delete(schedule)
    db.session.commit()
    return {'message': 'Расписание и связанные напоминания удалены'}, 200


# Инициализация приложения
def initialize_app():
    with app.app_context():
        db.create_all()
        
        if not User.query.first():
            test_user = User(
                username='test',
                password=generate_password_hash('test123')
            )
            db.session.add(test_user)
            db.session.commit()

if __name__ == '__main__':
    initialize_app()
    app.run(debug=True, threaded=True, port=5001)
