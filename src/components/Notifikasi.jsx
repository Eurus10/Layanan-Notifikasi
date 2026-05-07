import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, FileText, Search, Download, Printer,
  X, CheckCircle2, Phone, Send, FileDown, FileUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const Notifikasi = () => {
  const [students, setStudents] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showLetterModal, setShowLetterModal] = useState(null);
  const letterRef = useRef(null);

  // Settings from localStorage
  const getSettings = () => ({
    waTemplate: localStorage.getItem('ln_wa_template') ||
      "Halo Bapak/Ibu Orang Tua dari *{nama}*,%0A%0AMohon maaf mengganggu waktunya. Kami dari Administrasi SDIT AL FIKRI ingin menginformasikan rincian tunggakan biaya sekolah sebagai berikut:%0A%0A{rincian}%0A%0A*Total Tunggakan: {total}*%0A%0AMohon segera melakukan pembayaran. Terima kasih.",
    letterBody: localStorage.getItem('ln_letter_body') ||
      "Dengan hormat, kami mendoakan semoga Bapak/Ibu senantiasa berada dalam lindungan Allah SWT. Melalui surat ini, kami bermaksud menginformasikan rincian tunggakan biaya sekolah putra/putri Bapak/Ibu yang sampai saat ini belum terselesaikan, dengan rincian sebagai berikut:",
    kopImage: localStorage.getItem('ln_kop_image') || '',
    ttdImage: localStorage.getItem('ln_ttd_image') || '',
    ttdTuImage: localStorage.getItem('ln_ttd_tu_image') || '',
    letterNumber: localStorage.getItem('ln_letter_number') || '024/ADM/AL-FIKRI/{tahun}',
    kepsekName: localStorage.getItem('ln_kepsek_name') || '',
    tuName: localStorage.getItem('ln_tu_name') || ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: std }, { data: arr }] = await Promise.all([
      supabase.from('notif_students').select('*').order('class').order('name'),
      supabase.from('notif_arrears').select('*').eq('is_paid', false)
    ]);
    setStudents(std || []);
    setArrears(arr || []);
    setLoading(false);
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);

  // Group arrears by student
  const studentArrearsMap = {};
  arrears.forEach(a => {
    if (!studentArrearsMap[a.student_id]) studentArrearsMap[a.student_id] = [];
    studentArrearsMap[a.student_id].push(a);
  });

  // Only show students with unpaid arrears
  const studentsWithArrears = students.filter(s => {
    const items = studentArrearsMap[s.id];
    return items && items.length > 0;
  });

  const classes = [...new Set(studentsWithArrears.map(s => s.class))].sort();

  const filtered = studentsWithArrears.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = !filterClass || s.class === filterClass;
    return matchSearch && matchClass;
  });

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(s => s.id)));
    }
  };

  const handleSendWA = async (student) => {
    const items = studentArrearsMap[student.id] || [];
    if (items.length === 0) return;
    if (!student.parent_phone) {
      alert('Nomor WhatsApp belum diisi untuk siswa ini.');
      return;
    }

    const settings = getSettings();
    const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const rincian = items.map((item, idx) =>
      `${idx + 1}. ${item.payment_type} (${item.month}): ${formatIDR(item.amount)}`
    ).join('%0A');

    const msg = settings.waTemplate
      .replace('{nama}', student.name)
      .replace('{rincian}', rincian)
      .replace('{total}', formatIDR(total));

    const cleanPhone = student.parent_phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');

    // Log notification
    await supabase.from('notif_logs').insert([{
      student_id: student.id,
      student_name: student.name,
      type: 'whatsapp',
      total_amount: total
    }]);
  };

  const handleBulkWA = () => {
    const selectedStudents = filtered.filter(s => selected.has(s.id));
    if (selectedStudents.length === 0) {
      alert('Pilih minimal 1 siswa.');
      return;
    }

    selectedStudents.forEach((s, i) => {
      setTimeout(() => handleSendWA(s), i * 1000);
    });
  };

  const handleShowLetter = (student) => {
    setShowLetterModal(student);
  };

  const handleDownloadPDF = async (student) => {
    const items = studentArrearsMap[student.id] || [];
    const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    // Dynamic import html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('printable-letter');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Surat_Tunggakan_${student.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();

    // Log
    await supabase.from('notif_logs').insert([{
      student_id: student.id,
      student_name: student.name,
      type: 'letter_pdf',
      total_amount: total
    }]);
  };

  const handleDownloadWord = async (student) => {
    const items = studentArrearsMap[student.id] || [];
    const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const settings = getSettings();

    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import('docx');

    const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
    const cellBorders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, right: 1440, left: 1440 }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'YAYASAN AL FIKRI SEJAHTERA', bold: true, size: 28 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'SDIT AL FIKRI', bold: true, size: 36 })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Jl. Raya Utama No. 123, Kota Pendidikan', size: 20 })]
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: '_______________________________________________________________', size: 20 })]
          }),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Nomor : ', size: 22 }),
              new TextRun({ text: settings.letterNumber.replace('{tahun}', new Date().getFullYear()), size: 22 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Hal : ', size: 22 }),
              new TextRun({ text: 'Pemberitahuan Tunggakan Biaya Sekolah', bold: true, size: 22 })
            ]
          }),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          new Paragraph({
            children: [new TextRun({ text: 'Yth. Bapak/Ibu Orang Tua/Wali Murid dari:', size: 22 })]
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: `Nama : ${student.name}`, bold: true, size: 24 })
            ]
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `Kelas : ${student.class}`, size: 22 })]
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: "Assalamu'alaikum Warahmatullahi Wabarakatuh,", size: 22 })]
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: settings.letterBody, size: 22 })]
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'No', bold: true, size: 20 })] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Jenis Tagihan', bold: true, size: 20 })] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Periode', bold: true, size: 20 })] })] }),
                  new TableCell({ borders: cellBorders, width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Nominal', bold: true, size: 20 })] })] }),
                ]
              }),
              ...items.map((item, idx) =>
                new TableRow({
                  children: [
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: item.payment_type, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: item.month, size: 20 })] })] }),
                    new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIDR(item.amount), size: 20 })] })] }),
                  ]
                })
              ),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TOTAL TAGIHAN', bold: true, size: 20 })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatIDR(total), bold: true, size: 20 })] })] }),
                ]
              })
            ]
          }),
          new Paragraph({ spacing: { before: 200, after: 200 }, children: [new TextRun({ text: 'Demikian surat ini kami sampaikan. Atas perhatiannya, kami ucapkan terima kasih.', size: 22 })] }),
          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: `Mengetahui,`, size: 22 }),
              new TextRun({ text: '                                                              ', size: 22 }),
              new TextRun({ text: 'Hormat Kami,', size: 22 }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'KEPALA SEKOLAH', bold: true, size: 22 }),
              new TextRun({ text: '                                                        ', size: 22 }),
              new TextRun({ text: 'ADMIN TATA USAHA', bold: true, size: 22 }),
            ]
          }),
          new Paragraph({ spacing: { after: 600 }, children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: settings.kepsekName || '( .................................... )', bold: true, underline: {}, size: 22 }),
              new TextRun({ text: '                                       ', size: 22 }),
              new TextRun({ text: settings.tuName || '( .................................... )', bold: true, underline: {}, size: 22 }),
            ]
          }),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surat_Tunggakan_${student.name.replace(/\s+/g, '_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);

    // Log
    await supabase.from('notif_logs').insert([{
      student_id: student.id,
      student_name: student.name,
      type: 'letter_word',
      total_amount: total
    }]);
  };

  const settings = getSettings();

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={16} color="var(--text-subtle)" />
            <input placeholder="Cari nama siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {classes.length > 0 && (
            <div className="filter-chips">
              <div className={`chip ${!filterClass ? 'active' : ''}`} onClick={() => setFilterClass('')}>Semua</div>
              {classes.map(cls => (
                <div key={cls} className={`chip ${filterClass === cls ? 'active' : ''}`} onClick={() => setFilterClass(cls)}>{cls}</div>
              ))}
            </div>
          )}
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-outline btn-sm" onClick={selectAll}>
            <CheckCircle2 size={16} />
            {selected.size === filtered.length && filtered.length > 0 ? 'Batal Pilih' : `Pilih Semua (${filtered.length})`}
          </button>
          <button
            className="btn btn-wa btn-sm"
            onClick={handleBulkWA}
            disabled={selected.size === 0}
          >
            <Send size={16} /> Kirim WA ({selected.size})
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Siswa</th>
              <th>Rincian Tunggakan</th>
              <th>Total</th>
              <th>No. WA</th>
              <th style={{ width: '180px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(student => {
              const items = studentArrearsMap[student.id] || [];
              const total = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

              return (
                <tr key={student.id}>
                  <td>
                    <div
                      className={`custom-checkbox ${selected.has(student.id) ? 'checked' : ''}`}
                      onClick={() => toggleSelect(student.id)}
                    >
                      {selected.has(student.id) && <CheckCircle2 size={12} color="#fff" />}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{student.name}</div>
                    <span className="badge badge-info" style={{ marginTop: '0.2rem' }}>{student.class}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {items.map(item => (
                        <div key={item.id} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{item.payment_type} — {item.month}</span>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-red)' }}>{formatIDR(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--accent-orange)' }}>
                      {formatIDR(total)}
                    </span>
                  </td>
                  <td>
                    {student.parent_phone ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Phone size={13} /> {student.parent_phone}
                      </span>
                    ) : (
                      <span className="badge badge-warning">Belum diisi</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-wa btn-sm"
                        onClick={() => handleSendWA(student)}
                        disabled={!student.parent_phone}
                        title="Kirim WhatsApp"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <MessageSquare size={13} /> WA
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleShowLetter(student)}
                        title="Preview Surat"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        <FileText size={13} /> Surat
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <MessageSquare size={48} />
                    <p>{loading ? 'Memuat data...' : 'Belum ada siswa yang memiliki tunggakan aktif.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        {filtered.length} siswa dengan tunggakan aktif {selected.size > 0 && `• ${selected.size} terpilih`}
      </div>

      {/* Letter Preview Modal */}
      <AnimatePresence>
        {showLetterModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-card-large"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
            >
              <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700 }}>Preview Surat — {showLetterModal.name}</h3>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDownloadPDF(showLetterModal)}>
                    <Download size={15} /> PDF
                  </button>
                  <button className="btn btn-success btn-sm" onClick={() => handleDownloadWord(showLetterModal)}>
                    <FileUp size={15} /> Word
                  </button>
                  <button className="modal-close" onClick={() => setShowLetterModal(null)}><X size={16} /></button>
                </div>
              </div>

              <div className="letter-preview-container">
                <div id="printable-letter" ref={letterRef} className="a4-page">
                  {/* Kop Surat */}
                  <div className="letter-kop">
                    {settings.kopImage ? (
                      <img src={settings.kopImage} alt="Kop Surat" />
                    ) : (
                      <div className="letter-kop-default">
                        <h2>YAYASAN AL FIKRI SEJAHTERA</h2>
                        <h1>SDIT AL FIKRI</h1>
                        <p>Jl. Raya Utama No. 123, Kota Pendidikan • Telp: (021) 12345678</p>
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="letter-meta">
                    <div>
                      <p>Nomor : {settings.letterNumber.replace('{tahun}', new Date().getFullYear())}</p>
                      <p>Hal : <b>Pemberitahuan Tunggakan Biaya Sekolah</b></p>
                    </div>
                    <div>
                      <p>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="letter-recipient">
                    <p>Yth. Bapak/Ibu Orang Tua/Wali Murid dari:</p>
                    <p className="student-highlight">{showLetterModal.name.toUpperCase()}</p>
                    <p>Kelas: {showLetterModal.class}</p>
                  </div>

                  {/* Body */}
                  <div className="letter-body">
                    <p>Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
                    <p style={{ marginTop: '4mm' }}>{settings.letterBody}</p>

                    <table className="letter-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center' }}>No</th>
                          <th>Jenis Tagihan</th>
                          <th>Periode</th>
                          <th style={{ textAlign: 'right' }}>Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(studentArrearsMap[showLetterModal.id] || []).map((item, idx) => (
                          <tr key={item.id}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td>{item.payment_type}</td>
                            <td>{item.month}</td>
                            <td style={{ textAlign: 'right' }}>{formatIDR(item.amount)}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="3" style={{ textAlign: 'center' }}>TOTAL TAGIHAN</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatIDR((studentArrearsMap[showLetterModal.id] || []).reduce((sum, i) => sum + Number(i.amount || 0), 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p>Demikian surat ini kami sampaikan. Atas perhatiannya, kami ucapkan terima kasih.</p>
                  </div>

                  {/* Signatures */}
                  <div className="letter-signatures">
                    <div className="sig-block">
                      <p>Mengetahui,</p>
                      <p className="sig-title">KEPALA SEKOLAH</p>
                      <div className="sig-space">
                        {settings.ttdImage && <img src={settings.ttdImage} alt="TTD Kepsek" />}
                      </div>
                      <p className="sig-name">{settings.kepsekName || '( .................................... )'}</p>
                    </div>
                    <div className="sig-block">
                      <p>Hormat Kami,</p>
                      <p className="sig-title">ADMIN TATA USAHA</p>
                      <div className="sig-space">
                        {settings.ttdTuImage && <img src={settings.ttdTuImage} alt="TTD TU" />}
                      </div>
                      <p className="sig-name">{settings.tuName || '( .................................... )'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifikasi;
