import React, { useState } from 'react';
import { ShiftSession, User, ReceiptData } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { Clock, Calculator, AlertTriangle, CheckCircle2, Printer, X } from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: ShiftSession;
  currentUser: User;
  onConfirmCloseShift: (actualCash: number, notes: string) => void;
  onTriggerReceipt: (receipt: ReceiptData) => void;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  currentUser,
  onConfirmCloseShift,
  onTriggerReceipt,
}) => {
  const [physicalCashInput, setPhysicalCashInput] = useState<string>(
    currentShift.expectedCash.toString()
  );
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [step, setStep] = useState<'summary' | 'confirm'>('summary');

  if (!isOpen) return null;

  const actualCash = parseFloat(physicalCashInput) || 0;
  const difference = actualCash - currentShift.expectedCash;

  const handlePrintRekapShift = () => {
    const receiptData: ReceiptData = {
      title: 'REKAP SERAH TERIMA SHIFT',
      subtitle: 'JU-FAT CELL POS',
      receiptNumber: `REKAP-${currentShift.shiftName.replace(/\s+/g, '')}-${Date.now().toString().slice(-6)}`,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentShift.cashierName,
      shift: currentShift.shiftName,
      items: [
        {
          name: 'Modal Kas Awal Laci',
          price: currentShift.initialCash,
          total: currentShift.initialCash,
        },
        {
          name: 'Total Penjualan ATK (Tunai)',
          price: currentShift.totalCashSales,
          total: currentShift.totalCashSales,
        },
        {
          name: 'Penerimaan Servis HP',
          price: currentShift.totalServiceRevenue,
          total: currentShift.totalServiceRevenue,
        },
        {
          name: 'Pendapatan Percetakan',
          price: currentShift.totalPrintRevenue,
          total: currentShift.totalPrintRevenue,
        },
        {
          name: 'Total Laba PPOB & Pulsa',
          price: currentShift.totalPPOBProfit,
          total: currentShift.totalPPOBProfit,
        },
        {
          name: 'Total Jasa Transfer Konter',
          price: currentShift.totalTransferProfit,
          total: currentShift.totalTransferProfit,
        },
      ],
      subtotal: currentShift.expectedCash,
      grandTotal: currentShift.expectedCash,
      paymentMethod: 'Audit Kas Fisik',
      cashPaid: actualCash,
      change: Math.abs(difference),
      footerNote:
        difference === 0
          ? 'KAS SEIMBANG (PAS). Diserahkan dan diterima dengan baik.'
          : difference > 0
          ? `KAS SURPLUS / LEBIH: ${formatRupiah(difference)}`
          : `KAS KURANG / DEFISIT: ${formatRupiah(Math.abs(difference))}`,
    };

    onTriggerReceipt(receiptData);
  };

  const handleFinishShift = () => {
    onConfirmCloseShift(actualCash, shiftNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Rekap Setoran Kasir (Close Shift)</h3>
              <p className="text-[11px] text-slate-500">
                {currentShift.shiftName} · Kasir: {currentShift.cashierName} · Mulai: {formatDateTime(currentShift.startTime)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Ringkasan Akumulasi Shift */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Modal Kas Awal</span>
              <span className="text-sm font-bold text-slate-900 font-mono-num">
                {formatRupiah(currentShift.initialCash)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Penjualan ATK (Cash)</span>
              <span className="text-sm font-bold text-emerald-600 font-mono-num">
                {formatRupiah(currentShift.totalCashSales)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Servis & Cetak</span>
              <span className="text-sm font-bold text-blue-600 font-mono-num">
                {formatRupiah(currentShift.totalServiceRevenue + currentShift.totalPrintRevenue)}
              </span>
            </div>
          </div>

          {/* Kalkulasi Kas Diharapkan (Expected Cash) */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                Total Kas Sistem Diharapkan di Laci (Expected):
              </span>
              <span className="text-2xl font-black font-mono-num text-amber-400">
                {formatRupiah(currentShift.expectedCash)}
              </span>
            </div>
            <Calculator className="w-7 h-7 text-slate-500" />
          </div>

          {/* Form Input Kas Fisik */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Hitung Uang Kas Fisik di Laci (Uang Nyata):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">Rp</span>
              <input
                type="number"
                value={physicalCashInput}
                onChange={(e) => setPhysicalCashInput(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 text-lg font-bold font-mono-num border-2 border-slate-300 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Status Selisih Kas */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                difference === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : difference > 0
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {difference === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <span>
                  {difference === 0
                    ? 'Kas Seimbang / Pas (Tidak Ada Selisih)'
                    : difference > 0
                    ? 'Kas Lebih (Surplus)'
                    : 'Kas Kurang (Defisit Kasir)'}
                </span>
              </div>
              <span className="font-mono-num text-sm font-bold">
                {difference > 0 ? `+${formatRupiah(difference)}` : formatRupiah(difference)}
              </span>
            </div>
          </div>

          {/* Catatan Kasir / Pesan untuk Shift Selanjutnya */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Catatan Serah Terima / Keterangan Selisih:
            </label>
            <textarea
              rows={2}
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              placeholder="Contoh: Titipan uang kembalian receh 50rb aman, nota servis SRV-01 sudah lunas diambil pemilik..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Aksi */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintRekapShift}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Struk Rekap Shift</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              onClick={handleFinishShift}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Simpan & Tutup Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
