import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, Check, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { generate2FACode, verify2FACode } from '../utils/crypto';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isE2EEActive: boolean;
  onToggleE2EE: (active: boolean) => void;
  is2FAActive: boolean;
  onToggle2FA: (active: boolean) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  isE2EEActive,
  onToggleE2EE,
  is2FAActive,
  onToggle2FA,
}) => {
  const [testPin, setTestPin] = useState('');
  const [verifyResult, setVerifyResult] = useState<'success' | 'failed' | null>(null);
  const [currentLiveCode, setCurrentLiveCode] = useState(generate2FACode());

  if (!isOpen) return null;

  const handleRefreshLiveCode = () => {
    setCurrentLiveCode(generate2FACode());
  };

  const handleTestVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verify2FACode(testPin)) {
      setVerifyResult('success');
    } else {
      setVerifyResult('failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pusat Keamanan & Enkripsi Data</h3>
              <p className="text-[11px] text-slate-500">Integritas Transaksi & Otentikasi Toko Ju-Fat Cell</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Fitur 1: End-to-End Encryption (E2EE) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 text-sm">Enkripsi End-to-End (AES-GCM 256-bit)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isE2EEActive}
                  onChange={(e) => onToggleE2EE(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Melindungi kerahasiaan data sensitif pelanggan seperti <strong>nomor rekening bank konsumen</strong>, <strong>pola/PIN layar servis HP</strong>, dan catatan transaksi pribadi dengan enkripsi perangkat lokal berstandar industri.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Algoritma: <strong>PBKDF2-HMAC-SHA256 + AES-GCM 256</strong> (Client-Side Isolated)</span>
            </div>
          </div>

          {/* Fitur 2: Two-Factor Authentication (2FA) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-fuchsia-600" />
                <span className="font-bold text-slate-900 text-sm">Otentikasi Dua Faktor (2FA PIN / TOTP)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={is2FAActive}
                  onChange={(e) => onToggle2FA(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-600"></div>
              </label>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mewajibkan verifikasi kode 6-digit saat masuk ke akun Admin atau saat kasir melakukan tindakan sensitif (seperti mengubah harga modal, pembatalan nota, atau reset data).
            </p>

            {/* Simulasi Generator Kode 2FA Realtime */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kode 2FA Live Saat Ini (Berubah tiap 30s):
                </span>
                <button
                  type="button"
                  onClick={handleRefreshLiveCode}
                  className="text-xs text-fuchsia-600 hover:text-fuchsia-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold tracking-widest text-slate-900 bg-slate-100 px-3 py-1 rounded">
                  {currentLiveCode}
                </span>
                <span className="text-[11px] text-slate-400">PIN Master Darurat: <strong className="text-slate-700">888999</strong></span>
              </div>
            </div>

            {/* Uji Coba Verifikasi Kode */}
            <form onSubmit={handleTestVerify} className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Uji Verifikasi Kode PIN:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={testPin}
                  onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6 digit..."
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono tracking-widest"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800"
                >
                  Verifikasi
                </button>
              </div>

              {verifyResult === 'success' && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kode VALID! Akses aman diotorisasi.</span>
                </div>
              )}
              {verifyResult === 'failed' && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  <span>Kode salah atau kadaluarsa. Coba kode live di atas atau master PIN 888999.</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
