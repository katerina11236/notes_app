import React, { useState, useEffect, useRef } from 'react'; 

const NoteForm = ({ 
    onSubmit, 
    initialData = null,
    topics = [], 
    loadingTopics, 
    submitButtonText = "Сохранить", 
    isCreating = false 
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [topicId, setTopicId] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [recordingField, setRecordingField] = useState(null);
    const recognitionRef = useRef(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!isCreating && initialData && Object.keys(initialData).length > 0) {
            setTitle(initialData.title || '');
            setContent(initialData.content || '');
            setTopicId(initialData.topic_id || '');
            setImage(null);
            setImagePreview(initialData.image_url || null);
            isInitialized.current = true;
        } else if (isCreating && !isInitialized.current) {
            setTitle('');
            setContent('');
            setTopicId('');
            setImage(null);
            setImagePreview(null);
            isInitialized.current = true;
        }
    }, [initialData?.id, isCreating]);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImage(null);
            setImagePreview(null);
        }
    };

    const handleStartRecording = (field) => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Ваш браузер не поддерживает голосовой ввод.');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            if (field === 'title') setTitle(prev => prev + ' ' + text);
            if (field === 'content') setContent(prev => prev + '\n' + text);
            setRecordingField(null);
        };

        recognition.onerror = () => setRecordingField(null);
        recognition.onend = () => setRecordingField(null);

        recognition.start();
        recognitionRef.current = recognition;
        setRecordingField(field);
    };

    const handleStopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            setRecordingField(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({ title, content, topic_id: topicId, image });
            if (isCreating) {
                setTitle('');
                setContent('');
                setTopicId('');
                setImage(null);
                setImagePreview(null);
            }
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="note-form">
            <div className="form-group">
                <label htmlFor="title-input">Заголовок:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        id="title-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        aria-label="Заголовок заметки"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                            recordingField === 'title'
                                ? handleStopRecording()
                                : handleStartRecording('title')
                        }
                    >
                        {recordingField === 'title' ? '🛑' : '🎤'}
                    </button>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="content-input">Содержание:</label>
                <textarea
                    id="content-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="5"
                    required
                    aria-label="Содержание заметки"
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary mt-2"
                    onClick={() =>
                        recordingField === 'content'
                            ? handleStopRecording()
                            : handleStartRecording('content')
                    }
                >
                    {recordingField === 'content' ? '🛑 Остановить' : '🎤 Голос'}
                </button>
            </div>

            <div className="form-group">
                <label htmlFor="topic-select">Тема:</label>
                <select
                    id="topic-select"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={loadingTopics}
                    aria-label="Выберите тему"
                >
                    <option value="">Без темы</option>
                    {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                    ))}
                </select>
                {loadingTopics && <small> Загрузка тем...</small>}
            </div>

            <div className="form-group">
                <label htmlFor="image-input">Изображение:</label>
                {imagePreview && (
                    <img 
                        src={imagePreview} 
                        alt="Предпросмотр" 
                        style={{ maxWidth: '200px', display: 'block', marginBottom: '10px' }} 
                    />
                )}
                <input
                    type="file"
                    id="image-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    aria-label="Выберите изображение"
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Сохранение...' : submitButtonText}
            </button>
        </form>
    );
};

export default NoteForm;
