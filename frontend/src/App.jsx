import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AddNotePage from './pages/AddNotePage';
import ViewNotePage from './pages/ViewNotePage';
import EditNotePage from './pages/EditNotePage';
import TopicsPage from './pages/TopicsPage';
import AddTopicPage from './pages/AddTopicPage';
// import ViewTopicPage from './pages/ViewTopicPage'; // You might integrate this into TopicsPage
import ShareNotePage from './pages/ShareNotePage';
import SharedNotesPage from './pages/SharedNotesPage';
import SchedulesPage from './pages/SchedulesPage';
import AddSchedulePage from './pages/AddSchedulePage';
import NotFoundPage from './pages/NotFoundPage';
import LoadingSpinner from './components/UI/LoadingSpinner';
import './App.css'; // For global styles

// ProtectedRoute component
const ProtectedRoute = ({ children }) => {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />; // Or some other loading indicator
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    return children;
};


function AppContent() {
    return (
        <>
            <Navbar />
            <main className="container">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Protected Routes */}
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/add-note" element={<ProtectedRoute><AddNotePage /></ProtectedRoute>} />
                    <Route path="/notes/:id" element={<ProtectedRoute><ViewNotePage /></ProtectedRoute>} />
                    <Route path="/notes/:id/edit" element={<ProtectedRoute><EditNotePage /></ProtectedRoute>} />
                    <Route path="/notes/:id/share" element={<ProtectedRoute><ShareNotePage /></ProtectedRoute>} />
                    
                    <Route path="/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
                    <Route path="/add-topic" element={<ProtectedRoute><AddTopicPage /></ProtectedRoute>} />
                    {/* <Route path="/topics/:id" element={<ProtectedRoute><ViewTopicPage /></ProtectedRoute>} /> */}

                    <Route path="/shared-notes" element={<ProtectedRoute><SharedNotesPage /></ProtectedRoute>} />
                    
                    <Route path="/schedules" element={<ProtectedRoute><SchedulesPage /></ProtectedRoute>} />
                    <Route path="/add-schedule" element={<ProtectedRoute><AddSchedulePage /></ProtectedRoute>} />

                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>
        </>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;