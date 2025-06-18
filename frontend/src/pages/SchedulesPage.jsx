import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import AlertMessage from '../components/UI/AlertMessage';
// import './SchedulesPage.css';

const SchedulesPage = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/schedules');
            setSchedules(response.data.schedules);
        } catch (err) {
            setError('Не удалось загрузить расписания.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleDeleteSchedule = async (scheduleId) => {
        if (window.confirm('Вы уверены, что хотите удалить это расписание и все связанные напоминания?')) {
            try {
                await apiClient.delete(`/schedules/${scheduleId}`);
                setSchedules(prevSchedules => prevSchedules.filter(s => s.id !== scheduleId));
            } catch (err) {
                setError(err.response?.data?.message || 'Не удалось удалить расписание.');
                console.error(err);
            }
        }
    };
    
    const frequencyMap = {
        daily: 'Ежедневно',
        weekly: 'Еженедельно',
        monthly: 'Ежемесячно'
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="schedules-page">
            <div className="page-header">
                <h2>Мои расписания</h2>
                <Link to="/add-schedule" className="btn btn-primary">Добавить расписание</Link>
            </div>
            {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
            
            {schedules.length > 0 ? (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Повторение</th>
                            <th>Время</th>
                            <th>Дата начала</th>
                            <th>Дата окончания</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map(schedule => (
                            <tr key={schedule.id}>
                                <td>{schedule.title}</td>
                                <td>{schedule.description || '-'}</td>
                                <td>{frequencyMap[schedule.frequency] || schedule.frequency}</td>
                                <td>{schedule.time_of_day}</td>
                                <td>{schedule.start_date}</td>
                                <td>{schedule.end_date || 'Нет'}</td>
                                <td>
                                    <button 
                                        onClick={() => handleDeleteSchedule(schedule.id)} 
                                        className="btn btn-sm btn-danger"
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !loading && <p>У вас пока нет расписаний.</p>
            )}
        </div>
    );
};

export default SchedulesPage;