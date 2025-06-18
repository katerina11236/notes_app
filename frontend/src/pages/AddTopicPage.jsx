import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import AlertMessage from '../components/UI/AlertMessage';
import VoiceInputMenu from '../components/UI/VoiceInputMenu'; // импорт голосового меню

const AddTopicPage = () => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        if (!name.trim()) {
            setError('Название темы не может быть пустым.');
            setSubmitting(false);
            return;
        }
        try {
            // Исправлено: добавлен префикс /api
            await apiClient.post('/topics', { name });
            navigate('/topics');
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать тему.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container">
            <h2>Добавить тему</h2>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Название темы</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <VoiceInputMenu
                        onText={(text) => setName(prev => prev ? prev + ' ' + text : text)}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Создание..." : "Создать"}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/topics')}
                    style={{ marginLeft: '10px' }}
                >
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default AddTopicPage;