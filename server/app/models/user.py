from flask_login import UserMixin
from datetime import datetime
from app import db

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    notes = db.relationship('Note', backref='author', lazy=True)
    schedules = db.relationship('Schedule', backref='user', lazy=True)
    shared_notes = db.relationship('NoteShare', foreign_keys='NoteShare.user_id', backref='recipient', lazy=True)
    topics = db.relationship('Topic', backref='user', lazy=True)
