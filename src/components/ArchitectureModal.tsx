import React, { useState } from 'react';
import { Layers, Database, Code2, Server, Check, Copy, X, Shield, Cpu, Lock } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'ddl_sql' | 'guide'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlDDLCode = `-- ========================================================
-- SKEMA BASIS DATA APLIKASI KASIR & POS MULTI-LAYANAN JU-FAT CELL
-- DBMS: PostgreSQL 15+ / MySQL 8.0+
-- Standard Enterprise POS Architecture with RBAC & Cash Ledger
-- ========================================================

-- 1. Tabel Users & Hak Akses (Role Management)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'shift1', 'shift2')),
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Sesi Kerja Kasir (Shift Sessions & Cash Drawer)
CREATE TABLE shift_sessions (
    id VARCHAR(36) PRIMARY KEY,
    shift_name VARCHAR(20) NOT NULL CHECK (shift_name IN ('Shift 1', 'Shift 2')),
    cashier_id VARCHAR(36) REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    initial_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(15, 2),
    cash_difference NUMERIC(15, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    notes TEXT
);

-- 3. Kategori Produk
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL
);

-- 4. Produk ATK & Aksesoris HP (Stok, SKU & Barcode)
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) REFERENCES categories(id),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(64) UNIQUE,
    name VARCHAR(200) NOT NULL,
    cost_price NUMERIC(15, 2) NOT NULL, -- Hanya terlihat oleh role Admin
    selling_price NUMERIC(15, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    unit VARCHAR(30) DEFAULT 'Pcs',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Layanan Service HP
CREATE TABLE phone_services (
    id VARCHAR(36) PRIMARY KEY,
    service_ticket_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    phone_model VARCHAR(150) NOT NULL,
    issue_description TEXT NOT NULL,
    estimated_cost NUMERIC(15, 2) NOT NULL,
    down_payment NUMERIC(15, 2) DEFAULT 0.00,
    final_cost NUMERIC(15, 2) NOT NULL,
    passcode_encrypted TEXT, -- Terenkripsi dengan E2EE AES-256
    status VARCHAR(30) NOT NULL CHECK (status IN ('Diterima', 'Diproses', 'Selesai', 'Diambil', 'Batal')),
    warranty_days INT DEFAULT 7,
    technician_notes TEXT,
    created_by_user_id VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    picked_up_at TIMESTAMP WITH TIME ZONE
);

-- 6. Tabel Layanan PPOB & Pulsa
CREATE TABLE ppob_transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_no VARCHAR(50) UNIQUE NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- Pulsa, Data, PLN, BPJS, E-Wallet, Game
    target_number VARCHAR(100) NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    cost_price NUMERIC(15, 2) NOT NULL, -- Modal PPOB
    selling_price NUMERIC(15, 2) NOT NULL, -- Harga ke konsumen
    profit_margin NUMERIC(15, 2) GENERATED ALWAYS AS (selling_price - cost_price) STORED,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'Sukses',
    shift_session_id VARCHAR(36) REFERENCES shift_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Layanan Percetakan (Print, Jilid, Banner Dinamis)
CREATE TABLE print_orders (
    id VARCHAR(36) PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    print_type VARCHAR(50) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL, -- Lembar / Meter
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Layanan Transfer Bank & Agen (BRILink / E-Wallet)
CREATE TABLE money_transfers (
    id VARCHAR(36) PRIMARY KEY,
    transfer_no VARCHAR(50) UNIQUE NOT NULL,
    transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('Tarik Tunai', 'Setor Tunai', 'Transfer Antar Bank', 'Transfer Sesama Bank', 'Top Up E-Wallet', 'Pembayaran BRIVA/VA')),
    sender_name VARCHAR(150) NOT NULL,
    bank_destination VARCHAR(50) NOT NULL,
    account_number_encrypted TEXT NOT NULL, -- Terenkripsi E2EE
    recipient_name VARCHAR(150) NOT NULL,
    transfer_amount NUMERIC(15, 2) NOT NULL,
    bank_admin_fee NUMERIC(15, 2) DEFAULT 0.00,
    counter_service_fee NUMERIC(15, 2) NOT NULL, -- Biaya Jasa Konter (Laba Bersih Toko)
    total_customer_pay NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Berhasil',
    shift_session_id VARCHAR(36) REFERENCES shift_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Transaksi Penjualan Utama (POS Orders)
CREATE TABLE pos_transactions (
    id VARCHAR(36) PRIMARY KEY,
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(30) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    discount NUMERIC(15, 2) DEFAULT 0.00,
    grand_total NUMERIC(15, 2) NOT NULL,
    total_cost NUMERIC(15, 2) NOT NULL, -- Total modal
    gross_profit NUMERIC(15, 2) GENERATED ALWAYS AS (grand_total - total_cost) STORED,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('Cash', 'Transfer', 'QRIS', 'Hutang')),
    cash_paid NUMERIC(15, 2) DEFAULT 0.00,
    cash_change NUMERIC(15, 2) DEFAULT 0.00,
    customer_name VARCHAR(150),
    cashier_id VARCHAR(36) REFERENCES users(id),
    shift_session_id VARCHAR(36) REFERENCES shift_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Detail Item Penjualan
CREATE TABLE pos_transaction_items (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) REFERENCES pos_transactions(id) ON DELETE CASCADE,
    product_id VARCHAR(36) REFERENCES products(id),
    product_name VARCHAR(200) NOT NULL,
    unit_cost_price NUMERIC(15, 2) NOT NULL,
    unit_selling_price NUMERIC(15, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 11. Buku Piutang & Cicilan Pelanggan (Hutang)
CREATE TABLE customer_debts (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_address TEXT,
    total_debt NUMERIC(15, 2) NOT NULL,
    remaining_debt NUMERIC(15, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Belum Lunas' CHECK (status IN ('Belum Lunas', 'Lunas')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE debt_payment_history (
    id VARCHAR(36) PRIMARY KEY,
    debt_id VARCHAR(36) REFERENCES customer_debts(id) ON DELETE CASCADE,
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    amount_paid NUMERIC(15, 2) NOT NULL,
    previous_balance NUMERIC(15, 2) NOT NULL,
    new_balance NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'Cash',
    cashier_id VARCHAR(36) REFERENCES users(id),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 12. Buku Arus Kas Masuk / Keluar Otomatis (Cash Flow Ledger)
CREATE TABLE cash_movements (
    id VARCHAR(36) PRIMARY KEY,
    flow_type VARCHAR(10) NOT NULL CHECK (flow_type IN ('in', 'out')),
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('Kas Fisik Toko', 'Saldo Rekening Transfer')),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(100),
    cashier_id VARCHAR(36) REFERENCES users(id),
    shift_session_id VARCHAR(36) REFERENCES shift_sessions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index Performa untuk Transaksi Cepat & Barcode Scan
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_pos_invoice ON pos_transactions(invoice_no);
CREATE INDEX idx_services_ticket ON phone_services(service_ticket_no);
CREATE INDEX idx_cash_movements_date ON cash_movements(created_at);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlDDLCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Arsitektur Sistem & Struktur Basis Data</h3>
              <p className="text-xs text-slate-400">Aplikasi Kasir & POS Multi-Layanan Ju-Fat Cell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Arsitektur Sistem Multi-Layanan</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Struktur Entitas & Relasi (ERD)</span>
          </button>

          <button
            onClick={() => setActiveTab('ddl_sql')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ddl_sql'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Skrip DDL SQL (PostgreSQL/MySQL)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Panduan Implementasi Langkah demi Langkah</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-700 space-y-6">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>Presentation & RBAC Layer</span>
                  </div>
                  <h4 className="font-bold text-slate-900">React SPA + Tailwind CSS</h4>
                  <p className="text-xs text-slate-600">
                    Sistem otorisasi 3-level (Admin, Shift 1, Shift 2). Shift kasir tidak memiliki akses terhadap harga modal/beli produk atau laba total toko, dan memiliki kontrol laci uang kas melalui modul Close Shift.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-fuchsia-600 font-bold text-xs uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Security & E2EE Core</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Web Crypto AES-GCM 256</h4>
                  <p className="text-xs text-slate-600">
                    Menjamin kerahasiaan data pribadi pelanggan (PIN/pola servis HP dan nomor rekening transfer agen) dienkripsi secara end-to-end sebelum disimpan ke basis data dengan 2FA TOTP verification.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                    <Database className="w-4 h-4" />
                    <span>Financial Ledger Engine</span>
                  </div>
                  <h4 className="font-bold text-slate-900">Double-Entry Cash Movement</h4>
                  <p className="text-xs text-slate-600">
                    Setiap transaksi secara otomatis merekam jurnal kas masuk/keluar yang memisahkan antara <strong>Kas Fisik Toko</strong> dan <strong>Saldo Modal Transfer Bank</strong>.
                  </p>
                </div>
              </div>

              {/* Diagram Arsitektur Visual */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-900 text-white font-mono text-xs overflow-x-auto leading-relaxed">
                <div className="text-emerald-400 font-bold pb-2">[ARUS DATA & INTEGRASI LAYANAN JU-FAT CELL]</div>
                <pre className="text-slate-300">
{`+-----------------------------------------------------------------------------------+
|                           JU-FAT CELL POS CLIENT UI                               |
| [Tab ATK]  |  [Tab Service HP]  |  [Tab PPOB]  |  [Tab Transfer]  |  [Tab Percetakan] |
+-----------------------------------------------------------------------------------+
       |                  |                |               |                 |
       v                  v                v               v                 v
