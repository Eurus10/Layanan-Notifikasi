import React, { useState } from 'react';
import {
  Save, Image, CheckCircle2, X, MessageSquare, FileText, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

const Pengaturan = () => {
  const [waTemplate, setWaTemplate] = useState(
    localStorage.getItem('ln_wa_template') ||
    "Halo Bapak/Ibu Orang Tua dari *{nama}*,%0A%0AMohon maaf mengganggu waktunya. Kami dari Administrasi SDIT AL FIKRI ingin menginformasikan rincian tunggakan biaya sekolah sebagai berikut:%0A%0A{rincian}%0A%0A*Total Tunggakan: {total}*%0A%0AMohon segera melakukan pembayaran. Terima kasih."
  );
  const [letterBody, setLetterBody] = useState(
    localStorage.getItem('ln_letter_body') ||
    "Dengan hormat, kami mendoakan semoga Bapak/Ibu senantiasa berada dalam lindungan Allah SWT. Melalui surat ini, kami bermaksud menginformasikan rincian tunggakan biaya sekolah putra/putri Bapak/Ibu yang sampai saat ini belum terselesaikan, dengan rincian sebagai berikut:"
  );
  const [kopImage, setKopImage] = useState(localStorage.getItem('ln_kop_image') || '');
  const [ttdImage, setTtdImage] = useState(localStorage.getItem('ln_ttd_image') || '');
  const [ttdTuImage, setTtdTuImage] = useState(localStorage.getItem('ln_ttd_tu_image') || '');
  const [letterNumber, setLetterNumber] = useState(localStorage.getItem('ln_letter_number') || '024/ADM/AL-FIKRI/{tahun}');
  const [kepsekName, setKepsekName] = useState(localStorage.getItem('ln_kepsek_name') || '');
  const [tuName, setTuName] = useState(localStorage.getItem('ln_tu_name') || '');
  const [saved, setSaved] = useState(false);

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      if (target === 'kop') setKopImage(base64);
      if (target === 'ttd') setTtdImage(base64);
      if (target === 'ttdtu') setTtdTuImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem('ln_wa_template', waTemplate);
    localStorage.setItem('ln_letter_body', letterBody);
    localStorage.setItem('ln_kop_image', kopImage);
    localStorage.setItem('ln_ttd_image', ttdImage);
    localStorage.setItem('ln_ttd_tu_image', ttdTuImage);
    localStorage.setItem('ln_letter_number', letterNumber);
    localStorage.setItem('ln_kepsek_name', kepsekName);
    localStorage.setItem('ln_tu_name', tuName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (!confirm('Reset semua pengaturan ke default?')) return;
    const defaults = {
      ln_wa_template: "Halo Bapak/Ibu Orang Tua dari *{nama}*,%0A%0AMohon maaf mengganggu waktunya. Kami dari Administrasi SDIT AL FIKRI ingin menginformasikan rincian tunggakan biaya sekolah sebagai berikut:%0A%0A{rincian}%0A%0A*Total Tunggakan: {total}*%0A%0AMohon segera melakukan pembayaran. Terima kasih.",
      ln_letter_body: "Dengan hormat, kami mendoakan semoga Bapak/Ibu senantiasa berada dalam lindungan Allah SWT. Melalui surat ini, kami bermaksud menginformasikan rincian tunggakan biaya sekolah putra/putri Bapak/Ibu yang sampai saat ini belum terselesaikan, dengan rincian sebagai berikut:",
      ln_letter_number: '024/ADM/AL-FIKRI/{tahun}',
    };

    Object.keys(defaults).forEach(k => localStorage.setItem(k, defaults[k]));
    ['ln_kop_image', 'ln_ttd_image', 'ln_ttd_tu_image', 'ln_kepsek_name', 'ln_tu_name'].forEach(k => localStorage.removeItem(k));

    setWaTemplate(defaults.ln_wa_template);
    setLetterBody(defaults.ln_letter_body);
    setLetterNumber(defaults.ln_letter_number);
    setKopImage('');
    setTtdImage('');
    setTtdTuImage('');
    setKepsekName('');
    setTuName('');
  };

  return (
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);

  const getWAPreview = () => {
    const rincian = "1. SPP (Mei 2026): Rp 500.000%0A2. Buku: Rp 200.000";
    const total = "Rp 700.000";
    return waTemplate
      .replace('{nama}', 'Ahmad Fauzi')
      .replace('{rincian}', decodeURIComponent(rincian))
      .replace('{total}', total)
      .replace(/%0A/g, '\n');
  };

  return (
    <div className="settings-container">
      <style>{`
        .settings-container {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 1100px) {
          .settings-container { grid-template-columns: 1fr; }
        }
        .preview-sticky {
          position: sticky;
          top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .wa-preview {
          background: #075e54;
          border-radius: 1rem;
          padding: 1rem;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 100%;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .wa-bubble {
          background: #dcf8c6;
          color: #333;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border-top-right-radius: 0;
          font-size: 0.85rem;
          line-height: 1.4;
          white-space: pre-wrap;
          position: relative;
        }
        .wa-bubble::after {
          content: '';
          position: absolute;
          top: 0;
          right: -10px;
          border: 10px solid transparent;
          border-left-color: #dcf8c6;
          border-top-color: #dcf8c6;
        }
        .mini-letter {
          background: #fff;
          color: #333;
          padding: 1.5rem;
          border-radius: 4px;
          font-size: 0.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          transform: scale(1);
          transform-origin: top left;
        }
        .mini-letter h4 { font-size: 0.7rem; margin: 0; }
        .mini-letter p { margin: 0.2rem 0; }
        .mini-letter table { width: 100%; border-collapse: collapse; margin: 0.5rem 0; }
        .mini-letter th, .mini-letter td { border: 0.5px solid #ddd; padding: 2px; text-align: left; }
      `}</style>
      
      <div className="settings-form">
      {/* Saved Toast */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600,
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CheckCircle2 size={18} /> Pengaturan berhasil disimpan!
        </motion.div>
      )}

      {/* WhatsApp Template */}
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <div className="panel-header">
          <h3><MessageSquare size={18} /> Template Pesan WhatsApp</h3>
        </div>
        <div className="form-group">
          <label>Template Pesan</label>
          <textarea
            className="form-input"
            value={waTemplate}
            onChange={(e) => setWaTemplate(e.target.value)}
            rows={8}
            style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.6 }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.4rem' }}>
            Tag yang tersedia: <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'{'} nama {'}'}</code>, <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'{'} rincian {'}'}</code>, <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'{'} total {'}'}</code>
          </p>
        </div>
      </motion.div>

      {/* Letter Settings */}
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <div className="panel-header">
          <h3><FileText size={18} /> Pengaturan Surat</h3>
        </div>

        <div className="form-group">
          <label>Nomor Surat (template)</label>
          <input
            className="form-input"
            value={letterNumber}
            onChange={(e) => setLetterNumber(e.target.value)}
            placeholder="024/ADM/AL-FIKRI/{tahun}"
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.3rem' }}>
            Gunakan <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{'{'} tahun {'}'}</code> untuk tahun otomatis
          </p>
        </div>

        <div className="form-group">
          <label>Isi Body Surat</label>
          <textarea
            className="form-input"
            value={letterBody}
            onChange={(e) => setLetterBody(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nama Kepala Sekolah</label>
            <input
              className="form-input"
              value={kepsekName}
              onChange={(e) => setKepsekName(e.target.value)}
              placeholder="Nama lengkap Kepsek"
            />
          </div>
          <div className="form-group">
            <label>Nama Admin TU</label>
            <input
              className="form-input"
              value={tuName}
              onChange={(e) => setTuName(e.target.value)}
              placeholder="Nama lengkap Admin"
            />
          </div>
        </div>
      </motion.div>

      {/* Upload Images */}
      <motion.div
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <div className="panel-header">
          <h3><Image size={18} /> Gambar Kop Surat & Tanda Tangan</h3>
        </div>

        <div className="upload-grid">
          <label className="upload-item">
            <Image size={22} />
            <span>Kop Surat</span>
            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'kop')} />
            {kopImage && <CheckCircle2 size={14} className="check-icon" />}
          </label>
          <label className="upload-item">
            <Image size={22} />
            <span>TTD Kepsek</span>
            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'ttd')} />
            {ttdImage && <CheckCircle2 size={14} className="check-icon" />}
          </label>
          <label className="upload-item">
            <Image size={22} />
            <span>TTD Admin TU</span>
            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'ttdtu')} />
            {ttdTuImage && <CheckCircle2 size={14} className="check-icon" />}
          </label>
        </div>

        {/* Preview uploaded images */}
        {(kopImage || ttdImage || ttdTuImage) && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {kopImage && (
              <div style={{ position: 'relative' }}>
                <img src={kopImage} style={{ height: '60px', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }} alt="Kop" />
                <button
                  onClick={() => setKopImage('')}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}
                >
                  <X size={10} />
                </button>
              </div>
            )}
            {ttdImage && (
              <div style={{ position: 'relative' }}>
                <img src={ttdImage} style={{ height: '60px', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }} alt="TTD Kepsek" />
                <button
                  onClick={() => setTtdImage('')}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={10} />
                </button>
              </div>
            )}
            {ttdTuImage && (
              <div style={{ position: 'relative' }}>
                <img src={ttdTuImage} style={{ height: '60px', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }} alt="TTD TU" />
                <button
                  onClick={() => setTtdTuImage('')}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
          <Save size={18} /> Simpan Semua Pengaturan
        </button>
        <button className="btn btn-danger" onClick={handleReset}>
          <Trash2 size={18} /> Reset Default
        </button>
      </div>

      </div>

      {/* Preview Section */}
      <div className="preview-sticky">
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '-1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={14} /> LIVE PREVIEW WHATSAPP
        </div>
        <div className="wa-preview">
          <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.5rem' }}>SDIT AL FIKRI</div>
          <div className="wa-bubble">
            {getWAPreview()}
            <div style={{ textAlign: 'right', fontSize: '0.6rem', opacity: 0.5, marginTop: '0.2rem' }}>14:30 ✓✓</div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '-1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={14} /> LIVE PREVIEW SURAT
        </div>
        <div className="mini-letter">
          <div style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            {kopImage ? <img src={kopImage} style={{ width: '100%', maxHeight: '30px', objectFit: 'contain' }} alt="Kop" /> : (
              <>
                <h4 style={{ margin: 0 }}>SDIT AL FIKRI</h4>
                <p style={{ fontSize: '0.4rem' }}>Jl. Raya Utama No. 123, Kota Pendidikan</p>
              </>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.45rem' }}>
            <div>
              <p>Nomor: {letterNumber.replace('{tahun}', new Date().getFullYear())}</p>
              <p>Hal: <b>Pemberitahuan Tunggakan</b></p>
            </div>
            <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <p style={{ marginTop: '0.5rem' }}>Yth. Bapak/Ibu Orang Tua dari <b>AHMAD FAUZI</b></p>
          <p style={{ fontSize: '0.45rem', marginTop: '0.5rem' }}>{letterBody}</p>
          <table>
            <thead>
              <tr><th>Jenis</th><th>Bulan</th><th>Nominal</th></tr>
            </thead>
            <tbody>
              <tr><td>SPP</td><td>Mei 2026</td><td>500.000</td></tr>
              <tr><td colSpan="2">TOTAL</td><td><b>500.000</b></td></tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', textAlign: 'center' }}>
            <div>
              <p>Mengetahui,</p>
              <p>KEPALA SEKOLAH</p>
              <div style={{ height: '20px' }}>{ttdImage && <img src={ttdImage} style={{ height: '100%' }} alt="ttd" />}</div>
              <p><b>{kepsekName || '................'}</b></p>
            </div>
            <div>
              <p>Hormat Kami,</p>
              <p>ADMIN TU</p>
              <div style={{ height: '20px' }}>{ttdTuImage && <img src={ttdTuImage} style={{ height: '100%' }} alt="ttd" />}</div>
              <p><b>{tuName || '................'}</b></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pengaturan;
