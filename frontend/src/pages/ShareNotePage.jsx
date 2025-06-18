import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
// import './ShareNotePage.css';

const ShareNotePage = () => {
    const { id: noteId } = useParams();
    const navigate = useNavigate();
    const [noteTitle, setNoteTitle] = useState('');
    const [shares, setShares] = useState([]);
    const [usernameToShare, setUsernameToShare] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchNoteAndShares = async () => {
        setLoading(true);
        setError('');
        try {
            // We only need note title and current shares
            // The backend /api/notes/:id now returns shares
            const response = await apiClient.get(`/notes/${noteId}`);
            setNoteTitle(response.data.title);
            setShares(response.data.shares || []);
        } catch (err) {
            setError('Не удалось загрузить информацию о заметке или правах доступа.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNoteAndShares();
    }, [noteId]);

    const handleShareSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const response = await apiClient.post(`/notes/${noteId}/share`, {
                username: usernameToShare,
                can_edit: canEdit,
            });
            setShares([...shares, response.data.share]); // Add new share to the list
            setUsernameToShare('');
            setCanEdit(false);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Не удалось поделиться заметкой.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevokeShare = async (shareId) => {
        if (window.confirm('Вы уверены, что хотите отозвать доступ?')) {
            try {
                await apiClient.delete(`/shares/${shareId}`);
                setShares(shares.filter(share => share.id !== shareId));
            } catch (err) {
                setError(err.response?.data?.message || 'Не удалось отозвать доступ.');
                console.error(err);
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="card">
            <div className="card-header">
                <h4>Поделиться заметкой: {noteTitle || 'Загрузка...'}</h4>
            </div>
            <div className="card-body">
                {error && <AlertMessage type="error" message={error} onClose={() => setError('')}/>}
                
                <form onSubmit={handleShareSubmit} className="mb-4">
                    {formError && <AlertMessage type="error" message={formError} onClose={() => setFormError('')}/>}
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label htmlFor="username" className="form-label">Имя пользователя</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                value={usernameToShare}
                                onChange={(e) => setUsernameToShare(e.target.value)}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <div className="form-check" style={{ paddingTop: '30px' }}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="can_edit"
                                    checked={canEdit}
                                    onChange={(e) => setCanEdit(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="can_edit">
                                    Разрешить редактирование
                                </label>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                                {submitting ? "Добавление..." : "Добавить"}
                            </button>
                        </div>
                    </div>
                </form>

                <h5>Пользователи с доступом:</h5>
                {shares.length > 0 ? (
                    <ul className="list-group">
                        {shares.map(share => (
                            <li key={share.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    {share.username}
                                    {share.can_edit && <span className="badge bg-success ms-2" style={{marginLeft: "5px"}}>Редактирование</span>}
                                </div>
                                <button onClick={() => handleRevokeShare(share.id)} className="btn btn-sm btn-danger">
                                    <i className="bi bi-trash"></i> Удалить
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Нет пользователей с доступом к этой заметке.</p>
                )}
                <button type="button" className="btn btn-secondary mt-3" onClick={() => navigate(`/notes/${noteId}`)}>
                    Назад к заметке
                </button>
            </div>
        </div>
    );
};

export default ShareNotePage;