[Barcode Engine]   [E2EE Encryption]  [Margin Calc]   [Bank Fee Calc]   [Dynamic Sheet Calc]
       |                  |                |               |                 |
       +------------------+----------------+---------------+-----------------+
                                           |
                                           v
                             +----------------------------+
                             |   Role & Security Filter   |
                             | (Hide Cost if Kasir Shift) |
                             +----------------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
                   v                                               v
        +---------------------+                        +-----------------------+
        |  Hardware Thermal   |                        | Automated Cash Ledger |
        |  Printer (58/80mm)  |                        |  - Kas Fisik Toko     |
        |  ESC/POS Emulation  |                        |  - Modal Saldo Bank   |
        +---------------------+                        +-----------------------+`}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-950">Daftar Tabel & Relasi Entitas (12 Tabel Utama)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">1. users & shift_sessions</div>
                  <p className="text-slate-600 mt-1">Mengatur hak akses login (Admin / Shift 1 / Shift 2) dan pelacakan sesi kasir laci kas.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">2. categories & products</div>
                  <p className="text-slate-600 mt-1">Katalog ATK & aksesoris, barcode scanning, stok real-time & peringatan stok menipis.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">3. phone_services</div>
                  <p className="text-slate-600 mt-1">Formulir penerimaan servis, DP, estimasi biaya, garansi 7 hari, dan enkripsi E2EE pola/PIN.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">4. ppob_transactions</div>
                  <p className="text-slate-600 mt-1">Pencatatan Pulsa, Token PLN, E-Wallet dengan perbandingan harga modal vs harga jual.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">5. money_transfers</div>
                  <p className="text-slate-600 mt-1">Agen bank (Tarik/Setor tunai, transfer) dengan perhitungan komisi/biaya jasa konter.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">6. print_orders</div>
                  <p className="text-slate-600 mt-1">Kalkulator cetak dinamis jilid, print per lembar, foto, dan banner per meter.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">7. customer_debts & debt_payments</div>
                  <p className="text-slate-600 mt-1">Buku piutang pelanggan, metode bayar kredit/hutang, dan pencatatan cicilan otomatis.</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="font-bold text-indigo-700">8. cash_movements</div>
                  <p className="text-slate-600 mt-1">Arus kas otomatis untuk laporan keuangan bulanan yang dapat diunduh (Excel/CSV).</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ddl_sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Skrip SQL DDL Lengkap (Siap Dijalankan di PostgreSQL / MySQL)
                </span>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-[350px]">
                {sqlDDLCode}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-900 text-sm">Langkah 1: Setup & Role Access Guard</h4>
                <p className="text-blue-800">
                  Pastikan modul autentikasi memfilter harga modal (<code>costPrice</code>) jika peran pengguna adalah <code>shift1</code> atau <code>shift2</code>. Kasir hanya boleh melihat <code>sellingPrice</code> untuk mencegah kebocoran margin rahasia toko.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-900 text-sm">Langkah 2: Integrasi Printer Thermal ESC/POS (58mm / 80mm)</h4>
                <p className="text-emerald-800">
                  Gunakan CSS print media query <code>@media print</code> dengan styling <code>#printable-receipt</code> berukuran tetap (58mm = 48mm area cetak / 80mm = 72mm area cetak) serta font monospace tabular figures agar kolom harga sejajar rapi.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-900 text-sm">Langkah 3: Sistem Arus Kas Otomatis & Close Shift</h4>
                <p className="text-amber-800">
                  Setiap pembayaran transaksi tunai otomatis menyuntikkan data ke tabel <code>cash_movements</code>. Saat shift berganti, jalankan formulir Close Shift untuk membandingkan uang fisik aktual di laci dengan saldo sistem yang diharapkan.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Tutup Dokumentasi
          </button>
        </div>
      </div>
    </div>
  );
};
