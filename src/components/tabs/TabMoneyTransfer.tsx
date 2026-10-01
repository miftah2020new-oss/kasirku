import React, { useState } from 'react';
import {
  MoneyTransferType,
  MoneyTransferRecord,
  User,
  ReceiptData,
  ShiftSession,
} from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { encryptData } from '../../utils/crypto';
import {
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Wallet,
  Receipt,
  ShieldCheck,
  CreditCard,
  Banknote,
  Send,
} from 'lucide-react';

interface TabMoneyTransferProps {
  transfers: MoneyTransferRecord[];
  transferCapitalBalance: number;
  currentUser: User;
  currentShift: ShiftSession;
  onSubmitTransfer: (
    transfer: MoneyTransferRecord,
    receipt: ReceiptData,
    newBalance: number
  ) => void;
  isE2EEActive: boolean;
}

const TRANSFER_TYPES: { type: MoneyTransferType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: 'Transfer Antar Bank',
    label: 'Transfer Antar Bank',
    desc: 'Kirim uang ke BCA, Mandiri, BNI, BSI, dll.',
    icon: <ArrowUpRight className="w-4 h-4 text-blue-600" />,
  },
  {
    type: 'Transfer Sesama Bank',
    label: 'Transfer Sesama Bank (BRI)',
    desc: 'Kirim sesama rekening BRI / BRILink',
    icon: <Send className="w-4 h-4 text-emerald-600" />,
  },
  {
    type: 'Tarik Tunai',
    label: 'Tarik Tunai (Cash Out)',
    desc: 'Pelanggan transfer saldo, terima uang tunai',
    icon: <ArrowDownLeft className="w-4 h-4 text-amber-600" />,
  },
  {
    type: 'Setor Tunai',
    label: 'Setor Tunai Rekening',
    desc: 'Terima tunai untuk disetor ke rekening bank',
    icon: <Banknote className="w-4 h-4 text-indigo-600" />,
  },
  {
    type: 'Top Up E-Wallet',
    label: 'Top Up E-Wallet Agen',
    desc: 'Dana, ShopeePay, Gopay, Ovo, LinkAja',
    icon: <Wallet className="w-4 h-4 text-fuchsia-600" />,
  },
  {
    type: 'Pembayaran BRIVA/VA',
    label: 'Pembayaran BRIVA / Virtual Account',
    desc: 'Bayar tagihan e-commerce / kuliah / tiket',
    icon: <CreditCard className="w-4 h-4 text-teal-600" />,
  },
];

