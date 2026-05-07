-- ============================================
-- Layanan Notifikasi - Supabase Schema
-- Tabel baru dengan prefix notif_ agar tidak
-- bentrok dengan tabel school-finance-app
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabel Siswa
CREATE TABLE IF NOT EXISTS notif_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    nis TEXT,
    class TEXT NOT NULL,
    parent_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Item Tunggakan
CREATE TABLE IF NOT EXISTS notif_arrears (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES notif_students(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL,
    month TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Log Notifikasi
CREATE TABLE IF NOT EXISTS notif_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES notif_students(id) ON DELETE CASCADE,
    student_name TEXT,
    type TEXT NOT NULL,
    total_amount DECIMAL(12,2),
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notif_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_arrears ENABLE ROW LEVEL SECURITY;
ALTER TABLE notif_logs ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for simplicity)
CREATE POLICY "Allow all notif_students" ON notif_students FOR ALL USING (true);
CREATE POLICY "Allow all notif_arrears" ON notif_arrears FOR ALL USING (true);
CREATE POLICY "Allow all notif_logs" ON notif_logs FOR ALL USING (true);
