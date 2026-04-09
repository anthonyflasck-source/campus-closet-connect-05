import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    if (confirm('Sign out?')) {
      await signOut();
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-6 max-w-[1200px] mx-auto">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold hover:opacity-85 transition-opacity">
          <span className="text-2xl">👗</span>
          <span className="gradient-text">CampusCloset</span>
          <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Illinois</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="flex flex-col gap-1 p-2 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
          <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
          <span className="block w-5 h-0.5 bg-foreground rounded-sm" />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive('/') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            Explore
          </Link>
          {user ? (
            <>
              <Link
                to="/create"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/create') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                + List Item
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive('/dashboard') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-1 pl-1 pr-4 rounded-full bg-foreground/5 text-sm cursor-pointer hover:bg-foreground/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span>{displayName.split(' ')[0]}</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background/97 backdrop-blur-xl border-b border-border p-6 flex flex-col gap-2 animate-fade-in">
          <Link to="/" onClick={() => setMenuOpen(false)} className={`w-full text-center py-3 rounded-full text-sm font-medium ${isActive('/') ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>Explore</Link>
          {user ? (
            <>
              <Link to="/create" onClick={() => setMenuOpen(false)} className="w-full text-center py-3 rounded-full text-sm font-medium text-muted-foreground">+ List Item</Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="w-full text-center py-3 rounded-full text-sm font-medium text-muted-foreground">Dashboard</Link>
              <button onClick={handleLogout} className="w-full text-center py-3 rounded-full text-sm font-medium text-muted-foreground">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full text-center py-3 rounded-full text-sm font-semibold text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
}
