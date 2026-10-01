import React, { useState } from 'react';
import { DebtRecord, DebtPayment, User, ReceiptData, ShiftSession } from '../../types';
import { formatRupiah, formatDateTime, formatDate } from '../../utils/formatters';
import {
  BookOpen,
  Search,
  Plus,
  Receipt,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  MapPin,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface TabDebtsProps {
  debts: DebtRecord[];
  currentUser: User;
  currentShift: ShiftSession;
  onRecordPayment: (
    debtId: string,
    payment: DebtPayment,
    receipt: ReceiptData,
    newRemaining: number
  ) => void;
  onAddNewDebtDirect: (newDebt: DebtRecord) => void;
}

export const TabDebts: React.FC<TabDebtsProps> = ({
  debts,
  currentUser,
  currentShift,
  onRecordPayment,
  onAddNewDebtDirect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Belum Lunas' | 'Lunas'>('Belum Lunas');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);

  // Form bayar cicilan
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer'>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form tambah hutang manual
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const filteredDebts = debts.filter((d) => {
    const matchesSearch =
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = debts
    .filter((d) => d.status === 'Belum Lunas')
    .reduce((acc, d) => acc + d.remainingDebt, 0);

  const handleOpenPayment = (debt: DebtRecord) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remainingDebt.toString());
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) {
      alert('Jumlah pembayaran cicilan harus lebih dari 0!');
      return;
    }
    if (amt > selectedDebt.remainingDebt) {
      alert(`Pembayaran melebihi sisa hutang (${formatRupiah(selectedDebt.remainingDebt)})!`);
      return;
    }

    const receiptNo = `CICIL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newRemaining = selectedDebt.remainingDebt - amt;

    const payment: DebtPayment = {
      id: 'pay-' + Date.now(),
      receiptNumber: receiptNo,
      paymentDate: new Date().toISOString(),
      amountPaid: amt,
      previousBalance: selectedDebt.remainingDebt,
      newBalance: newRemaining,
      paymentMethod,
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      notes: paymentNotes || undefined,
    };

    const receiptData: ReceiptData = {
      title: 'BUKTI PEMBAYARAN CICILAN PIUTANG',
      subtitle: 'JU-FAT CELL BUKU PIUTANG',
      receiptNumber: receiptNo,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName: selectedDebt.customerName,
      customerPhone: selectedDebt.customerPhone,
      items: [
        {
          name: 'Pembayaran Cicilan Hutang',
          price: amt,
          total: amt,
          note: paymentNotes || 'Cicilan belanja kasir',
        },
      ],
      subtotal: amt,
      grandTotal: amt,
      paymentMethod,
      cashPaid: amt,
      remainingDebt: newRemaining,
      footerNote:
        newRemaining === 0
          ? 'HUTANG LUNAS 100%. Terima kasih banyak!'
          : `Sisa Saldo Hutang: ${formatRupiah(newRemaining)}. Harap dilunasi sebelum jatuh tempo.`,
    };

    onRecordPayment(selectedDebt.id, payment, receiptData, newRemaining);
    setShowPaymentModal(false);
    setSelectedDebt(null);
  };

  const handleCreateManualDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount) || 0;
    if (!newName.trim() || !newPhone.trim() || amt <= 0) {
      alert('Harap lengkapi nama pelanggan, nomor HP, dan nominal hutang!');
      return;
    }

    const newRecord: DebtRecord = {
      id: 'debt-' + Date.now(),
      customerName: newName,
      customerPhone: newPhone,
      customerAddress: newAddress || undefined,
      totalDebt: amt,
      remainingDebt: amt,
      dueDate: newDueDate || undefined,
      status: 'Belum Lunas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: 'hist-' + Date.now(),
          date: new Date().toISOString(),
          description: newDescription || 'Pencatatan kasbon/hutang manual di konter',
          amount: amt,
          transactionType: 'ATK',
          refNumber: `DEBT-MAN-${Date.now().toString().slice(-5)}`,
        },
      ],
      payments: [],
    };

    onAddNewDebtDirect(newRecord);
    setShowAddDebtModal(false);
    // Reset
    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setNewAmount('');
    setNewDescription('');
    setNewDueDate('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Piutang */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-950 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-red-300 block font-medium uppercase tracking-wider">
              Total Piutang Belum Lunas
            </span>
            <span className="text-2xl font-black font-mono-num text-red-300">
              {formatRupiah(totalOutstanding)}
            </span>
            <p className="text-[11px] text-red-400 mt-1">
              Dari {debts.filter((d) => d.status === 'Belum Lunas').length} pelanggan aktif
            </p>
          </div>
          <BookOpen className="w-8 h-8 text-red-400" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">
              Jumlah Debitur
            </span>
            <span className="text-2xl font-black font-mono-num text-slate-900">
              {debts.length} Pelanggan
            </span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {debts.filter((d) => d.status === 'Lunas').length} sudah melunasi hutang
            </p>
          </div>
          <UserCheck className="w-8 h-8 text-slate-700" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-center items-start">
          <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider mb-2">
            Aksi Cepat
          </span>
          <button
            onClick={() => setShowAddDebtModal(true)}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Hutang Baru (Manual)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau no. telepon pelanggan..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({debts.length})
          </button>
          <button
            onClick={() => setStatusFilter('Belum Lunas')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Belum Lunas'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Lunas ({debts.filter((d) => d.status === 'Belum Lunas').length})
          </button>
          <button
            onClick={() => setStatusFilter('Lunas')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'Lunas'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Lunas ({debts.filter((d) => d.status === 'Lunas').length})
          </button>
        </div>
      </div>

      {/* Grid Buku Piutang Pelanggan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDebts.map((debt) => (
          <div
            key={debt.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
          >
            <div>
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{debt.customerName}</h4>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{debt.customerPhone}</span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    debt.status === 'Lunas'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {debt.status}
                </span>
              </div>

              {debt.customerAddress && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-2">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{debt.customerAddress}</span>
                </div>
              )}

              {/* Rincian Sisa Hutang */}
              <div className="pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Akumulasi Hutang:</span>
                  <span className="font-mono-num">{formatRupiah(debt.totalDebt)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                  <span>SISA HUTANG:</span>
                  <span
                    className={`font-mono-num ${
                      debt.remainingDebt > 0 ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {formatRupiah(debt.remainingDebt)}
                  </span>
                </div>
                {debt.dueDate && (
                  <div className="flex justify-between text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Jatuh Tempo:</span>
                    </span>
                    <span className="font-semibold">{formatDate(debt.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Riwayat Belanja Terakhir */}
              <div className="pt-3 border-t border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Riwayat Belanja / Cicilan:
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {debt.history.map((h) => (
                    <div
                      key={h.id}
                      className="text-[11px] flex justify-between text-slate-600 bg-slate-50 p-1 rounded"
                    >
                      <span className="truncate pr-2">{h.description}</span>
                      <span className="font-mono-num font-semibold shrink-0">
                        {formatRupiah(h.amount)}
                      </span>
                    </div>
                  ))}
                  {debt.payments.map((p) => (
                    <div
                      key={p.id}
                      className="text-[11px] flex justify-between text-emerald-700 bg-emerald-50/60 p-1 rounded font-medium"
                    >
                      <span className="truncate pr-2">Cicilan: {formatDateTime(p.paymentDate)}</span>
                      <span className="font-mono-num shrink-0">-{formatRupiah(p.amountPaid)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Terakhir: {formatDateTime(debt.updatedAt)}
              </span>

              {debt.remainingDebt > 0 ? (
                <button
                  type="button"
                  onClick={() => handleOpenPayment(debt)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Bayar Cicilan</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Lunas
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDebts.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs">Tidak ada data piutang yang cocok.</p>
        </div>
      )}

      {/* Modal Input Cicilan */}
      {showPaymentModal && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Input Pembayaran Cicilan Hutang</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold text-slate-900">{selectedDebt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>No. Telepon:</span>
                <span>{selectedDebt.customerPhone}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-red-600 pt-1 border-t border-slate-200">
                <span>Total Sisa Hutang:</span>
                <span>{formatRupiah(selectedDebt.remainingDebt)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Cicilan Yang Dibayar (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-sm font-bold font-mono-num"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash', 'Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg border text-center font-bold text-xs ${
                        paymentMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Contoh: Titip uang lewat kasir shift sore"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Simpan & Cetak Nota Cicilan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Hutang Manual */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Catat Piutang Baru (Kasbon Manual)</h3>
              <button
                onClick={() => setShowAddDebtModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualDebt} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Pak Budi Tetangga"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No HP / WA *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Hutang (Rp) *</label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Barang / Keperluan
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Contoh: Ambil buku tulis & servis LCD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat / Lokasi</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Contoh: Rumah blok C depan pos satpam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs"
                >
                  Simpan ke Buku Piutang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
