import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import NoteList from '../components/Notes/NoteList';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
// import './HomePage.css';

const HomePage = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get('/notes');
                setNotes(response.data.notes);
            } catch (err) {
                setError('Не удалось загрузить заметки.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotes();
    }, []);

    const handleDeleteNote = async (noteId) => {
        if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
            try {
                await apiClient.delete(`/notes/${noteId}`);
                setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
            } catch (err) {
                setError('Не удалось удалить заметку.');
                console.error(err);
            }
        }
    };


    if (loading) return <LoadingSpinner />;
    
    return (
        <div className="home-page">
            <div className="page-header">
                <h2>Мои заметки</h2>
                <Link to="/add-note" className="btn btn-primary">Добавить заметку</Link>
            </div>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')}/>}
            {notes.length > 0 ? (
                <NoteList notes={notes} onDelete={handleDeleteNote} />
            ) : (
                !loading && <p>У вас пока нет заметок. Создайте первую!</p>
            )}
        </div>
    );
};

export default HomePage;