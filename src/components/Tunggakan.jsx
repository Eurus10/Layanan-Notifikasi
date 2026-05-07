import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, X, Save, UploadCloud, FileDown,
  AlertCircle, CheckCircle2, Filter, Edit2
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
  const [newItems, setNewItems] = useState([{ payment_type: '', month: '', amount: '' }]);
  const [editingArrear, setEditingArrear] = useState(null);
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

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

  const handleSaveArrear = async () => {
    if (!selectedStudent) return alert('Pilih siswa terlebih dahulu.');

    if (editingArrear) {
      const item = newItems[0];
      if (!item.payment_type || !item.month || !item.amount) return alert('Semua field wajib diisi.');

      const { error } = await supabase
        .from('notif_arrears')
        .update({
          payment_type: item.payment_type,
          month: item.month,
          amount: Number(item.amount)
        })
        .eq('id', editingArrear.id);
      
      if (error) return alert('Gagal update: ' + error.message);
    } else {
      const validItems = newItems.filter(i => i.payment_type && i.month && i.amount);
      if (validItems.length === 0) return alert('Tambahkan minimal 1 item yang lengkap.');

      const { error } = await supabase.from('notif_arrears').insert(
        validItems.map(item => ({
          student_id: selectedStudent,
          payment_type: item.payment_type,
          month: item.month,
          amount: Number(item.amount),
          is_paid: false
        }))
      );

      if (error) return alert('Gagal menambah: ' + error.message);
    }

    setNewItems([{ payment_type: '', month: '', amount: '' }]);
    setEditingArrear(null);
    setShowAddModal(false);
    fetchData();
  };

  const handleAddNewItem = () => {
    setNewItems([...newItems, { payment_type: '', month: '', amount: '' }]);
  };

  const handleRemoveNewItem = (idx) => {
    if (newItems.length === 1) return;
    const next = [...newItems];
    next.splice(idx, 1);
    setNewItems(next);
  };

  const handleEditArrear = (item) => {
    setEditingArrear(item);
    setSelectedStudent(item.student_id);
    setNewItems([{
      payment_type: item.payment_type,
      month: item.month,
      amount: item.amount
    }]);
    setShowAddModal(true);
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
        const normalizedName = studentName.toLowerCase();
        
        if (studentClass) {
          const normalizedClass = studentClass.toLowerCase();
          match = students.find(s => 
            s.name.toLowerCase().trim() === normalizedName && 
            (s.class || '').toLowerCase().trim() === normalizedClass
          );
        } else {
          match = students.find(s => s.name.toLowerCase().trim() === normalizedName);
        }
        
        if (!match) { 
          console.warn(`Skipped: Siswa tidak ditemukan -> Nama: "${studentName}", Kelas: "${studentClass || '-'}"`);
          skipped++; 
          continue; 
        }

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

  const handleExportRecap = () => {
    const data = [];
    filteredStudents.forEach(student => {
      const items = studentArrearsMap[student.id] || [];
      items.forEach(item => {
        data.push({
          Nama: student.name,
          Kelas: student.class,
          NIS: student.nis || '-',
          Jenis_Tagihan: item.payment_type,
          Periode: item.month,
          Nominal: item.amount,
          Status: item.is_paid ? 'Lunas' : 'Belum Lunas'
        });
      });
    });

    if (data.length === 0) return alert('Tidak ada data untuk diekspor.');

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Tunggakan');
    const filename = `Rekap_Tunggakan_${filterClass || 'Semua'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
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

    // Filter logic: By default (no filterStatus), only show students with ANY arrears
    if (!filterStatus) {
      if (!hasAnyArrears) return false;
    } else {
      if (filterStatus === 'unpaid' && !hasUnpaid) return false;
      if (filterStatus === 'paid' && hasUnpaid) return false;
      if (filterStatus === 'none' && hasAnyArrears) return false;
    }

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
          <button onClick={handleExportRecap} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}><FileUp size={16} /> Rekap Excel</button>
          <button onClick={downloadTemplate} className="btn btn-outline btn-sm"><FileDown size={16} /> Template</button>
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            <UploadCloud size={16} /> Impor Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
          </label>
          <button onClick={() => { setEditingArrear(null); setSelectedStudent(''); setNewItems([{ payment_type: '', month: '', amount: '' }]); setShowAddModal(true); }} className="btn btn-primary btn-sm"><Plus size={16} /> Tambah Tunggakan</button>
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
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-icon btn-outline" onClick={() => handleEditArrear(item)} title="Edit">
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-icon btn-danger" onClick={() => deleteArrear(item.id)} title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
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
                <h3>{editingArrear ? 'Edit Tunggakan' : 'Tambah Tunggakan'}</h3>
                <button className="modal-close" onClick={() => { setShowAddModal(false); setEditingArrear(null); }}><X size={16} /></button>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Pilih Siswa *</label>
                {editingArrear ? (
                  <div className="form-input" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    {students.find(s => s.id === selectedStudent)?.name}
                  </div>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        placeholder="Ketik nama siswa..."
                        value={selectedStudent ? (students.find(s => s.id === selectedStudent)?.name || '') : studentSearchInput}
                        onChange={(e) => {
                          if (selectedStudent) setSelectedStudent('');
                          setStudentSearchInput(e.target.value);
                          setShowStudentDropdown(true);
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                      />
                      {selectedStudent && (
                        <button 
                          onClick={() => { setSelectedStudent(''); setStudentSearchInput(''); }}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {showStudentDropdown && !selectedStudent && (
                        <motion.div 
                          className="glass-panel"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            zIndex: 100, 
                            maxHeight: '200px', 
                            overflowY: 'auto',
                            marginTop: '4px',
                            padding: '0.5rem',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                          }}
                        >
                          {students.filter(s => s.name.toLowerCase().includes(studentSearchInput.toLowerCase())).length > 0 ? (
                            students
                              .filter(s => s.name.toLowerCase().includes(studentSearchInput.toLowerCase()))
                              .slice(0, 50)
                              .map(s => (
                                <div 
                                  key={s.id} 
                                  className="list-item" 
                                  style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', borderRadius: '4px' }}
                                  onClick={() => {
                                    setSelectedStudent(s.id);
                                    setStudentSearchInput(s.name);
                                    setShowStudentDropdown(false);
                                  }}
                                >
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.name}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{s.class}</div>
                                </div>
                              ))
                          ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.8rem' }}>Siswa tidak ditemukan.</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>Rincian Tunggakan</label>
                {!editingArrear && (
                  <button className="btn btn-outline btn-sm" onClick={handleAddNewItem} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                    <Plus size={14} /> Tambah Item
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {newItems.map((item, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                    {!editingArrear && newItems.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                        <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleRemoveNewItem(idx)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.75rem' }}>Jenis Tagihan *</label>
                      <input
                        className="form-input form-input-sm"
                        placeholder="SPP, Kegiatan, dll"
                        value={item.payment_type}
                        onChange={(e) => {
                          const next = [...newItems];
                          next[idx].payment_type = e.target.value;
                          setNewItems(next);
                        }}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>Bulan / Ket *</label>
                        <input
                          className="form-input form-input-sm"
                          placeholder="Mei 2026, dll"
                          value={item.month}
                          onChange={(e) => {
                            const next = [...newItems];
                            next[idx].month = e.target.value;
                            setNewItems(next);
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>Nominal *</label>
                        <input
                          type="number"
                          className="form-input form-input-sm"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => {
                            const next = [...newItems];
                            next[idx].amount = e.target.value;
                            setNewItems(next);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => { setShowAddModal(false); setEditingArrear(null); }}>Batal</button>
                <button className="btn btn-primary" onClick={handleSaveArrear}>
                  <Save size={16} /> {editingArrear ? 'Simpan Perubahan' : 'Tambah Tunggakan'}
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
