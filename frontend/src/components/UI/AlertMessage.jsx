import React from 'react';
// import './AlertMessage.css'; // Basic styling for alerts

const AlertMessage = ({ type = 'info', message, onClose }) => {
    if (!message) return null;

    return (
        <div className={`alert alert-${type}`}>
            {message}
            {onClose && <button onClick={onClose} className="close-alert">×</button>}
        </div>
    );
};

export default AlertMessage;