import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import AlertMessage from '../components/UI/AlertMessage';
import VoiceInputMenu from '../components/UI/VoiceInputMenu';

const AddSchedulePage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [timeOfDay, setTimeOfDay] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!title || !frequency || !timeOfDay || !startDate) {
            setError('Пожалуйста, заполните все обязательные поля.');
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                title,
                description,
                frequency,
                time_of_day: timeOfDay,
                start_date: startDate,
            };
            if (endDate) {
                payload.end_date = endDate;
            }

            await apiClient.post('/schedules', payload);
            navigate('/schedules');
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось создать расписание.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container">
            <h2>Добавить расписание</h2>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Название (обязательно):</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <VoiceInputMenu
                        onText={(text) => setTitle(prev => prev ? prev + ' ' + text : text)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Описание:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                    />
                    <VoiceInputMenu
                        onText={(text) => setDescription(prev => prev ? prev + ' ' + text : text)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="frequency">Повторение (обязательно):</label>
                    <select
                        id="frequency"
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        required
                    >
                        <option value="daily">Ежедневно</option>
                        <option value="weekly">Еженедельно</option>
                        <option value="monthly">Ежемесячно</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="timeOfDay">Время (обязательно, HH:MM):</label>
                    <input
                        type="time"
                        id="timeOfDay"
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="startDate">Дата начала (обязательно):</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="endDate">Дата окончания (необязательно):</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Создание..." : "Создать расписание"}
                </button>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/schedules')}
                    style={{ marginLeft: '10px' }}
                >
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default AddSchedulePage;
