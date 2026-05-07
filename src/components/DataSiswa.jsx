import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Save, UploadCloud, Download, FileDown, Users, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const DataSiswa = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({ name: '', nis: '', class: '', parent_phone: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notif_students')
      .select('*')
      .order('class')
      .order('name');
    if (!error) setStudents(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.class.trim()) {
      alert('Nama dan Kelas wajib diisi.');
      return;
    }

    if (editingStudent) {
      const { error } = await supabase
        .from('notif_students')
        .update(form)
        .eq('id', editingStudent.id);
      if (error) return alert('Gagal update: ' + error.message);
    } else {
      const { error } = await supabase
        .from('notif_students')
        .insert([form]);
      if (error) return alert('Gagal tambah: ' + error.message);
    }

    setShowModal(false);
    setEditingStudent(null);
    setForm({ name: '', nis: '', class: '', parent_phone: '' });
    fetchStudents();
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      nis: student.nis || '',
      class: student.class,
      parent_phone: student.parent_phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus siswa ini beserta semua data tunggakannya?')) return;
    const { error } = await supabase.from('notif_students').delete().eq('id', id);
    if (error) alert('Gagal hapus: ' + error.message);
    else fetchStudents();
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(ws);

      const newStudents = rawData.map(row => ({
        name: row.Nama?.toString().trim() || '',
        nis: row.NIS?.toString().trim() || '',
        class: row.Kelas?.toString().trim() || '',
        parent_phone: (row.NoHP || row.WhatsApp || row['No HP'] || '').toString().trim()
      })).filter(s => s.name && s.class);

      if (newStudents.length === 0) {
        alert('Tidak ada data valid ditemukan. Pastikan kolom: Nama, Kelas, NIS (opsional), NoHP (opsional).');
        return;
      }

      const { error } = await supabase.from('notif_students').insert(newStudents);
      if (error) alert('Gagal import: ' + error.message);
      else {
        alert(`${newStudents.length} siswa berhasil diimpor!`);
        fetchStudents();
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama: 'Ahmad Fauzi', NIS: '2024001', Kelas: '1A', NoHP: '08123456789' },
      { Nama: 'Siti Aminah', NIS: '2024002', Kelas: '1B', NoHP: '08987654321' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
    XLSX.writeFile(wb, 'Template_Data_Siswa.xlsx');
  };

  const classes = [...new Set(students.map(s => s.class))].sort();

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.nis || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = !filterClass || s.class === filterClass;
    return matchSearch && matchClass;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <Search size={16} color="var(--text-subtle)" />
            <input
              placeholder="Cari nama atau NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {classes.length > 0 && (
            <div className="filter-chips">
              <div className={`chip ${!filterClass ? 'active' : ''}`} onClick={() => setFilterClass('')}>Semua</div>
              {classes.map(cls => (
                <div key={cls} className={`chip ${filterClass === cls ? 'active' : ''}`} onClick={() => setFilterClass(cls)}>
                  {cls}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="toolbar-actions">
          <button onClick={downloadTemplate} className="btn btn-outline btn-sm">
            <FileDown size={16} /> Template
          </button>
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            <UploadCloud size={16} /> Impor Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleImportExcel} />
          </label>
          <button onClick={() => { setEditingStudent(null); setForm({ name: '', nis: '', class: '', parent_phone: '' }); setShowModal(true); }} className="btn btn-primary btn-sm">
            <Plus size={16} /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>No</th>
              <th>Nama Siswa</th>
              <th>NIS</th>
              <th>Kelas</th>
              <th>No. HP Wali</th>
              <th style={{ width: '100px' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((student, idx) => (
              <tr key={student.id}>
                <td style={{ color: 'var(--text-subtle)' }}>{idx + 1}</td>
                <td style={{ fontWeight: 600 }}>{student.name}</td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{student.nis || '-'}</td>
                <td><span className="badge badge-info">{student.class}</span></td>
                <td>
                  {student.parent_phone ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                      <Phone size={13} /> {student.parent_phone}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-subtle)' }}>-</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-icon btn-outline" onClick={() => handleEdit(student)} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-icon btn-danger" onClick={() => handleDelete(student.id)} title="Hapus">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <Users size={48} />
                    <p>{loading ? 'Memuat data...' : 'Belum ada data siswa. Silakan tambah manual atau impor dari Excel.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
        Menampilkan <strong style={{ color: 'var(--text-muted)' }}>{filtered.length}</strong> dari {students.length} siswa
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <h3>{editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
              </div>

              <div className="form-group">
                <label>Nama Lengkap *</label>
                <input
                  className="form-input"
                  placeholder="Masukkan nama siswa"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>NIS</label>
                  <input
                    className="form-input"
                    placeholder="Nomor Induk Siswa"
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Kelas *</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: 1A"
                    value={form.class}
                    onChange={(e) => setForm({ ...form, class: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>No. HP Wali Murid</label>
                <input
                  className="form-input"
                  placeholder="08xxxxxxxxxx"
                  value={form.parent_phone}
                  onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Batal</button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <Save size={16} /> {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataSiswa;
