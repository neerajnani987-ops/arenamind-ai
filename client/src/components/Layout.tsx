import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  Flame
} from 'lucide-react';
import { useRealtimeCollection } from '../firebase/config';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Load real-time alerts for the notifications bell
  const { data: alerts, updateItem } = useRealtimeCollection<any>('alerts');
  const activeAlerts = alerts.filter(a => a.status === 'active');

  const menuItems = [
    { name: 'Home Landing', path: '/', icon: <Home size={18} />, roles: ['all'] },
    { name: 'Stadium Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['all'] },
  ];

  // Role-specific indicators
  const roleColors: Record<string, string> = {
    spectator: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    organizer: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    volunteer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    security: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medical: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    admin: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as any;
    switchRole(selectedRole);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-dark-text light:bg-light-bg light:text-light-text font-sans">
      {/* WCAG Skip Navigation Link */}
      <a 
        href="#main-content-anchor" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:font-semibold"
      >
        Skip to Main Content
      </a>

      {/* Top Header */}
      <header className="h-16 border-b border-white/5 light:border-black/5 glass-panel sticky top-0 z-[1900] flex items-center justify-between px-4" role="banner">
        
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg md:hidden hover:bg-white/10 transition-colors outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-85 transition-opacity outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1"
            role="link"
            tabIndex={0}
            aria-label="ArenaMind Home"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/');
              }
            }}
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-neon text-base">
              AM
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                ArenaMind AI
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest text-white/40 leading-none">
                Smart Stadium Platform
              </span>
            </div>
          </div>
        </div>

        {/* Global Tools Header */}
        <div className="flex items-center space-x-4">
          
          {/* Quick Role Swapper Portal */}
          {user && (
            <div className="hidden md:flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
              <label htmlFor="role-select-dropdown" className="text-[10px] uppercase font-bold text-white/45 cursor-pointer">Terminal Role:</label>
              <select
                value={user.role}
                onChange={handleRoleChange}
                className="bg-transparent text-xs text-indigo-300 font-semibold focus:outline-none cursor-pointer border-none p-0 pr-6 outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                id="role-select-dropdown"
              >
                <option className="bg-[#0f172a] text-white" value="spectator">Spectator Dashboard</option>
                <option className="bg-[#0f172a] text-white" value="organizer">Organizer Operations</option>
                <option className="bg-[#0f172a] text-white" value="volunteer">Volunteer Assistant</option>
                <option className="bg-[#0f172a] text-white" value="security">Security Command</option>
                <option className="bg-[#0f172a] text-white" value="medical">Medical Dispatch</option>
                <option className="bg-[#0f172a] text-white" value="admin">System Administrator</option>
              </select>
            </div>
          )}

          {/* Theme Toggler */}
          <ThemeToggle />

          {/* Notifications Drawer Anchor */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-full glass-panel hover:bg-white/10 text-white/70 hover:text-white transition-colors relative outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={`Toggle alerts list, ${activeAlerts.length} active warnings`}
              aria-expanded={notificationsOpen}
              id="btn-notifications-drawer"
            >
              <Bell size={18} aria-hidden="true" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 mt-3 w-80 rounded-xl glass-panel shadow-glass border border-white/10 p-4 z-[999] text-white"
                role="region"
                aria-label="Stadium Notifications List"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="font-bold text-xs" aria-live="polite">Live Stadium Alerts ({activeAlerts.length})</span>
                  <button 
                    onClick={() => {
                      activeAlerts.forEach(a => updateItem(a.id, { status: 'resolved' }));
                      setNotificationsOpen(false);
                    }}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold outline-none focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[250px] overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="text-center py-4 text-xs text-white/40">No active incidents. Stadium normal.</div>
                  ) : (
                    activeAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                          alert.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                          alert.severity === 'high' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                          'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {alert.severity === 'critical' ? (
                          <Flame className="shrink-0 text-rose-400 mt-0.5" size={14} aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="shrink-0 text-amber-400 mt-0.5" size={14} aria-hidden="true" />
                        )}
                        <div>
                          <div className="font-bold flex items-center justify-between">
                            <span className="uppercase">{alert.type} Incident</span>
                            <span className="text-[9px] opacity-50">{alert.location}</span>
                          </div>
                          <p className="mt-0.5 opacity-90 leading-tight text-[11px]">{alert.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          {user && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full glass-panel hover:bg-white/10 text-rose-400 hover:text-rose-300 transition-colors outline-none focus:ring-2 focus:ring-rose-500"
              title="Logout"
              aria-label="Logout of ArenaMind"
              id="btn-logout"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Navigation Sidebar Drawer */}
        <aside 
          className={`w-64 border-r border-white/5 light:border-black/5 glass-panel md:block ${sidebarOpen ? 'block fixed inset-y-16 left-0 z-[1800] bg-dark-bg/95 backdrop-blur-md' : 'hidden'} transition-all`}
          role="complementary"
          aria-label="Sidebar Navigation Panel"
        >
          <div className="p-4 flex flex-col h-full justify-between">
            <div className="space-y-6">
              
              {/* User details */}
              {user && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-neon text-sm uppercase" aria-hidden="true">
                    {user.displayName?.slice(0, 2) || 'US'}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{user.displayName}</h4>
                    <span className="text-[10px] text-white/50 block truncate">{user.email}</span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border mt-1.5 ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="space-y-1" aria-label="Main Navigation Menu">
                {menuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${
                      location.pathname === item.path 
                        ? 'bg-indigo-600 text-white shadow-neon' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                ))}

                {user && (
                  <>
                    <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold px-3 pt-4 pb-1" aria-hidden="true">Role Dashboard</div>
                    <button
                      onClick={() => navigate(`/dashboard?role=${user.role}`)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all outline-none focus:ring-2 focus:ring-indigo-500 ${
                        location.search.includes(`role=${user.role}`)
                          ? 'bg-indigo-600/40 text-white border border-indigo-500/20'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Activity size={18} aria-hidden="true" />
                      <span className="capitalize">{user.role} Center</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Platform Version Footer */}
            <div className="text-[10px] text-white/30 border-t border-white/5 pt-3 mt-6" role="contentinfo">
              <div>Version 4.12.0 (Stable)</div>
              <div className="mt-0.5">ArenaMind AI Systems</div>
            </div>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main 
          id="main-content-anchor" 
          tabIndex={-1} 
          className="flex-1 p-4 md:p-6 overflow-y-auto w-full md:max-w-[calc(100vw-256px)] outline-none"
          role="main"
        >
          {/* Mobile warning header */}
          {user && (
            <div className="md:hidden flex items-center justify-between mb-4 bg-indigo-950/20 border border-indigo-500/10 p-2 rounded-lg text-xs">
              <label htmlFor="mobile-role-select" className="text-[10px] font-semibold text-indigo-300 cursor-pointer">Terminal Role Portal</label>
              <select
                id="mobile-role-select"
                value={user.role}
                onChange={handleRoleChange}
                className="bg-transparent text-xs text-indigo-300 font-bold focus:outline-none"
              >
                <option value="spectator">Spectator Dashboard</option>
                <option value="organizer">Organizer Operations</option>
                <option value="volunteer">Volunteer Assistant</option>
                <option value="security">Security Command</option>
                <option value="medical">Medical Dispatch</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
