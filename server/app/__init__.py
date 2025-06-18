from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
from flask_apscheduler import APScheduler
from config import Config

db = SQLAlchemy()
login_manager = LoginManager()
scheduler = APScheduler()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    login_manager.init_app(app)
    scheduler.init_app(app)
    scheduler.start()
    CORS(app, supports_credentials=True)

    # Импорт моделей (нужно до создания таблиц)
    from app.models import user, note, topic

    with app.app_context():
        db.create_all()

    # Регистрация blueprint-ов
    from app.routes import auth, notes, topics, reminders, sharing
    app.register_blueprint(auth.bp)
    app.register_blueprint(notes.bp)
    app.register_blueprint(topics.bp)
    app.register_blueprint(reminders.bp)
    app.register_blueprint(sharing.bp)

    return app
