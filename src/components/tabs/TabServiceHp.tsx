import React, { useState } from 'react';
import { ServiceRecord, ServiceStatus, User, ReceiptData, ShiftSession } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { encryptData } from '../../utils/crypto';
import {
  Wrench,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface TabServiceHpProps {
  services: ServiceRecord[];
  currentUser: User;
  currentShift: ShiftSession;
  onAddNewService: (record: ServiceRecord, receipt: ReceiptData) => void;
  onUpdateServiceStatus: (
    serviceId: string,
    newStatus: ServiceStatus,
    finalCost?: number,
    additionalCashReceived?: number,
    receipt?: ReceiptData
  ) => void;
  onPrintTicket: (receipt: ReceiptData) => void;
  isE2EEActive: boolean;
}

export const TabServiceHp: React.FC<TabServiceHpProps> = ({
  services,
  currentUser,
  currentShift,
  onAddNewService,
  onUpdateServiceStatus,
  onPrintTicket,
  isE2EEActive,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form penerimaan HP
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneBrandModel, setPhoneBrandModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [passcodeOrPattern, setPasscodeOrPattern] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [accessories, setAccessories] = useState<string[]>(['Unit HP']);

  // Modal pelunasan saat status diambil
  const [settleService, setSettleService] = useState<ServiceRecord | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');

  const toggleAccessory = (acc: string) => {
    setAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !phoneBrandModel || !issueDescription) {
      alert('Harap lengkapi nama pelanggan, nomor HP, tipe HP, dan rincian keluhan!');
      return;
    }

    const estCost = parseFloat(estimatedCost) || 0;
    const dp = parseFloat(downPayment) || 0;
    const serviceNo = `SRV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      10 + Math.random() * 90
    )}`;

    let finalPasscode = passcodeOrPattern;
    if (isE2EEActive && passcodeOrPattern) {
      finalPasscode = await encryptData(passcodeOrPattern);
    }

    const newRecord: ServiceRecord = {
      id: 'srv-' + Date.now(),
      serviceNumber: serviceNo,
      customerName,
      customerPhone,
      phoneBrandModel,
      issueDescription,
      estimatedCost: estCost,
      downPayment: dp,
      finalCost: estCost,
      status: 'Diterima',
      technicianNotes,
      passcodeOrPattern: finalPasscode,
      includedAccessories: accessories,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      warrantyDays: 7,
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
    };

    // Struk Tanda Terima Servis HP
    const receiptData: ReceiptData = {
      title: 'TANDA TERIMA SERVICE HP',
      subtitle: 'JU-FAT CELL POS & TEKNISI',
      receiptNumber: serviceNo,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName,
      customerPhone,
      items: [
        {
          name: `Jasa / Servis ${phoneBrandModel}`,
          price: estCost,
          total: estCost,
          note: issueDescription,
        },
      ],
      subtotal: estCost,
      grandTotal: estCost,
      paymentMethod: dp > 0 ? 'DP (Uang Muka)' : 'Belum Bayar DP',
      cashPaid: dp,
      remainingDebt: Math.max(0, estCost - dp),
      footerNote: 'Simpan tanda terima ini untuk bukti pengambilan unit HP di Ju-Fat Cell.',
      isServiceReceipt: true,
      serviceDetails: {
        device: phoneBrandModel,
        issue: issueDescription,
        dp,
        remaining: Math.max(0, estCost - dp),
        warranty: 'Garansi 7 Hari',
      },
    };

    onAddNewService(newRecord, receiptData);
    setShowAddModal(false);
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setPhoneBrandModel('');
    setIssueDescription('');
    setEstimatedCost('');
    setDownPayment('');
    setPasscodeOrPattern('');
    setTechnicianNotes('');
  };

  const handlePrintExisting = (srv: ServiceRecord) => {
    const remaining = Math.max(0, srv.finalCost - srv.downPayment);
    const receiptData: ReceiptData = {
      title: 'TANDA TERIMA SERVICE HP',
      subtitle: 'JU-FAT CELL POS & TEKNISI',
      receiptNumber: srv.serviceNumber,
      date: formatDateTime(srv.createdAt),
      cashierName: srv.cashierName,
      shift: srv.shift,
      customerName: srv.customerName,
      customerPhone: srv.customerPhone,
      items: [
        {
          name: `Perbaikan ${srv.phoneBrandModel}`,
          price: srv.finalCost,
          total: srv.finalCost,
          note: srv.issueDescription,
        },
      ],
      subtotal: srv.finalCost,
      grandTotal: srv.finalCost,
      paymentMethod: srv.status === 'Diambil' ? 'Lunas (Diambil)' : `Status: ${srv.status}`,
      cashPaid: srv.status === 'Diambil' ? srv.finalCost : srv.downPayment,
      remainingDebt: srv.status === 'Diambil' ? 0 : remaining,
      footerNote: 'Garansi servis berlaku 7 hari sejak tanggal selesai/diambil.',
      isServiceReceipt: true,
      serviceDetails: {
        device: srv.phoneBrandModel,
        issue: srv.issueDescription,
        dp: srv.downPayment,
        remaining: srv.status === 'Diambil' ? 0 : remaining,
        warranty: '7 Hari Garansi',
      },
    };
    onPrintTicket(receiptData);
  };

  const handleOpenSettleModal = (srv: ServiceRecord) => {
    const remaining = Math.max(0, srv.finalCost - srv.downPayment);
    setSettleService(srv);
    setSettleAmount(remaining.toString());
  };

  const handleConfirmSettleAndPickup = () => {
    if (!settleService) return;
    const additionalCash = parseFloat(settleAmount) || 0;

    const receiptData: ReceiptData = {
      title: 'NOTA PELUNASAN SERVICE HP',
      subtitle: 'JU-FAT CELL TEKNISI',
      receiptNumber: settleService.serviceNumber + '-LUNAS',
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName: settleService.customerName,
      customerPhone: settleService.customerPhone,
      items: [
        {
          name: `Pelunasan Servis: ${settleService.phoneBrandModel}`,
          price: settleService.finalCost,
          total: settleService.finalCost,
          note: settleService.issueDescription,
        },
      ],
      subtotal: settleService.finalCost,
      grandTotal: settleService.finalCost,
      paymentMethod: 'Cash (Lunas)',
      cashPaid: settleService.downPayment + additionalCash,
      remainingDebt: 0,
      footerNote: 'Unit telah diambil dalam kondisi baik. Garansi resmi konter 7 hari.',
      isServiceReceipt: true,
      serviceDetails: {
        device: settleService.phoneBrandModel,
        issue: settleService.issueDescription,
        dp: settleService.downPayment,
        remaining: 0,
        warranty: 'Garansi Aktif 7 Hari',
      },
    };

    onUpdateServiceStatus(
      settleService.id,
      'Diambil',
      settleService.finalCost,
      additionalCash,
      receiptData
    );
    setSettleService(null);
  };

  // Filter list
  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.customerPhone.includes(searchQuery) ||
      srv.phoneBrandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.serviceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || srv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'Diterima':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Diproses':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Selesai':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'Diambil':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Batal':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-800 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Penerimaan & Manajemen Service HP</h3>
            <p className="text-xs text-slate-500">
              Formulir tiket servis, cetak tanda terima, status pengerjaan & garansi
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Terima HP Baru</span>
        </button>
      </div>

      {/* Filter Status & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pelanggan, nomor tiket, atau tipe HP..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Status ({services.length})
            </button>
            {(['Diterima', 'Diproses', 'Selesai', 'Diambil', 'Batal'] as ServiceStatus[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({services.filter((s) => s.status === st).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daftar Tiket Servis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((srv) => {
          const remaining = Math.max(0, srv.finalCost - srv.downPayment);
          return (
            <div
              key={srv.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow space-y-3"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {srv.serviceNumber}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${getStatusBadge(
                      srv.status
                    )}`}
                  >
                    {srv.status}
                  </span>
                </div>

                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-bold text-sm text-slate-900">{srv.phoneBrandModel}</span>
                  </div>

                  <div className="text-xs text-slate-600">
                    Pelanggan: <strong className="text-slate-800">{srv.customerName}</strong> (
                    {srv.customerPhone})
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-700">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">
                      Keluhan / Kerusakan:
                    </span>
                    <p className="line-clamp-2">{srv.issueDescription}</p>
                  </div>

                  {srv.technicianNotes && (
                    <div className="text-[11px] text-slate-500 italic">
                      Catatan teknisi: {srv.technicianNotes}
                    </div>
                  )}

                  {srv.passcodeOrPattern && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-emerald-50/70 p-1.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pola/Sandi: <strong>{srv.passcodeOrPattern}</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Biaya & Aksi */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Estimasi Biaya:</span>
                  <span className="font-bold font-mono-num">{formatRupiah(srv.finalCost)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">DP Dibayar:</span>
                  <span className="text-emerald-600 font-mono-num font-semibold">
                    {formatRupiah(srv.downPayment)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
                  <span className="text-slate-700">Sisa Pelunasan:</span>
                  <span
                    className={`font-mono-num ${
                      srv.status === 'Diambil' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {srv.status === 'Diambil' ? 'Rp 0 (LUNAS)' : formatRupiah(remaining)}
                  </span>
                </div>

                {/* Kontrol Cepat Status */}
                <div className="flex items-center gap-1.5 pt-2">
                  <button
                    onClick={() => handlePrintExisting(srv)}
                    className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title="Cetak Ulang Tanda Terima"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Status Dropdown/Selector */}
                  <select
                    value={srv.status}
                    onChange={(e) => {
                      const newSt = e.target.value as ServiceStatus;
                      if (newSt === 'Diambil' && remaining > 0) {
                        handleOpenSettleModal(srv);
                      } else {
                        onUpdateServiceStatus(srv.id, newSt);
                      }
                    }}
                    className="flex-1 text-xs border border-slate-300 rounded-lg py-1.5 px-2 bg-white font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="Diterima">Status: Diterima</option>
                    <option value="Diproses">Status: Diproses</option>
                    <option value="Selesai">Status: Selesai</option>
                    <option value="Diambil">Status: Diambil (Lunas)</option>
                    <option value="Batal">Status: Batal</option>
                  </select>

                  {srv.status === 'Selesai' && remaining > 0 && (
                    <button
                      onClick={() => handleOpenSettleModal(srv)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                      title="Ambil Unit & Lunasi"
                    >
                      Lunasi
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 space-y-2">
          <Smartphone className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs">Tidak ada data tiket servis yang ditemukan.</p>
        </div>
      )}

      {/* Modal Tambah Penerimaan Servis HP Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-fuchsia-400" />
                <h3 className="font-bold text-sm">Formulir Penerimaan Service HP Baru</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Anton"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No HP / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Merk & Tipe/Model HP *
                </label>
                <input
                  type="text"
                  required
                  value={phoneBrandModel}
                  onChange={(e) => setPhoneBrandModel(e.target.value)}
                  placeholder="Contoh: iPhone 11 128GB / Samsung Galaxy A54"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keluhan / Kerusakan Utama *
                </label>
                <textarea
                  rows={2}
                  required
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Contoh: Layar pecah sentuh tidak merespons, kamera belakang blur..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Biaya Servis (Rp)
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Uang Muka (DP Masuk Kasir)
                  </label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-num font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Pola / PIN Layar (Opsional)
                  </label>
                  {isE2EEActive && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Dilindungi Enkripsi E2EE
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={passcodeOrPattern}
                  onChange={(e) => setPasscodeOrPattern(e.target.value)}
                  placeholder="Contoh: PIN: 123456 atau Pola huruf N"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              {/* Kelengkapan Unit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Kelengkapan Unit Bawaan:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Unit HP', 'SIM Card Tray', 'Memory Card', 'Dus HP', 'Charger'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => toggleAccessory(acc)}
                      className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors ${
                        accessories.includes(acc)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {accessories.includes(acc) ? '✓ ' : '+ '}
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Teknisi / Kondisi Fisik (Opsional)
                </label>
                <input
                  type="text"
                  value={technicianNotes}
                  onChange={(e) => setTechnicianNotes(e.target.value)}
                  placeholder="Contoh: Casing lecet pemakaian, tombol power agak keras..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan & Cetak Tanda Terima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pelunasan Pengambilan Unit */}
      {settleService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Pelunasan & Pengambilan Unit HP</h3>
            </div>
            <p className="text-xs text-slate-600">
              Perangkat <strong>{settleService.phoneBrandModel}</strong> milik <strong>{settleService.customerName}</strong> siap diserahkan kepada pelanggan.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Biaya Servis:</span>
                <span className="font-bold">{formatRupiah(settleService.finalCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>DP Sebelumnya:</span>
                <span>{formatRupiah(settleService.downPayment)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-red-600 pt-1 border-t border-slate-200">
                <span>Sisa Yang Harus Dibayar:</span>
                <span>{formatRupiah(Math.max(0, settleService.finalCost - settleService.downPayment))}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Uang Pelunasan Tunai Diterima:
              </label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSettleService(null)}
                className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSettleAndPickup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Konfirmasi Lunas & Cetak Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
