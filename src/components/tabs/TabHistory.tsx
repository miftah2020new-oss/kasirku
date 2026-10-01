import React, { useState } from 'react';
import { PosTransaction, User, ReceiptData } from '../../types';
import { formatRupiah, formatDateTime, exportToCSV } from '../../utils/formatters';
import { Search, Printer, FileSpreadsheet, History as HistoryIcon, Calendar } from 'lucide-react';

interface TabHistoryProps {
  transactions: PosTransaction[];
  currentUser: User;
  onPrintReceipt: (receipt: ReceiptData) => void;
}

export const TabHistory: React.FC<TabHistoryProps> = ({
  transactions,
  currentUser,
  onPrintReceipt,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Filter based on role: Kasir hanya bisa melihat transaksi shift miliknya
  const accessibleTxs = isAdmin
    ? transactions
    : transactions.filter((tx) => tx.cashierId === currentUser.id);

  const filtered = accessibleTxs.filter((tx) => {
    const matchesSearch =
      tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.itemsSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handlePrintAgain = (tx: PosTransaction) => {
    const receiptData: ReceiptData = {
      title: 'SALINAN STRUK TRANSAKSI',
      subtitle: 'JU-FAT CELL POS',
      receiptNumber: tx.invoiceNumber,
      date: formatDateTime(tx.createdAt),
      cashierName: tx.cashierName,
      shift: tx.shift,
      customerName: tx.customerName,
      customerPhone: tx.customerPhone,
      items: tx.itemsList && tx.itemsList.length > 0
        ? tx.itemsList.map((it) => ({
            name: it.product.name,
            qty: it.quantity,
            price: it.product.sellingPrice,
            total: it.subtotal,
          }))
        : [
            {
              name: tx.itemsSummary,
              price: tx.totalAmount,
              total: tx.totalAmount,
            },
          ],
      subtotal: tx.subtotal,
      grandTotal: tx.totalAmount,
      paymentMethod: tx.paymentMethod,
      cashPaid: tx.customerPaid,
      change: tx.change,
      footerNote: 'Salinan bukti transaksi sah Ju-Fat Cell.',
    };

    onPrintReceipt(receiptData);
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Nota / Invoice',
      'Tanggal & Waktu',
      'Jenis Layanan',
      'Daftar Item / Rincian',
      'Total Belanja (Rp)',
      'Metode Bayar',
      'Nama Pelanggan',
      'Kasir',
      'Shift',
    ];

    const rows = filtered.map((tx) => [
      tx.invoiceNumber,
      formatDateTime(tx.createdAt),
      tx.type,
      tx.itemsSummary,
      tx.totalAmount,
      tx.paymentMethod,
      tx.customerName || '-',
      tx.cashierName,
      tx.shift,
    ]);

    exportToCSV(`Riwayat_Transaksi_JuFatCell_${new Date().toISOString().slice(0, 10)}`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Riwayat Transaksi Penjualan Lengkap</h3>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? 'Seluruh riwayat transaksi toko Ju-Fat Cell lintas shift'
              : `Riwayat transaksi sesi kerja Anda (${currentUser.name})`}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
          <span>Ekspor Riwayat (Excel/CSV)</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no nota, rincian barang, atau pelanggan..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {(['all', 'ATK', 'Service', 'PPOB', 'Transfer', 'Percetakan'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                filterType === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? `Semua (${accessibleTxs.length})` : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Layanan</th>
                <th className="py-3 px-4">Ringkasan Item</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                {isAdmin && <th className="py-3 px-4 text-right">Laba Kotor</th>}
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Kasir / Shift</th>
                <th className="py-3 px-4 text-center">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {tx.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatDateTime(tx.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                    {tx.itemsSummary}
                    {tx.customerName && (
                      <span className="text-[10px] text-slate-400 block">
                        Pelanggan: {tx.customerName}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                    {formatRupiah(tx.totalAmount)}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right font-mono-num text-emerald-600 font-semibold">
                      +{formatRupiah(tx.profit)}
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.paymentMethod === 'Hutang'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {tx.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {tx.cashierName} ({tx.shift})
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handlePrintAgain(tx)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
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
