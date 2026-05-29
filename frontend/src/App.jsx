import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login    from './pages/Login';
import Register from './pages/Register';
import Lobby    from './pages/Lobby';
import Room     from './pages/Room';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute><Lobby /></ProtectedRoute>
      }/>
      <Route path="/room/:id" element={
        <ProtectedRoute><Room /></ProtectedRoute>
      }/>
    </Routes>
  );
}