export const TabMoneyTransfer: React.FC<TabMoneyTransferProps> = ({
  transfers,
  transferCapitalBalance,
  currentUser,
  currentShift,
  onSubmitTransfer,
  isE2EEActive,
}) => {
  const [selectedType, setSelectedType] = useState<MoneyTransferType>('Transfer Antar Bank');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [targetBank, setTargetBank] = useState('Bank BRI');
  const [accountNumber, setAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [transferAmount, setTransferAmount] = useState('500000');
  const [bankFee, setBankFee] = useState('2500');
  const [counterFee, setCounterFee] = useState('5000');
  const [notes, setNotes] = useState('');

  const amount = parseFloat(transferAmount) || 0;
  const bFee = parseFloat(bankFee) || 0;
  const cFee = parseFloat(counterFee) || 0;

  // Kalkulasi total yang dibayar pelanggan
  let totalCustomerPay = 0;
  if (selectedType === 'Tarik Tunai') {
    // Pelanggan transfer (nominal + counter fee), kasir beri uang tunai nominal
    totalCustomerPay = cFee;
  } else {
    // Pelanggan bayar nominal + admin bank + jasa konter
    totalCustomerPay = amount + bFee + cFee;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !recipientName.trim() || !accountNumber.trim()) {
      alert('Harap lengkapi nama pengirim, nomor rekening, dan nama penerima!');
      return;
    }

    if (amount <= 0) {
      alert('Nominal transfer harus lebih besar dari 0!');
      return;
    }

    // Cek saldo modal bank jika transfer keluar
    if (selectedType !== 'Tarik Tunai' && amount + bFee > transferCapitalBalance) {
      alert(
        `Saldo Modal Rekening Agen tidak mencukupi! Sisa modal: ${formatRupiah(
          transferCapitalBalance
        )}`
      );
      return;
    }

    let finalAccNum = accountNumber;
    if (isE2EEActive) {
      finalAccNum = await encryptData(accountNumber);
    }

    const txNo = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newTransfer: MoneyTransferRecord = {
      id: 'tf-' + Date.now(),
      txNumber: txNo,
      type: selectedType,
      senderName,
      senderPhone: senderPhone || undefined,
      targetBank,
      accountNumber: finalAccNum,
      recipientName,
      transferAmount: amount,
      bankFee: bFee,
      counterFee: cFee,
      totalCustomerPay,
      paymentMethod: 'Cash',
      status: 'Berhasil',
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
    };

    // Update saldo modal rekening agen:
    // Jika transfer keluar: modal bank berkurang (amount + bFee)
    // Jika tarik tunai: modal bank bertambah (amount + cFee)
    let newBalance = transferCapitalBalance;
    if (selectedType === 'Tarik Tunai') {
      newBalance += amount;
    } else {
      newBalance -= (amount + bFee);
    }

    const receiptData: ReceiptData = {
      title: 'STRUK TRANSAKSI TRANSFER & AGEN BANK',
      subtitle: 'JU-FAT CELL AGEN BRILINK / BANK',
      receiptNumber: txNo,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName: senderName,
      items: [
        {
          name: `${selectedType} ke ${targetBank}`,
          price: amount,
          total: amount,
          note: `Rek: ${accountNumber} a.n ${recipientName}`,
        },
        {
          name: 'Biaya Jasa Layanan Konter',
          price: cFee,
          total: cFee,
        },
      ],
      subtotal: amount + cFee,
      grandTotal: totalCustomerPay,
      paymentMethod: 'Tunai',
      cashPaid: totalCustomerPay,
      footerNote:
        'Transfer berhasil diproses secara realtime online. Simpan bukti transfer ini yang sah.',
    };

    onSubmitTransfer(newTransfer, receiptData, newBalance);

    // Reset formulir
    setRecipientName('');
    setAccountNumber('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Saldo Modal Rekening Agen Bank */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">
              Saldo Modal Rekening Transfer (Bank/Agen)
            </span>
            <span className="text-2xl font-black font-mono-num text-emerald-400">
              {formatRupiah(transferCapitalBalance)}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Dipakai untuk modal transfer keluar & penampung tarik tunai
            </p>
          </div>
          <Building2 className="w-8 h-8 text-slate-600" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">
              Total Jasa Konter Hari Ini
            </span>
            <span className="text-2xl font-black font-mono-num text-slate-900">
              {formatRupiah(transfers.reduce((a, b) => a + b.counterFee, 0))}
            </span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              ✓ Laba bersih Ju-Fat Cell dari biaya jasa
            </p>
          </div>
          <Wallet className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">
              Volume Transaksi Transfer
            </span>
            <span className="text-2xl font-black font-mono-num text-slate-900">
              {transfers.length} Transaksi
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Total Nominal: {formatRupiah(transfers.reduce((a, b) => a + b.transferAmount, 0))}
            </p>
          </div>
          <RefreshCw className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Formulir Transaksi & Grid Layanan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulir Input Transfer */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Formulir Transaksi Transfer & Agen</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {selectedType}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Pengirim */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pengirim *</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Nama konsumen di konter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No HP / WA Pengirim</label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="0812xxxx (opsional)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Bank Tujuan & Rekening */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank / E-Wallet Tujuan *</label>
                <select
                  value={targetBank}
                  onChange={(e) => setTargetBank(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank BSI (Syariah)">Bank BSI (Syariah)</option>
                  <option value="Bank Jatim / BPD">Bank Jatim / BPD</option>
                  <option value="DANA E-Wallet">DANA E-Wallet</option>
                  <option value="ShopeePay">ShopeePay</option>
                  <option value="GoPay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="Bank Lainnya">Bank Lainnya</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Nomor Rekening / No E-Wallet *</label>
                  {isE2EEActive && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> E2EE
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 012901048892501"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Penerima / Pemilik Rekening *
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Contoh: Budi Santoso (Pastikan sesuai rekening)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Nominal Transfer, Biaya Admin & Biaya Jasa Konter */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Transfer (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-sm font-bold font-mono-num text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Admin Bank (Modal)
                </label>
                <input
                  type="number"
                  value={bankFee}
                  onChange={(e) => setBankFee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-num"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jasa Konter (Laba) *
                </label>
                <input
                  type="number"
                  value={counterFee}
                  onChange={(e) => setCounterFee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-num font-bold text-emerald-700"
                />
              </div>
            </div>

            {/* Total Perhitungan Bayar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Nominal Pokok:</span>
                <span className="font-mono-num">{formatRupiah(amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Biaya Jasa Konter:</span>
                <span className="font-mono-num text-emerald-600 font-bold">+{formatRupiah(cFee)}</span>
              </div>
              {selectedType !== 'Tarik Tunai' && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Biaya Admin Bank:</span>
                  <span className="font-mono-num">+{formatRupiah(bFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL DITERIMA DARI KONSUMEN:</span>
                <span className="font-mono-num text-base">{formatRupiah(totalCustomerPay)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
            >
              <Receipt className="w-4 h-4" />
              <span>Proses Transfer & Cetak Struk Bukti Kirim</span>
            </button>
          </form>
        </div>

        {/* Kolom Pilihan Cepat Kanan (Sesuai referensi BRILink WhatsApp Image 2026-09-21 at 18.59.48.jpeg) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Pilih Jenis Transaksi Agen</h4>
            <p className="text-xs text-slate-500">
              Pilihan mutasi kas otomatis untuk layanan perbankan konter
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TRANSFER_TYPES.map((t) => {
              const isSelected = selectedType === t.type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setSelectedType(t.type)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.icon}
                    <span className="font-bold text-xs leading-snug">{t.type}</span>
                  </div>
                  <p
                    className={`text-[10px] leading-tight ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {t.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Edukasi Arus Kas Otomatis */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Otomatisasi Arus Kas & Saldo Modal</span>
            </span>
            <p className="text-[11px] text-emerald-800">
              Ketika Anda memproses <strong>Transfer Keluar</strong>, saldo modal rekening berkurang sebesar transfer + admin bank, dan uang tunai di kas laci bertambah penuh dari pelanggan.
            </p>
          </div>
        </div>
      </div>

      {/* Riwayat Mutasi Transfer Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h4 className="font-bold text-sm text-slate-900">Riwayat Mutasi Transfer Agen Terakhir</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Layanan</th>
                <th className="py-2.5 px-3">Pengirim</th>
                <th className="py-2.5 px-3">Tujuan / Rekening</th>
                <th className="py-2.5 px-3">Penerima</th>
                <th className="py-2.5 px-3">Nominal Transfer</th>
                <th className="py-2.5 px-3">Jasa Konter</th>
                <th className="py-2.5 px-3">Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-medium">{t.txNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(t.createdAt)}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{t.type}</td>
                  <td className="py-2.5 px-3 font-medium">{t.senderName}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold block">{t.targetBank}</span>
                    <span className="font-mono text-[10px] text-slate-500">{t.accountNumber}</span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{t.recipientName}</td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-slate-900">
                    {formatRupiah(t.transferAmount)}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num text-emerald-600 font-bold">
                    +{formatRupiah(t.counterFee)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {t.cashierName} ({t.shift})
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
