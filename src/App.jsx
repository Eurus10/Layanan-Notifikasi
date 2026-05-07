import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  MessageSquare,
  Settings,
  Bell,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import DataSiswa from './components/DataSiswa';
import Tunggakan from './components/Tunggakan';
import Notifikasi from './components/Notifikasi';
import Pengaturan from './components/Pengaturan';
import Login from './components/Login';

function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { id: 'students', label: 'Data Siswa', icon: <Users size={19} /> },
    { id: 'arrears', label: 'Tunggakan', icon: <AlertCircle size={19} /> },
    { id: 'notification', label: 'Notifikasi', icon: <MessageSquare size={19} /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings size={19} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} session={session} />;
      case 'students': return <DataSiswa />;
      case 'arrears': return <Tunggakan />;
      case 'notification': return <Notifikasi />;
      case 'settings': return <Pengaturan />;
      default: return <Dashboard onNavigate={setActiveTab} session={session} />;
    }
  };

  const currentPage = navItems.find(i => i.id === activeTab);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo" onClick={() => setActiveTab('dashboard')}>
          <div className="logo-icon">
            <Bell size={20} color="#fff" />
          </div>
          <div className="logo-text">
            <span>SDIT AL FIKRI</span>
            <span>Layanan Notifikasi</span>
          </div>
        </div>

        <div>
          <p className="nav-section-label">Menu Utama</p>
          <nav className="nav-links">
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#fca5a5', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            Logout
          </button>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Supabase Status</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="status-dot"></div>
            <span>Connected</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <h1>{currentPage?.label || 'Dashboard'}</h1>
          <p>Sistem Otomatisasi Notifikasi Tunggakan — SDIT AL FIKRI</p>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
