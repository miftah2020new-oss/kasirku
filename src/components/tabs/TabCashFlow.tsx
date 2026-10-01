import React, { useState } from 'react';
import { CashFlowMovement, User, ShiftSession } from '../../types';
import { formatRupiah, formatDateTime, exportToCSV } from '../../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Download,
  Wallet,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface TabCashFlowProps {
  cashFlows: CashFlowMovement[];
  currentUser: User;
  currentShift: ShiftSession;
  onAddManualMovement: (movement: CashFlowMovement) => void;
}

export const TabCashFlow: React.FC<TabCashFlowProps> = ({
  cashFlows,
  currentUser,
  currentShift,
  onAddManualMovement,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'in' | 'out'>('out');
  const [account, setAccount] = useState<'Kas Fisik Toko' | 'Saldo Rekening Transfer'>('Kas Fisik Toko');
  const [category, setCategory] = useState<CashFlowMovement['category']>('Operasional Toko');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Perhitungan saldo
  const totalCashIn = cashFlows
    .filter((cf) => cf.type === 'in' && cf.account === 'Kas Fisik Toko')
    .reduce((a, b) => a + b.amount, 0);

  const totalCashOut = cashFlows
    .filter((cf) => cf.type === 'out' && cf.account === 'Kas Fisik Toko')
    .reduce((a, b) => a + b.amount, 0);

  const netPhysicalCash = totalCashIn - totalCashOut;

  const handleExportCSV = () => {
    const headers = [
      'ID Mutasi',
      'Tanggal/Waktu',
      'Jenis (Masuk/Keluar)',
      'Akun Rekening/Kas',
      'Kategori',
      'Nominal (Rp)',
      'Keterangan',
      'No Referensi',
      'Kasir',
      'Shift',
    ];

    const rows = cashFlows.map((cf) => [
      cf.id,
      formatDateTime(cf.date),
      cf.type === 'in' ? 'KAS MASUK' : 'KAS KELUAR',
      cf.account,
      cf.category,
      cf.amount,
      cf.description,
      cf.referenceNumber || '-',
      cf.cashierName,
      cf.shift,
    ]);

    exportToCSV(`Arus_Kas_JuFatCell_${new Date().toISOString().slice(0, 10)}`, [
      headers,
      ...rows,
    ]);
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    if (amt <= 0 || !description.trim()) {
      alert('Harap masukkan nominal dan deskripsi pengeluaran/pemasukan!');
      return;
    }

    const newMov: CashFlowMovement = {
      id: 'cf-' + Date.now(),
      type,
      account,
      category,
      amount: amt,
      description,
      date: new Date().toISOString(),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
    };

    onAddManualMovement(newMov);
    setShowAddModal(false);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Saldo Kas & Mutasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">
              Total Kas Fisik Masuk
            </span>
            <span className="text-2xl font-black font-mono-num text-emerald-600">
              +{formatRupiah(totalCashIn)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Penjualan, servis, cetak & pelunasan</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">
              Total Pengeluaran Kas
            </span>
            <span className="text-2xl font-black font-mono-num text-red-600">
              -{formatRupiah(totalCashOut)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Belanja stok, operasional, makan & beban</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 text-red-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
              Saldo Kas Fisik Bersih (Laci)
            </span>
            <span className="text-2xl font-black font-mono-num text-amber-400">
              {formatRupiah(netPhysicalCash)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Total kas riil di toko saat ini</p>
          </div>
          <Wallet className="w-8 h-8 text-slate-600" />
        </div>
      </div>

      {/* Action Header & Ekspor */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Buku Arus Kas Masuk & Keluar Otomatis</h3>
          <p className="text-xs text-slate-500">
            Pencatatan real-time otomatis dari transaksi POS dan pengeluaran operasional toko
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
            title="Unduh file CSV kompatibel Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh Laporan Kas (Excel/CSV)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran / Kas Masuk</span>
          </button>
        </div>
      </div>

      {/* Tabel Mutasi Kas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Arus</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Akun</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Kasir / Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlows.map((cf) => (
                <tr key={cf.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(cf.date)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cf.type === 'in'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {cf.type === 'in' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> MASUK
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> KELUAR
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{cf.category}</td>
                  <td className="py-3 px-4 text-slate-600">{cf.account}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                    {cf.description}
                    {cf.referenceNumber && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Ref: {cf.referenceNumber}
                      </span>
                    )}
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono-num font-bold text-xs whitespace-nowrap ${
                      cf.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {cf.type === 'in' ? `+${formatRupiah(cf.amount)}` : `-${formatRupiah(cf.amount)}`}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {cf.cashierName} ({cf.shift})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Kas Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Catat Arus Kas Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-3 text-xs">
              {/* Jenis Kas Masuk / Keluar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    type === 'out'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Kas Keluar (Biaya)
                </button>
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={`py-2 rounded-lg font-bold border transition-colors ${
                    type === 'in'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Kas Masuk (Lainnya)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Rekening / Laci</label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Kas Fisik Toko">Kas Fisik Toko (Laci Kasir)</option>
                  <option value="Saldo Rekening Transfer">Saldo Rekening Transfer Bank</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Transaksi</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Operasional Toko">Operasional Toko (Air, Kebersihan, ATK)</option>
                  <option value="Belanja Stok ATK">Belanja Kulakan Stok ATK / Aksesoris</option>
                  <option value="Gaji & Uang Makan">Uang Makan / Gaji Kasir</option>
                  <option value="Listrik & Wifi">Tagihan Listrik & Internet Konter</option>
                  <option value="Modal Awal Kasir">Tambahan Modal Kas Awal</option>
                  <option value="Tarik Modal / Setoran">Tarik Modal Setoran Pemilik</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-sm font-bold font-mono-num"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli air mineral galon 2 galon..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
