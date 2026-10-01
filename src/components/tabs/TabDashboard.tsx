import React from 'react';
import {
  PosTransaction,
  ServiceRecord,
  PPOBTransaction,
  MoneyTransferRecord,
  PrintOrder,
  DebtRecord,
  Product,
  User,
  ShiftSession,
} from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Wrench,
  Zap,
  Building2,
  Printer,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { AppNavSection } from '../Sidebar';

interface TabDashboardProps {
  transactions: PosTransaction[];
  services: ServiceRecord[];
  ppobTxs: PPOBTransaction[];
  transfers: MoneyTransferRecord[];
  printOrders: PrintOrder[];
  debts: DebtRecord[];
  products: Product[];
  currentUser: User;
  currentShift: ShiftSession;
  onNavigate: (section: AppNavSection) => void;
}

export const TabDashboard: React.FC<TabDashboardProps> = ({
  transactions,
  services,
  ppobTxs,
  transfers,
  printOrders,
  debts,
  products,
  currentUser,
  currentShift,
  onNavigate,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Perhitungan Hari Ini
  const todayAtk = transactions.reduce((a, b) => a + b.totalAmount, 0);
  const todayService = services.reduce((a, b) => a + b.finalCost, 0);
  const todayPpob = ppobTxs.reduce((a, b) => a + b.sellingPrice, 0);
  const todayTransferVol = transfers.reduce((a, b) => a + b.transferAmount, 0);
  const todayTransferFee = transfers.reduce((a, b) => a + b.counterFee, 0);
  const todayPrint = printOrders.reduce((a, b) => a + b.totalPrice, 0);

  const totalOmset = todayAtk + todayService + todayPpob + todayTransferFee + todayPrint;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const activeServices = services.filter((s) => s.status === 'Diproses');
  const outstandingDebts = debts.filter((d) => d.status === 'Belum Lunas');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#122238] to-[#1c3354] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
              JU-FAT CELL POS
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Online
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Selamat Bertugas, {currentUser.name}!
          </h2>
          <p className="text-xs text-slate-300">
            Sesi aktif: <strong>{currentShift.shiftName}</strong> · Kasir: {currentShift.cashierName} · Modal kas awal:{' '}
            <span className="font-mono text-amber-300">{formatRupiah(currentShift.initialCash)}</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos_atk')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir ATK</span>
          </button>
          <button
            onClick={() => onNavigate('ppob')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Pulsa/PPOB</span>
          </button>
          <button
            onClick={() => onNavigate('brilink')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>BRILink</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset Hari Ini */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {isAdmin ? 'Total Omset Keseluruhan' : 'Pendapatan Shift Ini'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatRupiah(isAdmin ? totalOmset : currentShift.expectedCash)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>5 Layanan Terintegrasi</span>
          </span>
        </div>

        {/* Servis Sedang Diproses */}
        <div
          onClick={() => onNavigate('service_hp')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Service HP Diproses
            </span>
            <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></span>
          </div>
          <div className="text-2xl font-black font-mono text-fuchsia-700">
            {activeServices.length} Unit
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5" />
            <span>Klik untuk kelola status servis</span>
          </span>
        </div>

        {/* Peringatan Stok Menipis */}
        <div
          onClick={() => onNavigate('stok')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Stok Menipis
            </span>
            {lowStockProducts.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              lowStockProducts.length > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {lowStockProducts.length} Produk
          </div>
          <span className="text-[11px] text-slate-500">Perlu kulakan/restock segera</span>
        </div>

        {/* Piutang Pelanggan */}
        <div
          onClick={() => onNavigate('piutang')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Buku Piutang Belum Lunas
          </span>
          <div className="text-2xl font-black font-mono text-red-600">
            {formatRupiah(outstandingDebts.reduce((a, b) => a + b.remainingDebt, 0))}
          </div>
          <span className="text-[11px] text-slate-500">
            {outstandingDebts.length} Pelanggan kasbon
          </span>
        </div>
      </div>

      {/* Grid Menu Layanan Cepat (Sesuai Kategori Sidebar) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Kategori Layanan Ju-Fat Cell</h3>
          <p className="text-xs text-slate-500">Pilih layanan untuk membuka transaksi kasir</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Kasir ATK */}
          <button
            onClick={() => onNavigate('pos_atk')}
            className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Kasir ATK</div>
              <div className="text-[10px] text-slate-500">Alat Tulis & Aksesoris</div>
            </div>
          </button>

          {/* BRILink */}
          <button
            onClick={() => onNavigate('brilink')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">BRILink</div>
              <div className="text-[10px] text-slate-500">Transfer & Tarik Tunai</div>
            </div>
          </button>

          {/* PPOB */}
          <button
            onClick={() => onNavigate('ppob')}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Pulsa & PPOB</div>
              <div className="text-[10px] text-slate-500">PLN, BPJS, E-Wallet</div>
            </div>
          </button>

          {/* Service HP */}
          <button
            onClick={() => onNavigate('service_hp')}
            className="p-4 rounded-xl border border-slate-200 hover:border-fuchsia-400 hover:bg-fuchsia-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Service HP</div>
              <div className="text-[10px] text-slate-500">Hardware & Software</div>
            </div>
          </button>

          {/* Percetakan */}
          <button
            onClick={() => onNavigate('percetakan')}
            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Percetakan</div>
              <div className="text-[10px] text-slate-500">Print, Jilid, Banner</div>
            </div>
          </button>

          {/* Buku Piutang */}
          <button
            onClick={() => onNavigate('piutang')}
            className="p-4 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/30 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Buku Piutang</div>
              <div className="text-[10px] text-slate-500">Hutang & Cicilan</div>
            </div>
          </button>
        </div>
      </div>

      {/* Servis HP yang Sedang Dikerjakan & Peringatan Stok */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrean Servis HP */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Antrean Service HP Berjalan
            </h4>
            <button
              onClick={() => onNavigate('service_hp')}
              className="text-xs text-fuchsia-600 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {services.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{s.phoneBrandModel}</div>
                  <div className="text-[11px] text-slate-500">
                    {s.customerName} · {s.serviceNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      s.status === 'Selesai'
                        ? 'bg-emerald-50 text-emerald-700'
                        : s.status === 'Diproses'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.status}
                  </span>
                  <div className="text-[11px] font-bold font-mono text-slate-800 mt-0.5">
                    {formatRupiah(s.finalCost)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peringatan Stok Menipis */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Peringatan Stok Menipis (Perlu Restock)
            </h4>
            <button
              onClick={() => onNavigate('stok')}
              className="text-xs text-amber-600 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Kelola Stok</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    SKU: {p.sku} · Kategori: {p.categoryName}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs">
                    Sisa: {p.stock} {p.unit}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">Min: {p.minStock} {p.unit}</div>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Semua stok barang aman di atas batas minimum.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
