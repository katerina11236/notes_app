import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
// import './SharedNotesPage.css';

const SharedNotesPage = () => {
    const [sharedNotes, setSharedNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSharedNotes = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/shared_notes');
                setSharedNotes(response.data.shared_notes);
            } catch (err) {
                setError('Не удалось загрузить доступные заметки.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSharedNotes();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="shared-notes-page">
            <h2>Заметки, доступные мне</h2>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')}/>}
            
            {sharedNotes.length > 0 ? (
                <div className="list-group">
                    {sharedNotes.map(share => (
                        <Link 
                            key={share.note_id} 
                            to={`/notes/${share.note_id}`} 
                            className="list-group-item list-group-item-action"
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{share.title}</h5>
                                <small>От {share.author_username}</small>
                            </div>
                            <p className="mb-1">{share.content_preview}</p>
                            {share.can_edit && <span className="badge bg-success">Можно редактировать</span>}
                        </Link>
                    ))}
                </div>
            ) : (
               !loading && <p>Вам пока не предоставили доступ ни к одной заметке.</p>
            )}
        </div>
    );
};

export default SharedNotesPage;