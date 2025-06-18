import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get('/auth/status');
                if (response.data.isLoggedIn) {
                    setCurrentUser(response.data.user);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                setCurrentUser(null);
                console.error("Error checking auth status:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    const login = async (username, password) => {
        const response = await apiClient.post('/auth/login', { username, password });
        setCurrentUser(response.data.user);
        return response;
    };

    const signup = async (username, password) => {
        const response = await apiClient.post('/auth/signup', { username, password });
        setCurrentUser(response.data.user);
        return response;
    };

    const logout = async () => {
        await apiClient.post('/auth/logout');
        setCurrentUser(null);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, signup, logout, isLoading, setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);