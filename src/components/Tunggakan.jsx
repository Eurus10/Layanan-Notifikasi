import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, X, Save, UploadCloud, FileDown,
  AlertCircle, CheckCircle2, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const Tunggakan = () => {
  const [students, setStudents] = useState([]);
  const [arrears, setArrears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [newItem, setNewItem] = useState({ payment_type: '', month: '', amount: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: std }, { data: arr }] = await Promise.all([
      supabase.from('notif_students').select('*').order('class').order('name'),
      supabase.from('notif_arrears').select('*').order('created_at', { ascending: false })
    ]);
    setStudents(std || []);
    setArrears(arr || []);
    setLoading(false);
  };

  const handleAddArrear = async () => {
    if (!selectedStudent || !newItem.payment_type || !newItem.month || !newItem.amount) {
      alert('Semua field wajib diisi.');
      return;
    }

    const { error } = await supabase.from('notif_arrears').insert([{
      student_id: selectedStudent,
      payment_type: newItem.payment_type,
      month: newItem.month,
      amount: Number(newItem.amount),
      is_paid: false
    }]);

    if (error) return alert('Gagal menambah: ' + error.message);

    setNewItem({ payment_type: '', month: '', amount: '' });
    setShowAddModal(false);
    fetchData();
  };

  const togglePaid = async (arrearId, currentStatus) => {
    const { error } = await supabase
      .from('notif_arrears')
      .update({ is_paid: !currentStatus })
      .eq('id', arrearId);
    if (error) alert('Gagal update: ' + error.message);
    else fetchData();
  };

  const deleteArrear = async (id) => {
    if (!confirm('Hapus item tunggakan ini?')) return;
    const { error } = await supabase.from('notif_arrears').delete().eq('id', id);
    if (error) alert('Gagal hapus: ' + error.message);
    else fetchData();
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(ws);

      let imported = 0;
      let skipped = 0;

      for (const row of rawData) {
        const studentName = row.Nama?.toString().trim();
        const studentClass = row.Kelas?.toString().trim();
        if (!studentName) { skipped++; continue; }

        let match;
        if (studentClass) {
          match = students.find(s => s.name.toLowerCase().trim() === studentName.toLowerCase() && s.class === studentClass);
        } else {
          match = students.find(s => s.name.toLowerCase().trim() === studentName.toLowerCase());
        }
        
        if (!match) { skipped++; continue; }

        const { error } = await supabase.from('notif_arrears').insert([{
          student_id: match.id,
          payment_type: row.Jenis?.toString().trim() || 'SPP',
          month: row.Bulan?.toString().trim() || '-',
          amount: Number(row.Nominal) || 0,
          is_paid: false
        }]);

        if (!error) imported++;
        else skipped++;
      }

      alert(`Berhasil import ${imported} item tunggakan. ${skipped > 0 ? `${skipped} baris dilewati (nama/kelas tidak ditemukan).` : ''}`);
      fetchData();
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama: 'Ahmad Fauzi', Kelas: '1A', Jenis: 'SPP', Bulan: 'Mei 2026', Nominal: 500000 },
      { Nama: 'Ahmad Fauzi', Kelas: '1A', Jenis: 'Kegiatan', Bulan: 'Semester 1', Nominal: 200000 },
      { Nama: 'Siti Aminah', Kelas: '2B', Jenis: 'SPP', Bulan: 'Mei 2026', Nominal: 500000 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tunggakan');
    XLSX.writeFile(wb, 'Template_Tunggakan.xlsx');
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0
  }).format(num);

  // Group arrears by student
  const studentArrearsMap = {};
  arrears.forEach(a => {
    if (!studentArrearsMap[a.student_id]) {
      studentArrearsMap[a.student_id] = [];
    }
    studentArrearsMap[a.student_id].push(a);
  });

  const classes = [...new Set(students.map(s => s.class))].sort();

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = !filterClass || s.class === filterClass;

    const studentArrears = studentArrearsMap[s.id] || [];
    const hasUnpaid = studentArrears.some(a => !a.is_paid);
    const hasAnyArrears = studentArrears.length > 0;

    if (filterStatus === 'unpaid' && !hasUnpaid) return false;
    if (filterStatus === 'paid' && hasUnpaid) return false;
    if (filterStatus === 'none' && hasAnyArrears) return false;

    return matchSearch && matchClass;
  });

  const totalUnpaid = arrears.filter(a => !a.is_paid).reduce((sum, a) => sum + Number(a.amount || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1rem 1.5rem' }}>
          <p className="stat-label">Total Item Tunggakan</p>
          <p className="stat-value" style={{ fontSize: '1.5rem' }}>{arrears.filter(a => !a.is_paid).length}</p>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.5rem' }}>
          <p className="stat-label">Total Nominal Belum Lunas</p>
          <p className="stat-value" style={{ fontSize: '1.3rem', color: 'var(--accent-red)' }}>{formatIDR(totalUnpaid)}</p>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.5rem' }}>
          <p className="stat-label">Siswa Menunggak</p>
          <p className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-orange)' }}>
            {new Set(arrears.filter(a => !a.is_paid).map(a => a.student_id)).size}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-bar">
            <Search size={16} color="var(--text-subtle)" />
            <input placeholder="Cari nama siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="filter-chips">
            <div className={`chip ${!filterClass ? 'active' : ''}`} onClick={() => setFilterClass('')}>Semua Kelas</div>
            {classes.map(cls => (
              <div key={cls} className={`chip ${filterClass === cls ? 'active' : ''}`} onClick={() => setFilterClass(cls)}>{cls}</div>
            ))}
          </div>
        </div>
        <div className="toolbar-actions">
          <div className="filter-chips">
            <div className={`chip ${!filterStatus ? 'active' : ''}`} onClick={() => setFilterStatus('')}>Semua Status</div>
            <div className={`chip ${filterStatus === 'unpaid' ? 'active' : ''}`} onClick={() => setFilterStatus('unpaid')}>Belum Lunas</div>
            <div className={`chip ${filterStatus === 'paid' ? 'active' : ''}`} onClick={() => setFilterStatus('paid')}>Lunas</div>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: '1rem' }}>
        <div></div>
        <div className="toolbar-actions">
          <button onClick={downloadTemplate} className="btn btn-outline btn-sm"><FileDown size={16} /> Template</button>
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            <UploadCloud size={16} /> Impor Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
          </label>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm"><Plus size={16} /> Tambah Tunggakan</button>
        </div>
      </div>

      {/* Student Arrears List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredStudents.length > 0 ? filteredStudents.map(student => {
          const items = studentArrearsMap[student.id] || [];
          if (items.length === 0 && filterStatus) return null;

          const unpaidItems = items.filter(a => !a.is_paid);
          const totalUnpaidStudent = unpaidItems.reduce((sum, a) => sum + Number(a.amount || 0), 0);

          return (
            <motion.div
              key={student.id}
              className="glass-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 ? '1rem' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{student.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                      <span className="badge badge-info">{student.class}</span>
                      {student.nis && <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontFamily: 'monospace' }}>NIS: {student.nis}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {unpaidItems.length > 0 ? (
                    <>
                      <span className="badge badge-danger">Menunggak</span>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '0.25rem' }}>
                        {formatIDR(totalUnpaidStudent)}
                      </p>
                    </>
                  ) : items.length > 0 ? (
                    <span className="badge badge-success">Lunas</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Belum ada data</span>
                  )}
                </div>
              </div>

              {items.length > 0 && (
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Jenis Tagihan</th>
                      <th>Bulan / Keterangan</th>
                      <th>Nominal</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '80px' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.payment_type}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.month}</td>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace', color: item.is_paid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {formatIDR(item.amount)}
                        </td>
                        <td>
                          <div
                            onClick={() => togglePaid(item.id, item.is_paid)}
                            style={{ cursor: 'pointer', display: 'inline-flex' }}
                          >
                            {item.is_paid ? (
                              <span className="badge badge-success" style={{ cursor: 'pointer' }}>
                                <CheckCircle2 size={12} style={{ marginRight: '0.3rem' }} /> Lunas
                              </span>
                            ) : (
                              <span className="badge badge-danger" style={{ cursor: 'pointer' }}>
                                <AlertCircle size={12} style={{ marginRight: '0.3rem' }} /> Belum
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-icon btn-danger" onClick={() => deleteArrear(item.id)} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          );
        }).filter(Boolean) : (
          <div className="glass-panel">
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>{loading ? 'Memuat data...' : 'Belum ada data tunggakan.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Arrear Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="modal-header">
                <h3>Tambah Tunggakan</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={16} /></button>
              </div>

              <div className="form-group">
                <label>Pilih Siswa *</label>
                <select className="form-input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  <option value="">-- Pilih Siswa --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Jenis Tagihan *</label>
                <input
                  className="form-input"
                  placeholder="SPP, Kegiatan, Buku, dll"
                  value={newItem.payment_type}
                  onChange={(e) => setNewItem({ ...newItem, payment_type: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bulan / Keterangan *</label>
                  <input
                    className="form-input"
                    placeholder="Mei 2026, Semester 1, dll"
                    value={newItem.month}
                    onChange={(e) => setNewItem({ ...newItem, month: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nominal (Rp) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="500000"
                    value={newItem.amount}
                    onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleAddArrear}>
                  <Save size={16} /> Tambah Tunggakan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tunggakan;
