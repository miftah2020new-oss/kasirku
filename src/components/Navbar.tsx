import React from 'react';
import { User, ShiftSession } from '../types';
import { BrandLogo } from './BrandLogo';
import {
  ShieldCheck,
  LogOut,
  Clock,
  User as UserIcon,
  Lock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  currentShift: ShiftSession;
  onLogout: () => void;
  onOpenCloseShiftModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenArchitectureModal: () => void;
  isE2EEActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentShift,
  onLogout,
  onOpenCloseShiftModal,
  onOpenSecurityModal,
  onOpenArchitectureModal,
  isE2EEActive,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Sisi Kiri: Brand & Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showText={true} />
        </div>

        {/* Sisi Tengah: Info Shift & Kasir */}
        <div className="hidden md:flex items-center gap-2">
          {/* Badge Role */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-900">{currentUser.name}</span>
            <span className="text-slate-300">|</span>
            <span className="capitalize px-1.5 py-0.5 rounded text-[11px] font-bold bg-white text-slate-800 shadow-xs">
              {currentUser.role === 'admin' ? 'Pemilik Toko (Full Access)' : currentShift.shiftName}
            </span>
          </div>

          {/* Status E2EE */}
          <button
            onClick={onOpenSecurityModal}
            title="Keamanan Enkripsi End-to-End & 2FA"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold">{isE2EEActive ? 'E2EE & 2FA Aktif' : 'Security'}</span>
          </button>

          {/* Tombol Arsitektur & DDL DB */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
            title="Lihat Arsitektur Sistem, Relasi ERD & Skrip DDL Basis Data"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Arsitektur & DB</span>
          </button>
        </div>

        {/* Sisi Kanan: Aksi Cepat & Logout */}
        <div className="flex items-center gap-2">
          {/* Tombol Rekap Setoran / Tutup Shift */}
          <button
            onClick={onOpenCloseShiftModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-xs"
            title="Hitung Kas Fisik & Rekap Pergantian Shift"
          >
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Rekap / Tutup Shift</span>
            <span className="sm:hidden">Shift</span>
          </button>

          {/* Tombol Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-all"
            title="Keluar / Ganti Akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
