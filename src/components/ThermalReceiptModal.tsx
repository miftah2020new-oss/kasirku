import React, { useState } from 'react';
import { ReceiptData } from '../types';
import { formatRupiah } from '../utils/formatters';
import { Printer, X, Check, Scissors } from 'lucide-react';

interface ThermalReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  receipt,
  onClose,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const divider = '--------------------------------';
    const lines = [
      'JU-FAT CELL',
      'Multi-Layanan & Service HP',
      'Jl. Raya Utama No. 88, Telp/WA: 0812-3456-7890',
      divider,
      `No Nota : ${receipt.receiptNumber}`,
      `Tanggal : ${receipt.date}`,
      `Kasir   : ${receipt.cashierName} (${receipt.shift})`,
      receipt.customerName ? `Pelanggan: ${receipt.customerName}` : '',
      divider,
      ...receipt.items.map(
        (it) =>
          `${it.name} ${it.qty ? `x${it.qty}` : ''}\n   ${formatRupiah(it.price)} -> ${formatRupiah(it.total)}`
      ),
      divider,
      `Total Belanja : ${formatRupiah(receipt.grandTotal)}`,
      receipt.cashPaid ? `Bayar Tunai   : ${formatRupiah(receipt.cashPaid)}` : '',
      receipt.change !== undefined ? `Kembalian     : ${formatRupiah(receipt.change)}` : '',
      receipt.remainingDebt ? `Sisa Hutang   : ${formatRupiah(receipt.remainingDebt)}` : '',
      divider,
      receipt.footerNote || 'Terima kasih atas kunjungan Anda!',
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-slate-900 text-sm">Preview Struk Cetak Thermal</h3>
          </div>

          {/* Toggle Ukuran Kertas 58mm / 80mm */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                paperWidth === '58mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              58mm
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                paperWidth === '80mm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Struk Content Viewport */}
        <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center items-start flex-1">
          {/* Box Kertas Struk Thermal */}
          <div
            id="printable-receipt"
            className={`bg-white p-5 rounded-sm shadow-md font-mono-num text-xs text-slate-900 leading-snug transition-all ${
              paperWidth === '58mm' ? 'w-[280px]' : 'w-[380px]'
            }`}
          >
            {/* Header Toko */}
            <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-slate-400">
              <h4 className="font-bold text-base tracking-tight uppercase">JU-FAT CELL</h4>
              <p className="text-[11px] text-slate-700">Multi-Layanan POS & Service HP</p>
              <p className="text-[10px] text-slate-500">Jl. Raya Utama No. 88 (Samping BRI)</p>
              <p className="text-[10px] text-slate-500">Telp / WA: 0812-3456-7890</p>
            </div>

            {/* Info Transaksi */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu:</span>
                <span>{receipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{receipt.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift:</span>
                <span>{receipt.shift}</span>
              </div>
              {receipt.customerName && (
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Pelanggan:</span>
                  <span>{receipt.customerName}</span>
                </div>
              )}
            </div>

            {/* Khusus Tanda Terima Service HP */}
            {receipt.isServiceReceipt && receipt.serviceDetails && (
              <div className="py-2.5 my-1 bg-slate-50 p-2 border border-slate-300 rounded text-[11px] space-y-1">
                <div className="font-bold text-center text-slate-900 pb-1 border-b border-slate-200">
                  TANDA TERIMA SERVICE HP
                </div>
                <div>
                  <span className="text-slate-500">Perangkat: </span>
                  <span className="font-bold">{receipt.serviceDetails.device}</span>
                </div>
                <div>
                  <span className="text-slate-500">Keluhan: </span>
                  <span>{receipt.serviceDetails.issue}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Estimasi Biaya:</span>
                  <span className="font-bold">{formatRupiah(receipt.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Uang Muka (DP):</span>
                  <span>{formatRupiah(receipt.serviceDetails.dp)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 pt-1">
                  <span>Sisa Pelunasan:</span>
                  <span>{formatRupiah(receipt.serviceDetails.remaining)}</span>
                </div>
              </div>
            )}

            {/* Daftar Item Belanja / Transaksi */}
            <div className="py-2.5 space-y-2 border-b border-dashed border-slate-400">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600 border-b border-slate-200 pb-1">
                <span>ITEM / LAYANAN</span>
                <span>TOTAL</span>
              </div>
              {receipt.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-medium pr-2">{item.name}</span>
                    <span className="font-bold shrink-0">{formatRupiah(item.total)}</span>
                  </div>
                  {item.qty && item.qty > 1 && (
                    <div className="text-[10px] text-slate-500">
                      {item.qty} x {formatRupiah(item.price)}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-[10px] text-slate-500 italic">
                      Ket: {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Perhitungan Pembayaran */}
            <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(receipt.subtotal)}</span>
              </div>
              {receipt.discount && receipt.discount > 0 ? (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(receipt.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span>{formatRupiah(receipt.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Metode Pembayaran</span>
                <span className="font-semibold">{receipt.paymentMethod}</span>
              </div>
              {receipt.cashPaid !== undefined && (
                <div className="flex justify-between">
                  <span>Uang Diterima</span>
                  <span>{formatRupiah(receipt.cashPaid)}</span>
                </div>
              )}
              {receipt.change !== undefined && (
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Kembalian</span>
                  <span>{formatRupiah(receipt.change)}</span>
                </div>
              )}
              {receipt.remainingDebt !== undefined && receipt.remainingDebt > 0 && (
                <div className="flex justify-between font-bold text-red-600 bg-red-50 p-1 rounded">
                  <span>SISA HUTANG (PIUTANG)</span>
                  <span>{formatRupiah(receipt.remainingDebt)}</span>
                </div>
              )}
            </div>

            {/* Footer & Syarat Ketentuan */}
            <div className="pt-3 text-center space-y-1 text-[10px] text-slate-500">
              <p className="font-bold text-slate-700">
                {receipt.footerNote || 'Terima kasih atas kunjungan Anda!'}
              </p>
              {receipt.isServiceReceipt ? (
                <p className="leading-tight text-[9px] text-slate-400 border-t border-slate-200 pt-1">
                  * Garansi servis 7 hari untuk kerusakan yang sama.
                  <br />* Barang servis tidak diambil &gt; 30 hari di luar tanggung jawab konter.
                  <br />* Harap bawa nota ini saat pengambilan unit.
                </p>
              ) : (
                <p className="leading-tight text-[9px] text-slate-400">
                  Barang yang sudah dibeli dapat ditukar maksimal 1x24 jam dengan membawa struk ini.
                </p>
              )}
              <div className="pt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400">
                <Scissors className="w-3 h-3" />
                <span>Gunting di sini</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi Bawah */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handleCopyText}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            <span>{copied ? 'Tersalin!' : 'Salin Teks Nota (WA)'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ke Printer Thermal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
