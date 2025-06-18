import React from 'react';
import { Link } from 'react-router-dom';
import { FLASK_STATIC_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext'; // To check ownership for edit/delete
// import './NoteItem.css'; // For styling individual notes (cards)

const NoteItem = ({ note, onDelete }) => {
    const { currentUser } = useAuth();
    const isOwner = note.user_id === currentUser?.id;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="note-card"> {/* Use card styling */}
            {note.image && (
                <img 
                    src={`${FLASK_STATIC_URL}/static/uploads/${note.image}`} 
                    alt={note.title} 
                    className="note-image"
                />
            )}
            <div className="note-card-body">
                <h3 className="note-title">
                    <Link to={`/notes/${note.id}`}>{note.title}</Link>
                </h3>
                <p className="note-content-preview">
                    {note.content.substring(0, 150)}{note.content.length > 150 ? '...' : ''}
                </p>
                <small className="note-meta">
                    Создано: {formatDate(note.created_at)} by {note.author_username}
                    {note.topic_name && <span className="topic-badge">Тема: {note.topic_name}</span>}
                </small>
            </div>
            {(isOwner || note.can_edit_shared) && (
                 <div className="note-actions">
                    <Link to={`/notes/${note.id}/edit`} className="btn btn-sm btn-secondary">Редактировать</Link>
                    {isOwner && (
                        <>
                            <button onClick={() => onDelete(note.id)} className="btn btn-sm btn-danger">Удалить</button>
                            <Link to={`/notes/${note.id}/share`} className="btn btn-sm btn-info">Поделиться</Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default NoteItem;