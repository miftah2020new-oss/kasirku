import React, { useState } from 'react';
import { User, ShiftSession } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  LayoutDashboard,
  Wallet,
  History as HistoryIcon,
  ShoppingCart,
  Building2,
  Zap,
  Wrench,
  Printer,
  BookOpen,
  RotateCcw,
  Package,
  Tag,
  ListFilter,
  BarChart2,
  ShoppingBag,
  ClipboardCheck,
  LogOut,
  Clock,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Smartphone,
  CreditCard,
  FileText,
  FileCheck,
} from 'lucide-react';

export type AppNavSection =
  | 'dashboard'
  | 'kas_harian'
  | 'riwayat'
  | 'pos_atk'
  | 'brilink'
  | 'ppob'
  | 'service_hp'
  | 'percetakan'
  | 'piutang'
  | 'retur'
  | 'produk'
  | 'kategori'
  | 'jenis_transaksi'
  | 'stok'
  | 'stok_opname'
  | 'pembelian'
  | 'laporan';

interface SidebarProps {
  currentSection: AppNavSection;
  onSelectSection: (section: AppNavSection, categoryFilter?: string) => void;
  currentUser: User;
  currentShift: ShiftSession;
  onLogout: () => void;
  onOpenCloseShift: () => void;
  onOpenSecurity: () => void;
  onOpenArchitecture: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  serviceBadgeCount?: number;
  debtBadgeCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  currentUser,
  currentShift,
  onLogout,
  onOpenCloseShift,
  onOpenSecurity,
  onOpenArchitecture,
  isMobileOpen,
  onCloseMobile,
  serviceBadgeCount,
  debtBadgeCount,
  lowStockCount,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // State untuk toggle accordion kategori di sidebar
  const [expandedLayanan, setExpandedLayanan] = useState<string>('pos_atk');

  const toggleExpand = (key: string) => {
    setExpandedLayanan((prev) => (prev === key ? '' : key));
  };

