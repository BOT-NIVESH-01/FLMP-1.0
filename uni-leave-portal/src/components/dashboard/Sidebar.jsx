import { Calendar, BookOpen, Eye, LogOut, User, Shield } from 'lucide-react';

export default function Sidebar({ user, setView, onLogout, currentView }) {
  const isAdminOrHod = ['admin', 'hod'].includes(user.role?.toLowerCase());

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Shield /> UniAdmin
      </div>

      <div className="sidebar-user">
        <User size={18} />
        <div>
          <div>{user.name}</div>
          <small>{user.role}</small>
        </div>
      </div>

      <button
        className={currentView === 'dashboard' ? 'active' : ''}
        onClick={() => setView('dashboard')}
      >
        <BookOpen size={16} /> Dashboard
      </button>

      <button
        className={currentView === 'timetable' ? 'active' : ''}
        onClick={() => setView('timetable')}
      >
        <Calendar size={16} /> Timetable
      </button>

      {isAdminOrHod && (
        <button
          className={currentView === 'faculty' ? 'active' : ''}
          onClick={() => setView('faculty')}
        >
          <Eye size={16} /> Faculty Overview
        </button>
      )}

      <button className="logout" onClick={onLogout}>
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
}
