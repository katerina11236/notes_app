import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
// import './TopicsPage.css';

const TopicsPage = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/topics');
            setTopics(response.data.topics);
        } catch (err) {
            setError('Не удалось загрузить темы.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const handleDeleteTopic = async (topicId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту тему и все связанные с ней заметки?')) {
            try {
                await apiClient.delete(`/topics/${topicId}`);
                // Refetch topics or filter locally
                setTopics(prevTopics => prevTopics.filter(topic => topic.id !== topicId));
            } catch (err) {
                setError(err.response?.data?.message || 'Не удалось удалить тему.');
                console.error(err);
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="topics-page">
            <div className="page-header">
                <h2>Мои темы</h2>
                <Link to="/add-topic" className="btn btn-primary">Добавить тему</Link>
            </div>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            
            {topics.length > 0 ? (
                <div className="list-group">
                    {topics.map(topic => (
                        <div key={topic.id} className="list-group-item d-flex justify-content-between align-items-center">
                            {/* You might want a dedicated page for viewing notes in a topic */}
                            {/* For now, just linking to the topic management */}
                            <span>{topic.name}</span> 
                            <div>
                                {/* <Link to={`/topics/${topic.id}/notes`} className="btn btn-sm btn-info me-2">Просмотр</Link> */}
                                <button 
                                    onClick={() => handleDeleteTopic(topic.id)} 
                                    className="btn btn-sm btn-danger"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                !loading && <p>У вас пока нет тем. Создайте первую!</p>
            )}
        </div>
    );
};

export default TopicsPage;