import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { appStorage } from '../utils/storage';
import { BrandLogo } from './BrandLogo';
import { verify2FACode } from '../utils/crypto';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  AlertCircle,
  User as UserIcon,
  CheckCircle2,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  // Cek apakah sudah ada akun yang pernah didaftarkan
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() =>
    appStorage.getRegisteredUsers()
  );

  // Jika belum ada akun, otomatis arahkan ke form pendaftaran (Registrasi)
  const [mode, setMode] = useState<'login' | 'register'>(() =>
    appStorage.getRegisteredUsers().length === 0 ? 'register' : 'login'
  );

  // Form login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form pendaftaran / registrasi baru
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regRole, setRegRole] = useState<UserRole>('admin');

  // Error & Feedback
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 2FA state
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  // Handler LOGIN
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Harap masukkan email/username dan kata sandi.');
      return;
    }

    const matchedUser = appStorage.authenticateUser(email, password);

    if (!matchedUser) {
      setErrorMessage(
        'Email atau kata sandi tidak cocok. Jika Anda belum memiliki akun, silakan klik tab "Daftar Akun".'
      );
      return;
    }

    if (matchedUser.twoFactorEnabled) {
      setPendingUser(matchedUser);
      setShow2FAPrompt(true);
      return;
    }

    onLoginSuccess(matchedUser);
  };

  // Handler REGISTRASI AKUN BARU
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter demi keamanan akun.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    try {
      const newUser = appStorage.registerUser(
        regFullName,
        regEmail,
        regPassword,
        regRole
      );
      // Update list pengguna lokal
      setRegisteredUsers(appStorage.getRegisteredUsers());
      // Langsung login otomatis setelah berhasil daftar
      onLoginSuccess(newUser);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mendaftar akun baru.');
    }
  };

  // Verifikasi 2FA jika aktif
  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    if (verify2FACode(totpCode)) {
      setShow2FAPrompt(false);
      onLoginSuccess(pendingUser);
    } else {
      setErrorMessage('Kode OTP salah atau telah kadaluarsa. Master PIN: 888999');
    }
  };

  const isFirstTimeRegistration = registeredUsers.length === 0;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50">
      {/* ================= PANEL KIRI - BRANDING HERO (Sesuai contoh depan warna.png) ================= */}
      <div className="w-full md:w-5/12 bg-[#101e35] p-8 md:p-14 flex flex-col justify-between text-white relative overflow-hidden shrink-0">
        {/* Dekorasi lingkaran melengkung halus di latar belakang */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full border border-slate-700/40 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full border border-slate-700/30 pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full bg-fuchsia-600/10 blur-3xl pointer-events-none" />

        {/* Logo Container Putih dengan JF Brother persis seperti gambar yang dilampirkan */}
        <div className="relative z-10">
          <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-3xl shadow-2xl flex items-center justify-center p-3 mb-8 border border-white/40 ring-4 ring-white/10 transition-transform hover:scale-105">
            <img
              src="/logo.svg"
              alt="Ju-Fat Cell - JF Brother"
              className="w-full h-full object-contain select-none"
            />
          </div>

          <div className="space-y-4 max-w-md">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 inline-block">
              JU-FAT CELL
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
              Semua layanan, <br />
              <span className="text-amber-400">satu kendali.</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed pt-2">
              Kelola transaksi kasir, service HP, stok ATK, PPOB, transfer bank,
              dan laporan keuangan toko Anda dengan ritme kerja yang lebih rapi dan ringan.
            </p>
          </div>
        </div>

        {/* Keamanan & Trust Badge Bawah */}
        <div className="relative z-10 pt-8 mt-auto border-t border-slate-700/60 flex flex-col gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Enkripsi End-to-End (E2EE) & Multi-Shift Kasir</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Data dagangan & transaksi tersimpan privat di perangkat Anda.
          </p>
        </div>
      </div>

      {/* ================= PANEL KANAN - FORMULIR LOGIN & REGISTRASI ================= */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 md:p-14 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header Brand Lockup */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" showText={false} />
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">Ju-Fat Cell</h2>
                <p className="text-xs text-slate-500 font-medium">Multi-Layanan POS</p>
              </div>
            </div>

            {/* Toggle Tab Masuk vs Daftar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Akun</span>
              </button>
            </div>
          </div>

          {!show2FAPrompt ? (
            mode === 'login' ? (
              /* ================== FORM LOGIN ================== */
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 block mb-1">
                    SELAMAT DATANG
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Masuk ke Akun Toko</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan masukkan email/username dan kata sandi yang telah Anda daftarkan.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email / Username Kasir / Admin
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Contoh: miftah atau admin@jufatcell.id"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-4 pr-11 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-md transition-colors cursor-pointer"
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-slate-600" />
                        ) : (
                          <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Belum memiliki akun toko?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage('');
                      }}
                      className="text-slate-900 font-bold hover:underline cursor-pointer"
                    >
                      Daftar Akun Baru Sekarang
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* ================== FORM REGISTRASI AKUN BARU ================== */
              <div className="space-y-5">
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 block mb-1">
                    PENDAFTARAN PENGGUNA TOKO
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    {isFirstTimeRegistration
                      ? 'Buat Akun Pemilik Toko Pertama'
                      : 'Buat Akun Baru (Pemilik / Kasir)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isFirstTimeRegistration
                      ? 'Daftarkan akun admin Anda untuk mulai mengisi data dagangan sendiri dan mengelola penjualan.'
                      : 'Daftarkan akun kasir atau pengelola baru sesuai shift kerja.'}
                  </p>
                </div>

                {isFirstTimeRegistration && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Mulai dengan data bersih:</span> Data barang dagangan kosong dan siap Anda isi sendiri dengan produk yang Anda perjualkan.
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap Anda *
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Contoh: Miftah"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email / Username Login *
                    </label>
                    <input
                      type="text"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="Contoh: miftah atau owner@jufatcell.id"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Hak Akses / Peran Akun *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('admin')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          regRole === 'admin'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs">Admin</div>
                        <div className="text-[10px] opacity-80">Akses Penuh</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('shift1')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          regRole === 'shift1'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs">Shift 1</div>
                        <div className="text-[10px] opacity-80">Kasir Pagi</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRegRole('shift2')}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          regRole === 'shift2'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="font-bold text-xs">Shift 2</div>
                        <div className="text-[10px] opacity-80">Kasir Sore</div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kata Sandi *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 karakter"
                          className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                          title={showRegPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                          aria-label={showRegPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Konfirmasi Sandi *
                      </label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Ulangi sandi"
                          className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                          title={showRegConfirmPassword ? 'Sembunyikan konfirmasi sandi' : 'Lihat konfirmasi sandi'}
                          aria-label={showRegConfirmPassword ? 'Sembunyikan konfirmasi sandi' : 'Lihat konfirmasi sandi'}
                        >
                          {showRegConfirmPassword ? (
                            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
                  >
                    <span>Daftar & Masuk Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                      }}
                      className="text-slate-900 font-bold hover:underline cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </p>
                </div>
              </div>
            )
          ) : (
            /* Modal / Layar Verifikasi 2FA */
            <div className="space-y-6">
              <div className="p-4 bg-fuchsia-50 border border-fuchsia-200 rounded-xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-fuchsia-100 text-fuchsia-700 mx-auto flex items-center justify-center">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Verifikasi Dua Faktor (2FA)</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Akun <strong>{pendingUser?.name}</strong> dilindungi dengan 2FA. Masukkan kode 6 digit dari aplikasi autentikator Anda atau master PIN.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                    KODE VERIFIKASI 6-DIGIT
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 888999"
                    autoFocus
                    required
                    className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-slate-300 rounded-lg focus:border-slate-900 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 text-center mt-2">
                    💡 Kode Master Cepat: <span className="font-mono font-bold text-slate-800">888999</span>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-fuchsia-700 hover:bg-fuchsia-800 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Konfirmasi & Buka Kasir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShow2FAPrompt(false);
                    setTotpCode('');
                    setErrorMessage('');
                  }}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 text-center cursor-pointer"
                >
                  Kembali
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