  const handleNav = (section: AppNavSection, categoryFilter?: string) => {
    onSelectSection(section, categoryFilter);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container - Dark Navy Theme Sesuai Gambar catatkonter (#112035) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#112035] text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Toko / Brand: Ju-Fat Cell POINT OF SALE */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={false} />
            <div>
              <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                Ju-Fat Cell
              </h2>
              <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                POINT OF SALE
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 no-scrollbar text-xs">
          {/* Kelompok 1: Navigasi Utama */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'dashboard'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNav('kas_harian')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'kas_harian'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4 text-slate-400" />
              <span>Kas Harian</span>
            </button>

            <button
              onClick={() => handleNav('riwayat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'riwayat'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <HistoryIcon className="w-4 h-4 text-slate-400" />
              <span>Riwayat Transaksi</span>
            </button>
          </div>

          {/* ================= Kelompok 2: LAYANAN (DENGAN KATEGORI DI SIDE BAR) ================= */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>LAYANAN & KATEGORI</span>
              <span className="text-[9px] text-amber-400/90 font-mono">7 Layanan</span>
            </div>

            {/* 1. Kasir (ATK & Aksesoris) + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'pos_atk'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('pos_atk');
                  toggleExpand('pos_atk');
                }}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Kasir (ATK & Aksesoris)</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    expandedLayanan === 'pos_atk' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Kategori di Sidebar Layanan Kasir ATK */}
              {expandedLayanan === 'pos_atk' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('pos_atk', 'all')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Semua Kategori ATK</span>
                  </button>
                  <button
                    onClick={() => handleNav('pos_atk', 'ATK & Alat Tulis')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Alat Tulis & Kantor</span>
                  </button>
                  <button
                    onClick={() => handleNav('pos_atk', 'Kertas & Pembukuan')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Kertas & Pembukuan</span>
                  </button>
                  <button
                    onClick={() => handleNav('pos_atk', 'Kabel & Adaptor Charger')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Kabel & Charger HP</span>
                  </button>
                  <button
                    onClick={() => handleNav('pos_atk', 'Tempered Glass & Proteksi')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Tempered Glass & Case</span>
                  </button>
                  <button
                    onClick={() => handleNav('pos_atk', 'Aksesoris Audio & Gadget')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span>Audio & Headset Gadget</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. BRILink / Transfer Bank + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'brilink'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('brilink');
                  toggleExpand('brilink');
                }}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4" />
                  <span>BRILink / Transfer Bank</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    expandedLayanan === 'brilink' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Kategori di Sidebar Transfer Bank */}
              {expandedLayanan === 'brilink' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('brilink')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>Transfer Bank (BRI, BCA, Mandiri)</span>
                  </button>
                  <button
                    onClick={() => handleNav('brilink')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Tarik Tunai Agen</span>
                  </button>
                  <button
                    onClick={() => handleNav('brilink')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Top Up E-Wallet (DANA, OVO, ShopeePay)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Server Pulsa / PPOB + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'ppob'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('ppob');
                  toggleExpand('ppob');
                }}
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4" />
                  <span>Server Pulsa/PPOB</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    expandedLayanan === 'ppob' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Kategori di Sidebar PPOB */}
              {expandedLayanan === 'ppob' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('ppob')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Pulsa & Paket Kuota</span>
                  </button>
                  <button
                    onClick={() => handleNav('ppob')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span>Token Listrik PLN</span>
                  </button>
                  <button
                    onClick={() => handleNav('ppob')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Tagihan BPJS & PDAM</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Service HP + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'service_hp'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('service_hp');
                  toggleExpand('service_hp');
                }}
              >
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4" />
                  <span>Service HP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {serviceBadgeCount ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-fuchsia-600 text-white">
                      {serviceBadgeCount}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      expandedLayanan === 'service_hp' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Kategori di Sidebar Service HP */}
              {expandedLayanan === 'service_hp' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('service_hp')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Form Penerimaan HP</span>
                  </button>
                  <button
                    onClick={() => handleNav('service_hp')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Daftar Antrean & Diproses</span>
                  </button>
                  <button
                    onClick={() => handleNav('service_hp')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>HP Selesai & Siap Diambil</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Percetakan & Jilid + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'percetakan'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('percetakan');
                  toggleExpand('percetakan');
                }}
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4" />
                  <span>Percetakan & Jilid</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    expandedLayanan === 'percetakan' ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Kategori di Sidebar Percetakan */}
              {expandedLayanan === 'percetakan' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('percetakan')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>Print Dokumen (A4 / F4)</span>
                  </button>
                  <button
                    onClick={() => handleNav('percetakan')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>Jilid Lakban & Spiral</span>
                  </button>
                  <button
                    onClick={() => handleNav('percetakan')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Cetak Foto & Banner</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. Buku Piutang (Hutang) + Kategori Sub-Menu */}
            <div className="rounded-lg overflow-hidden bg-slate-900/40">
              <div
                className={`w-full flex items-center justify-between px-3 py-2 font-medium transition-colors cursor-pointer ${
                  currentSection === 'piutang'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
                onClick={() => {
                  handleNav('piutang');
                  toggleExpand('piutang');
                }}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4" />
                  <span>Buku Piutang (Hutang)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {debtBadgeCount ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                      {debtBadgeCount}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      expandedLayanan === 'piutang' ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Kategori di Sidebar Piutang */}
              {expandedLayanan === 'piutang' && (
                <div className="bg-[#0b1625] py-1.5 px-3 pl-8 space-y-1 border-t border-slate-800/60 text-[11px]">
                  <button
                    onClick={() => handleNav('piutang')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>Daftar Hutang Belum Lunas</span>
                  </button>
                  <button
                    onClick={() => handleNav('piutang')}
                    className="w-full text-left py-1 text-slate-400 hover:text-amber-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Pembayaran Cicilan & Nota</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Retur / Garansi Servis */}
            <button
              onClick={() => handleNav('retur')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'retur'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4" />
                <span>Retur / Garansi Servis</span>
              </div>
            </button>
          </div>

          {/* ================= Kelompok 3: KELOLA PRODUK ================= */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              KELOLA PRODUK
            </div>

            <button
              onClick={() => handleNav('produk')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'produk'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span>Produk Dagangan</span>
            </button>

            <button
              onClick={() => handleNav('kategori')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'kategori'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4 text-slate-400" />
              <span>Kategori Produk</span>
            </button>

            <button
              onClick={() => handleNav('jenis_transaksi')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'jenis_transaksi'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ListFilter className="w-4 h-4 text-slate-400" />
              <span>Jenis Transaksi</span>
            </button>
          </div>

          {/* ================= Kelompok 4: KELOLA STOK ================= */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              KELOLA STOK
            </div>

            <button
              onClick={() => handleNav('stok')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'stok'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4 text-slate-400" />
                <span>Stok Barang</span>
              </div>
              {lowStockCount ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {lowStockCount} menipis
                </span>
              ) : null}
            </button>

            <button
              onClick={() => handleNav('stok_opname')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'stok_opname'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Stok Opname (Audit)</span>
            </button>

            <button
              onClick={() => handleNav('pembelian')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                currentSection === 'pembelian'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>Pembelian (Kulakan)</span>
            </button>
          </div>

          {/* ================= Kelompok 5: LAPORAN (Khusus Admin) ================= */}
          {isAdmin && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                LAPORAN KEUANGAN
              </div>
              <button
                onClick={() => handleNav('laporan')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  currentSection === 'laporan'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Laba Rugi & Omset</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Sidebar: User Profile & Shift Controls (Sesuai Gambar screenshot) */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0c1829] space-y-2">
          {/* Info Pengguna Aktif */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-800/60 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white truncate text-[11px] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>{currentShift.shiftName}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Keluar Akun"
              className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Tombol Aksi Cepat Bawah: Tutup Shift & Keamanan */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={onOpenCloseShift}
              className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Rekap Setoran Kasir"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Tutup Shift</span>
            </button>

            <button
              onClick={onOpenSecurity}
              className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Keamanan E2EE & 2FA"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>E2EE & 2FA</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
