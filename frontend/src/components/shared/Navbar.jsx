import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <div className="flex items-center gap-2 text-black">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white">
          <Logo className="h-4 w-4" />
        </span>
        <span className="font-semibold text-black text-base tracking-normal">CollabCanvas</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{ backgroundColor: user?.displayColor }}
        >
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm text-gray-700 font-medium">{user?.username}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200
                     rounded-lg px-3 py-1.5 transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
