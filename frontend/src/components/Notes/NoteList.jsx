import React from 'react';
import NoteItem from './NoteItem';
// import './NoteList.css'; // For styling the list

const NoteList = ({ notes, onDelete }) => {
    if (!notes || notes.length === 0) {
        return <p>Заметок нет.</p>;
    }

    return (
        <div className="note-list">
            {notes.map(note => (
                <NoteItem key={note.id} note={note} onDelete={onDelete} />
            ))}
        </div>
    );
};

export default NoteList;