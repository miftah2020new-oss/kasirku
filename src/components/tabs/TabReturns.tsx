import React, { useState } from 'react';
import { Product, ServiceRecord, User, ShiftSession, CashFlowMovement } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { RotateCcw, Search, Plus, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReturnItem {
  id: string;
  returnDate: string;
  type: 'Barang ATK/Aksesoris' | 'Klaim Garansi Service HP';
  refNumber: string;
  customerName: string;
  reason: string;
  solution: 'Ganti Unit Baru' | 'Perbaikan Ulang' | 'Refund Tunai';
  refundAmount?: number;
  cashierName: string;
}

interface TabReturnsProps {
  products: Product[];
  services: ServiceRecord[];
  currentUser: User;
  currentShift: ShiftSession;
  onProcessRefundCash: (flow: CashFlowMovement) => void;
}

export const TabReturns: React.FC<TabReturnsProps> = ({
  products,
  services,
  currentUser,
  currentShift,
  onProcessRefundCash,
}) => {
  const [returnHistory, setReturnHistory] = useState<ReturnItem[]>([
    {
      id: 'ret-1',
      returnDate: '2026-09-30T10:00:00.000Z',
      type: 'Klaim Garansi Service HP',
      refNumber: 'SRV-20260929-03',
      customerName: 'Hendra Gunawan',
      reason: 'Konektor longgar setelah 1 hari pemakaian',
      solution: 'Perbaikan Ulang',
      cashierName: 'Rian (Kasir)',
    },
    {
      id: 'ret-2',
      returnDate: '2026-09-28T14:30:00.000Z',
      type: 'Barang ATK/Aksesoris',
      refNumber: 'INV-20260928-09',
      customerName: 'Doni',
      reason: 'Kabel data tidak mengisi ke HP Infinix',
      solution: 'Ganti Unit Baru',
      cashierName: 'Maya (Kasir)',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [returnType, setReturnType] = useState<'Barang ATK/Aksesoris' | 'Klaim Garansi Service HP'>('Barang ATK/Aksesoris');
  const [refNumber, setRefNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [reason, setReason] = useState('');
  const [solution, setSolution] = useState<'Ganti Unit Baru' | 'Perbaikan Ulang' | 'Refund Tunai'>('Ganti Unit Baru');
  const [refundAmount, setRefundAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reason.trim()) {
      alert('Harap lengkapi nama pelanggan dan alasan retur!');
      return;
    }

    const refAmt = solution === 'Refund Tunai' ? parseFloat(refundAmount) || 0 : undefined;

    const newItem: ReturnItem = {
      id: 'ret-' + Date.now(),
      returnDate: new Date().toISOString(),
      type: returnType,
      refNumber: refNumber || `RET-${Date.now().toString().slice(-4)}`,
      customerName,
      reason,
      solution,
      refundAmount: refAmt,
      cashierName: currentUser.name,
    };

    setReturnHistory([newItem, ...returnHistory]);

    // Jika ada pengembalian uang tunai (Refund)
    if (refAmt && refAmt > 0) {
      onProcessRefundCash({
        id: 'cf-' + Date.now(),
        type: 'out',
        account: 'Kas Fisik Toko',
        category: 'Lain-lain',
        amount: refAmt,
        description: `Refund Retur ${returnType} a.n ${customerName} (${reason})`,
        referenceNumber: refNumber,
        date: new Date().toISOString(),
        cashierName: currentUser.name,
        shift: currentShift.shiftName,
      });
    }

    setShowModal(false);
    setRefNumber('');
    setCustomerName('');
    setReason('');
    setRefundAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Manajemen Retur & Klaim Garansi</h3>
          <p className="text-xs text-slate-500">
            Penanganan pengembalian barang cacat, tukar baru, dan garansi service HP 7 hari
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Input Retur Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Jenis Retur</th>
                <th className="py-3 px-4">No. Referensi / Tiket</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Alasan Retur / Kendala</th>
                <th className="py-3 px-4">Solusi Penanganan</th>
                <th className="py-3 px-4">Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returnHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(item.returnDate)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.type}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{item.refNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.customerName}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.reason}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.solution === 'Refund Tunai'
                          ? 'bg-red-50 text-red-700'
                          : item.solution === 'Perbaikan Ulang'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {item.solution}
                      {item.refundAmount ? ` (${formatRupiah(item.refundAmount)})` : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{item.cashierName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Formulir Retur / Klaim Garansi</h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Klaim</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Barang ATK/Aksesoris">Barang ATK / Aksesoris Rusak</option>
                  <option value="Klaim Garansi Service HP">Klaim Garansi Service HP (7 Hari)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. Invoice / Tiket Servis</label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  placeholder="Contoh: SRV-20261001-01 atau INV-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama konsumen yang klaim"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Retur / Kendala *</label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Jelaskan kerusakan / masalah yang dialami"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Solusi Penanganan *</label>
                <select
                  value={solution}
                  onChange={(e) => setSolution(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Ganti Unit Baru">Ganti Barang / Sparepart Baru</option>
                  <option value="Perbaikan Ulang">Perbaikan Ulang Gratis (Garansi)</option>
                  <option value="Refund Tunai">Kembalikan Uang Kas (Refund)</option>
                </select>
              </div>

              {solution === 'Refund Tunai' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Refund Kas (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-num font-bold text-red-600"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Simpan Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
