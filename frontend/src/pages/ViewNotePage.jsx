import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
import { FLASK_STATIC_URL } from '../config';
// import './ViewNotePage.css';

const ViewNotePage = () => {
    const { id } = useParams();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNote = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/notes/${id}`);
                setNote(response.data);
            } catch (err) {
                setError('Не удалось загрузить заметку. Возможно, у вас нет доступа.');
                console.error(err);
                if (err.response && (err.response.status === 403 || err.response.status === 404)) {
                    // Optionally redirect or show a more specific message
                }
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [id]);

    const handleDeleteNote = async () => {
        if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
            try {
                await apiClient.delete(`/notes/${id}`);
                navigate('/');
            } catch (err) {
                setError('Не удалось удалить заметку.');
                console.error(err);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleString('ru-RU');
    };

    if (loading) return <LoadingSpinner />;
    if (error && !note) return <AlertMessage type="error" message={error} />; // Show error only if note not loaded
    if (!note) return <AlertMessage type="info" message="Заметка не найдена." />;


    const isOwner = currentUser && note.user_id === currentUser.id;
    const canEditShared = note.can_edit_shared;

    return (
        <div className="view-note-page card">
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            <div className="card-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{note.title}</h4>
                    <div>
                        {note.topic_name && <span className="badge bg-secondary" style={{marginRight: '10px'}}>{note.topic_name}</span>}
                        {(isOwner || canEditShared) && (
                             <Link to={`/notes/${id}/edit`} className="btn btn-sm btn-secondary" style={{marginRight: '10px'}}>
                                <i className="bi bi-pencil"></i> Редактировать
                            </Link>
                        )}
                        {isOwner && (
                            <>
                                <Link to={`/notes/${id}/share`} className="btn btn-sm btn-outline-primary ms-2" style={{marginRight: '10px'}}>
                                    <i className="bi bi-share"></i> Поделиться
                                </Link>
                                <button onClick={handleDeleteNote} className="btn btn-sm btn-danger">
                                    <i className="bi bi-trash"></i> Удалить
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="card-body">
                {note.image && (
                    <img 
                        src={`${FLASK_STATIC_URL}/static/uploads/${note.image}`} 
                        alt={note.title} 
                        className="img-fluid mb-3" 
                        style={{ maxHeight: '400px', display: 'block', margin: '0 auto 20px auto' }}
                    />
                )}
                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{note.content}</p>
            </div>

            <div className="card-footer text-muted">
                <small>Автор: {note.author_username}</small><br/>
                <small>Создано: {formatDate(note.created_at)}</small>
                {note.shares && note.shares.length > 0 && (
                    <small className="ms-3" style={{display: 'block', marginTop: '5px'}}>
                        <i className="bi bi-people-fill"></i> Доступно для: 
                        {note.shares.map(share => share.username).join(', ')}
                    </small>
                )}
            </div>
        </div>
    );
};

export default ViewNotePage;