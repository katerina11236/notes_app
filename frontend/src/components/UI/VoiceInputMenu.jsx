import React, { useRef, useState } from 'react';

const VoiceInputMenu = ({ onText, language = 'ru-RU' }) => {
    const [isListening, setIsListening] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const recognitionRef = useRef(null);

    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Ваш браузер не поддерживает голосовой ввод');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = language;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (onText) {
                onText(transcript);
            }
        };

        recognition.onerror = (event) => {
            alert('Ошибка голосового ввода: ' + event.error);
            console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopVoiceInput = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    return (
        <div>
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowMenu((prev) => !prev)}
                style={{ marginTop: '5px' }}
            >
                🎤 Голосовой ввод
            </button>

            {showMenu && (
                <div className="voice-menu" style={{ marginTop: '10px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
                    <button type="button" onClick={startVoiceInput} className="btn btn-success" disabled={isListening}>
                        ▶️ Начать
                    </button>
                    <button type="button" onClick={stopVoiceInput} className="btn btn-danger" style={{ marginLeft: '10px' }} disabled={!isListening}>
                        ⏹ Остановить
                    </button>
                    {isListening && <span style={{ marginLeft: '15px', color: 'red' }}>🔴 Запись...</span>}
                </div>
            )}
        </div>
    );
};

export default VoiceInputMenu;
