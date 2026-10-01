import React, { useState } from 'react';
import { PPOBType, PPOBTransaction, User, ReceiptData, ShiftSession } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import {
  Zap,
  Phone,
  Wifi,
  Tv,
  FileCheck2,
  Gamepad2,
  Wallet,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface TabPpobProps {
  transactions: PPOBTransaction[];
  currentUser: User;
  currentShift: ShiftSession;
  onSubmitTransaction: (tx: PPOBTransaction, receipt: ReceiptData) => void;
}

const PPOB_OPTIONS: { type: PPOBType; label: string; icon: React.ReactNode; defaultCost: number; defaultSell: number }[] = [
  { type: 'Pulsa', label: 'Pulsa Reguler', icon: <Phone className="w-4 h-4" />, defaultCost: 25100, defaultSell: 27000 },
  { type: 'Paket Data', label: 'Paket Data / Kuota', icon: <Wifi className="w-4 h-4" />, defaultCost: 50000, defaultSell: 55000 },
  { type: 'Token PLN', label: 'Token PLN Prabayar', icon: <Zap className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Bayar PLN', label: 'Tagihan Listrik PLN Pasca', icon: <Zap className="w-4 h-4" />, defaultCost: 150000, defaultSell: 153000 },
  { type: 'Top Up DANA', label: 'Top Up DANA', icon: <Wallet className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Top Up OVO', label: 'Top Up OVO', icon: <Wallet className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Top Up ShopeePay', label: 'Top Up ShopeePay', icon: <Wallet className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Top Up Gopay', label: 'Top Up GoPay', icon: <Wallet className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Top Up LinkAja', label: 'Top Up LinkAja', icon: <Wallet className="w-4 h-4" />, defaultCost: 50500, defaultSell: 53000 },
  { type: 'Top Up Game', label: 'Voucher / Top Up Game', icon: <Gamepad2 className="w-4 h-4" />, defaultCost: 20000, defaultSell: 24000 },
  { type: 'Bayar BPJS', label: 'Bayar BPJS Kesehatan', icon: <FileCheck2 className="w-4 h-4" />, defaultCost: 70000, defaultSell: 72500 },
  { type: 'Bayar PDAM', label: 'Tagihan Air PDAM', icon: <Tv className="w-4 h-4" />, defaultCost: 80000, defaultSell: 82500 },
  { type: 'Lainnya', label: 'PPOB Lainnya', icon: <Sparkles className="w-4 h-4" />, defaultCost: 10000, defaultSell: 13000 },
];

export const TabPpob: React.FC<TabPpobProps> = ({
  transactions,
  currentUser,
  currentShift,
  onSubmitTransaction,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [selectedType, setSelectedType] = useState<PPOBType>('Paket Data');
  const [targetNumber, setTargetNumber] = useState('');
  const [provider, setProvider] = useState('Telkomsel');
  const [customerName, setCustomerName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(50000);
  const [sellingPrice, setSellingPrice] = useState<number>(55000);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'QRIS' | 'Hutang'>('Cash');
  const [cashReceived, setCashReceived] = useState<string>('55000');

  const handleSelectOption = (opt: typeof PPOB_OPTIONS[0]) => {
    setSelectedType(opt.type);
    setCostPrice(opt.defaultCost);
    setSellingPrice(opt.defaultSell);
    setCashReceived(opt.defaultSell.toString());
  };

  const profit = Math.max(0, sellingPrice - costPrice);
  const paid = parseFloat(cashReceived) || 0;
  const change = Math.max(0, paid - sellingPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNumber.trim()) {
      alert('Harap masukkan nomor tujuan / nomor HP / nomor meter!');
      return;
    }

    if (paymentMethod === 'Cash' && paid < sellingPrice) {
      alert('Uang yang diterima kurang!');
      return;
    }

    const txNo = `PPOB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newTx: PPOBTransaction = {
      id: 'ppob-' + Date.now(),
      txNumber: txNo,
      type: selectedType,
      targetNumber,
      provider,
      nominalDisplay: formatRupiah(sellingPrice),
      costPrice,
      sellingPrice,
      profit,
      paymentMethod,
      customerPaid: paid,
      change,
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      status: 'Sukses',
      customerName: customerName || undefined,
    };

    const receiptData: ReceiptData = {
      title: 'BUKTI TRANSAKSI PPOB & PULSA',
      subtitle: 'JU-FAT CELL DIGITAL PAYMENT',
      receiptNumber: txNo,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName: customerName || undefined,
      items: [
        {
          name: `${selectedType} (${provider})`,
          price: sellingPrice,
          total: sellingPrice,
          note: `No. Tujuan: ${targetNumber}`,
        },
      ],
      subtotal: sellingPrice,
      grandTotal: sellingPrice,
      paymentMethod,
      cashPaid: paid,
      change,
      footerNote: 'Transaksi PPOB diproses otomatis. Simpan struk ini sebagai bukti pembayaran yang sah.',
    };

    onSubmitTransaction(newTx, receiptData);

    // Reset input
    setTargetNumber('');
    setCustomerName('');
    alert(`Transaksi ${selectedType} berhasil disimpan!`);
  };

  return (
    <div className="space-y-6">
      {/* Layout Split Persis Seperti Screenshot catatkonter.rumahdigital.net */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Formulir Input Kiri */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Transaksi Pulsa / PPOB Baru</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-fuchsia-50 text-fuchsia-700 font-bold border border-fuchsia-200">
              {selectedType}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Nomor Tujuan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Tujuan / No HP / ID Pelanggan *
              </label>
              <input
                type="text"
                required
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                placeholder="Contoh: 081234567890 atau No. Meter 3201..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Operator / Provider
                </label>
                <input
                  type="text"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  placeholder="Telkomsel / Indosat / PLN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pembeli"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Harga Modal vs Harga Jual */}
            <div className="grid grid-cols-2 gap-3">
              {/* HARGA MODAL HANYA DITAMPILKAN KEPADA ADMIN */}
              {isAdmin ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Modal (Rp) *
                  </label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
                  />
                </div>
              ) : (
                <div className="hidden" />
              )}

              <div className={isAdmin ? '' : 'col-span-2'}>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Jual Pelanggan (Rp) *
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSellingPrice(val);
                    setCashReceived(val.toString());
                  }}
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-sm font-bold font-mono-num text-slate-900"
                />
              </div>
            </div>

            {/* Indikator Laba Margin (HANYA UNTUK ADMIN) */}
            {isAdmin && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-emerald-800 block text-xs">Margin Keuntungan (Laba):</span>
                  <span className="text-[11px] text-emerald-600">Harga Jual - Harga Modal</span>
                </div>
                <span className="text-base font-black font-mono-num text-emerald-700">
                  +{formatRupiah(profit)}
                </span>
              </div>
            )}

            {/* Metode Bayar */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Metode Bayar Pelanggan *</label>
              <div className="grid grid-cols-4 gap-2">
                {(['Cash', 'Transfer', 'QRIS', 'Hutang'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-1 rounded-lg border text-center font-bold text-xs ${
                      paymentMethod === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Tunai & Kembalian */}
            {paymentMethod === 'Cash' && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Uang Diterima:</label>
                  <button
                    type="button"
                    onClick={() => setCashReceived(sellingPrice.toString())}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Uang Pas
                  </button>
                </div>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
                />

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived((sellingPrice + 5000).toString())}
                    className="flex-1 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    +5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((sellingPrice + 10000).toString())}
                    className="flex-1 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    +10.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived('50000')}
                    className="flex-1 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived('100000')}
                    className="flex-1 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    100.000
                  </button>
                </div>

                <div className="flex justify-between items-center pt-1 font-bold text-xs">
                  <span>Kembalian:</span>
                  <span className="font-mono-num text-sm text-emerald-700">
                    {formatRupiah(change)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <Receipt className="w-4 h-4" />
              <span>Simpan Transaksi & Cetak Struk PPOB</span>
            </button>
          </form>
        </div>

        {/* Kolom Pilihan Cepat Jenis Transaksi Kanan (Sesuai Screenshot catatkonter) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Pilih Jenis Transaksi</h4>
            <p className="text-xs text-slate-500">Klik salah satu untuk memilih layanan cepat</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {PPOB_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-xs'
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs truncate leading-snug">{opt.type}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {opt.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-800 space-y-1">
            <span className="font-bold block">💡 Integrasi Multi-Layanan POS</span>
            <p>
              Setiap transaksi PPOB otomatis memotong saldo modal server atau mencatat kas tunai masuk ke laci kasir shift Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi PPOB Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h4 className="font-bold text-sm text-slate-900">Riwayat Transaksi PPOB Terakhir</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Layanan</th>
                <th className="py-2.5 px-3">Nomor Tujuan</th>
                <th className="py-2.5 px-3">Harga Jual</th>
                {isAdmin && <th className="py-2.5 px-3">Laba</th>}
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Kasir / Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-medium">{tx.txNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(tx.createdAt)}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.type}</td>
                  <td className="py-2.5 px-3 font-mono">{tx.targetNumber}</td>
                  <td className="py-2.5 px-3 font-mono-num font-bold">{formatRupiah(tx.sellingPrice)}</td>
                  {isAdmin && (
                    <td className="py-2.5 px-3 font-mono-num text-emerald-600 font-semibold">
                      +{formatRupiah(tx.profit)}
                    </td>
                  )}
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {tx.cashierName} ({tx.shift})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
