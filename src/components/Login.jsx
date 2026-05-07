import React, { useState } from 'react';
import { Bell, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email atau password salah.'
        : authError.message
      );
      setLoading(false);
      return;
    }

    if (data?.session) {
      onLogin(data.session);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Animated background orbs */}
      <div className="login-bg-orb login-bg-orb-1"></div>
      <div className="login-bg-orb login-bg-orb-2"></div>
      <div className="login-bg-orb login-bg-orb-3"></div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Bell size={28} color="#fff" />
          </div>
          <div className="login-logo-text">
            <h1>SDIT AL FIKRI</h1>
            <p>Layanan Notifikasi</p>
          </div>
        </div>

        <div className="login-divider"></div>

        <h2 className="login-title">Masuk ke Dashboard</h2>
        <p className="login-subtitle">Silakan login dengan akun admin Anda</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@sekolah.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={18} className="spin" /> Memproses...</>
            ) : (
              <><LogIn size={18} /> Masuk</>
            )}
          </button>
        </form>

        <p className="login-footer">
          © 2026 SDIT AL FIKRI — Sistem Notifikasi Tunggakan
        </p>
      </motion.div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-dark);
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          pointer-events: none;
        }

        .login-bg-orb-1 {
          width: 400px;
          height: 400px;
          background: #6366f1;
          top: -100px;
          right: -100px;
          animation: float1 8s ease-in-out infinite;
        }

        .login-bg-orb-2 {
          width: 300px;
          height: 300px;
          background: #8b5cf6;
          bottom: -50px;
          left: -50px;
          animation: float2 10s ease-in-out infinite;
        }

        .login-bg-orb-3 {
          width: 200px;
          height: 200px;
          background: #10b981;
          top: 50%;
          left: 50%;
          animation: float3 12s ease-in-out infinite;
        }

        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 30px); }
        }

        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }

        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }

        .login-card {
          background: rgba(15, 22, 41, 0.8);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 10;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
        }

        .login-logo-text h1 {
          font-size: 1.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: 0.5px;
        }

        .login-logo-text p {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .login-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--glass-border), transparent);
          margin-bottom: 1.75rem;
        }

        .login-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .login-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .login-field label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .login-field .form-input {
          padding: 0.8rem 1rem;
          font-size: 0.95rem;
        }

        .login-password-wrapper {
          position: relative;
        }

        .login-eye-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }

        .login-eye-btn:hover {
          color: var(--text-main);
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 0.65rem 1rem;
          border-radius: 0.6rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-submit {
          width: 100%;
          padding: 0.85rem;
          font-size: 0.95rem;
          margin-top: 0.5rem;
          justify-content: center;
        }

        .login-footer {
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-subtle);
          margin-top: 2rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
