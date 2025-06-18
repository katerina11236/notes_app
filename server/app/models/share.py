from datetime import datetime
from app import db

class NoteShare(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    note_id = db.Column(db.Integer, db.ForeignKey('note.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    can_edit = db.Column(db.Boolean, default=False)
    shared_at = db.Column(db.DateTime, default=datetime.utcnow)
