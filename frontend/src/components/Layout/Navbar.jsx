import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css'; // Create this CSS file for basic styling

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
            // Show error message to user
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">Мои заметки</Link>
                <ul className="navbar-nav">
                    {currentUser ? (
                        <>
                            <li className="nav-item"><Link to="/" className="nav-link">Главная</Link></li>
                            <li className="nav-item"><Link to="/topics" className="nav-link">Темы</Link></li>
                            <li className="nav-item"><Link to="/shared-notes" className="nav-link">Доступные мне</Link></li>
                            <li className="nav-item"><Link to="/schedules" className="nav-link">Расписания</Link></li>
                            <li className="nav-item user-greeting">Привет, {currentUser.username}!</li>
                            <li className="nav-item">
                                <button onClick={handleLogout} className="nav-link btn-logout">Выйти</button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="nav-item"><Link to="/login" className="nav-link">Войти</Link></li>
                            <li className="nav-item"><Link to="/signup" className="nav-link">Регистрация</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;