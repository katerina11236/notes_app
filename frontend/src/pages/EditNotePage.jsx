import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import NoteForm from '../components/Notes/NoteForm'; // Assuming you have this component
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
import { FLASK_STATIC_URL } from '../config';

const EditNotePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [noteResponse, topicsResponse] = await Promise.all([
                    apiClient.get(`/notes/${id}`),
                    apiClient.get('/topics')
                ]);
                const fetchedNote = noteResponse.data;
                setNote({
                    title: fetchedNote.title,
                    content: fetchedNote.content,
                    topic_id: fetchedNote.topic_id || '',
                    image_url: fetchedNote.image ? `${FLASK_STATIC_URL}/static/uploads/${fetchedNote.image}` : null
                });
                setTopics(topicsResponse.data.topics);
            } catch (err) {
                setError('Не удалось загрузить данные для редактирования.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleEditNote = async (noteData) => {
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', noteData.title);
            formData.append('content', noteData.content);
            if (noteData.topic_id) {
                formData.append('topic_id', noteData.topic_id);
            }
            if (noteData.image) { // image is a File object if changed
                formData.append('image', noteData.image);
            }
            // If image is not changed, the backend PUT handler should not require it
            // or have a way to signal "keep existing image".
            // Our Flask PUT handler for notes currently expects image only if it's being changed.

            await apiClient.put(`/notes/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            navigate(`/notes/${id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось обновить заметку.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error && !note) return <AlertMessage type="error" message={error} />;
    if (!note) return <AlertMessage type="info" message="Заметка не найдена." />;

    return (
        <div>
            <h2>Редактировать заметку</h2>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            <NoteForm
                onSubmit={handleEditNote}
                initialData={note}
                topics={topics}
                loadingTopics={false} // Assuming topics are loaded by now
                submitButtonText={submitting ? "Сохранение..." : "Сохранить изменения"}
            />
        </div>
    );
};

export default EditNotePage;