import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NoteForm from '../components/Notes/NoteForm';
import apiClient from '../api';
import AlertMessage from '../components/UI/AlertMessage';

const AddNotePage = () => {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(true);

    useEffect(() => {
        const fetchTopics = async () => {
            setLoadingTopics(true);
            try {
                const response = await apiClient.get('/topics');
                setTopics(response.data.topics || []);
            } catch (err) {
                console.error("Failed to fetch topics", err);
                setError('Не удалось загрузить темы.');
            } finally {
                setLoadingTopics(false);
            }
        };
        fetchTopics();
    }, []);

    const handleAddNote = async (noteData) => {
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', noteData.title);
            formData.append('content', noteData.content);

            if (noteData.topic_id && noteData.topic_id !== "") {
                formData.append('topic_id', noteData.topic_id);
            }

            if (noteData.image) {
                formData.append('image', noteData.image);
            }

            await apiClient.post('/notes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать заметку.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2>Новая заметка</h2>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            <NoteForm
                onSubmit={handleAddNote}
                topics={topics}
                loadingTopics={loadingTopics}
                submitButtonText={submitting ? "Создание..." : "Создать заметку"}
                isCreating={true}
                enableVoiceInput={true} // 👈 важно: передаём флаг
            />
        </div>
    );
};

export default AddNotePage;
