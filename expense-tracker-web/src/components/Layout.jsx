import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

export default function Layout({ children }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Wallet size={20} color="white" />
          </div>
          <span className="sidebar-logo-text">SplitEasy</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            My Groups
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Avatar name={profile?.name} id={profile?.id} size={32} />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name truncate">{profile?.name}</div>
              <div className="sidebar-user-email truncate">{profile?.email}</div>
            </div>
            <button className="btn btn-icon btn-ghost" onClick={handleLogout} title="Sign out">
              <LogOut size={16} color="var(--text-sec)" />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
