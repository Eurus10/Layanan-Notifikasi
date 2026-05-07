import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  UserCircle,
  Edit2,
  X,
  Save,
  Lock,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Dashboard = ({ onNavigate, session }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalArrears: 0,
    studentsWithArrears: 0,
    studentsLunas: 0,
    classDist: {},
    recentLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    role: '',
    password: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { data: students },
        { data: arrears },
        { data: logs }
      ] = await Promise.all([
        supabase.from('notif_students').select('id, name, class'),
        supabase.from('notif_arrears').select('id, student_id, amount, is_paid'),
        supabase.from('notif_logs').select('*').order('sent_at', { ascending: false }).limit(8)
      ]);

      const allStudents = students || [];
      const allArrears = arrears || [];

      const unpaidArrears = allArrears.filter(a => !a.is_paid);
      const totalArrearsAmount = unpaidArrears.reduce((sum, a) => sum + Number(a.amount || 0), 0);
      const studentsWithArrearsSet = new Set(unpaidArrears.map(a => a.student_id));
      const studentsWithArrears = studentsWithArrearsSet.size;
      const studentsLunas = allStudents.length - studentsWithArrears;

      // Class distribution
      const classDist = {};
      allStudents.forEach(s => {
        classDist[s.class] = (classDist[s.class] || 0) + 1;
      });

      setStats({
        totalStudents: allStudents.length,
        totalArrears: totalArrearsAmount,
        studentsWithArrears,
        studentsLunas: Math.max(0, studentsLunas),
        classDist,
        recentLogs: logs || []
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
    setLoading(false);
  };

  const handleOpenProfile = () => {
    const meta = session?.user?.user_metadata || {};
    setProfileForm({
      fullName: meta.full_name || '',
      role: meta.role || '',
      password: ''
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    setUpdatingProfile(true);
    try {
      const updates = {
        data: {
          full_name: profileForm.fullName,
          role: profileForm.role
        }
      };
      
      // If password is provided, update it
      if (profileForm.password.trim()) {
        const { error: pwdError } = await supabase.auth.updateUser({
          password: profileForm.password
        });
        if (pwdError) throw pwdError;
      }

      // Update metadata
      const { error: metaError } = await supabase.auth.updateUser(updates);
      if (metaError) throw metaError;

      alert('Profil berhasil diperbarui!');
      setShowProfileModal(false);
      
      // Optional: Refresh session to get updated metadata
      await supabase.auth.refreshSession();
      
    } catch (err) {
      alert('Gagal memperbarui profil: ' + err.message);
    }
    setUpdatingProfile(false);
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' }
    })
  };

  const maxClassCount = Math.max(...Object.values(stats.classDist), 1);

  return (
    <div>
      {/* Admin Profile Card */}
      {session && (
        <motion.div 
          className="glass-panel"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCircle size={28} color="var(--accent-blue)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {session.user.user_metadata?.full_name || 'Administrator'}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Mail size={13} /> {session.user.email}
                </p>
                {session.user.user_metadata?.role && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                    <CheckCircle2 size={13} /> {session.user.user_metadata.role}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleOpenProfile}>
            <Edit2 size={15} /> Edit Profil
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <motion.div className="stat-card" custom={0} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="stat-icon" style={{ background: 'var(--accent-blue-bg)' }}>
            <Users size={22} color="var(--accent-blue)" />
          </div>
          <p className="stat-label">Total Siswa</p>
          <p className="stat-value" style={{ color: 'var(--accent-blue)' }}>{stats.totalStudents}</p>
          <p className="stat-sub">Terdaftar dalam sistem</p>
        </motion.div>

        <motion.div className="stat-card" custom={1} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="stat-icon" style={{ background: 'var(--accent-red-bg)' }}>
            <AlertCircle size={22} color="var(--accent-red)" />
          </div>
          <p className="stat-label">Total Tunggakan</p>
          <p className="stat-value" style={{ color: 'var(--accent-red)', fontSize: '1.4rem' }}>{formatIDR(stats.totalArrears)}</p>
          <p className="stat-sub">Akumulasi belum lunas</p>
        </motion.div>

        <motion.div className="stat-card" custom={2} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="stat-icon" style={{ background: 'var(--accent-orange-bg)' }}>
            <TrendingUp size={22} color="var(--accent-orange)" />
          </div>
          <p className="stat-label">Siswa Menunggak</p>
          <p className="stat-value" style={{ color: 'var(--accent-orange)' }}>{stats.studentsWithArrears}</p>
          <p className="stat-sub">Memiliki tagihan aktif</p>
        </motion.div>

        <motion.div className="stat-card" custom={3} initial="hidden" animate="visible" variants={cardVariants}>
          <div className="stat-icon" style={{ background: 'var(--accent-green-bg)' }}>
            <CheckCircle2 size={22} color="var(--accent-green)" />
          </div>
          <p className="stat-label">Siswa Lunas</p>
          <p className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.studentsLunas}</p>
          <p className="stat-sub">Tidak ada tunggakan</p>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Class Distribution */}
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3><Users size={18} /> Distribusi Per Kelas</h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('students')}>
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          {Object.keys(stats.classDist).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats.classDist).sort(([a], [b]) => a.localeCompare(b)).map(([cls, count]) => (
                <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ width: '50px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{cls}</span>
                  <div style={{ flex: 1, height: '28px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxClassCount) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                      style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '0.75rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>{count} siswa</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <Users size={40} />
              <p>Belum ada data siswa</p>
            </div>
          )}
        </motion.div>

        {/* Recent Notifications */}
        <motion.div
          className="glass-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="panel-header">
            <h3><Clock size={18} /> Riwayat Notifikasi</h3>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('notification')}>
              Kirim Baru <ArrowRight size={14} />
            </button>
          </div>

          {stats.recentLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.recentLogs.map((log) => (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.65rem 0.75rem', borderRadius: '0.6rem',
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '0.5rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: log.type === 'whatsapp' ? 'rgba(37, 211, 102, 0.1)' : 'var(--accent-blue-bg)',
                    flexShrink: 0
                  }}>
                    {log.type === 'whatsapp' ?
                      <MessageSquare size={15} color="#25D366" /> :
                      <FileText size={15} color="var(--accent-blue)" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.student_name || 'Siswa'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {log.type === 'whatsapp' ? 'WhatsApp' : 'Surat'} • {formatDate(log.sent_at)}
                    </p>
                  </div>
                  {log.total_amount > 0 && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-orange)', whiteSpace: 'nowrap' }}>
                      {formatIDR(log.total_amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <MessageSquare size={40} />
              <p>Belum ada riwayat notifikasi</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Admin Profile Edit Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h3>Edit Profil Admin</h3>
                <button className="modal-close" onClick={() => setShowProfileModal(false)}><X size={16} /></button>
              </div>

              <div className="form-group">
                <label>Nama Lengkap</label>
                <div style={{ position: 'relative' }}>
                  <UserCircle size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Contoh: Budi Santoso"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Jabatan / Peran</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Contoh: Admin Keuangan"
                    value={profileForm.role}
                    onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <label>Ubah Password (Opsional)</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.3rem' }}>
                  Minimal 6 karakter.
                </p>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={updatingProfile}>
                  <Save size={16} /> {updatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Dashboard;
