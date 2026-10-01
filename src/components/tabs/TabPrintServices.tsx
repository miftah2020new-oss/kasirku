import React, { useState } from 'react';
import { PrintServiceType, PrintOrderItem, PrintOrder, User, ReceiptData, ShiftSession } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import {
  Printer,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Maximize,
  Plus,
  Trash2,
  Receipt,
  Layers,
} from 'lucide-react';

interface TabPrintServicesProps {
  orders: PrintOrder[];
  currentUser: User;
  currentShift: ShiftSession;
  onSubmitOrder: (order: PrintOrder, receipt: ReceiptData) => void;
}

interface PrintCatalogItem {
  type: PrintServiceType;
  category: 'Print Kertas' | 'Jilid Dokumen' | 'Cetak Foto' | 'Spanduk Banner' | 'Finishing';
  unit: string;
  defaultPrice: number;
  costPrice: number;
  description: string;
}

const PRINT_CATALOG: PrintCatalogItem[] = [
  {
    type: 'Print A4 Hitam Putih',
    category: 'Print Kertas',
    unit: 'Lembar',
    defaultPrice: 500,
    costPrice: 150,
    description: 'HVS 70gr teks hitam putih',
  },
  {
    type: 'Print A4 Warna',
    category: 'Print Kertas',
    unit: 'Lembar',
    defaultPrice: 1500,
    costPrice: 400,
    description: 'HVS 70gr gambar/diagram warna',
  },
  {
    type: 'Print F4 Hitam Putih',
    category: 'Print Kertas',
    unit: 'Lembar',
    defaultPrice: 700,
    costPrice: 200,
    description: 'Kertas Folio F4 hitam putih',
  },
  {
    type: 'Print F4 Warna',
    category: 'Print Kertas',
    unit: 'Lembar',
    defaultPrice: 2000,
    costPrice: 500,
    description: 'Kertas Folio F4 full color',
  },
  {
    type: 'Jilid Biasa (Lakban)',
    category: 'Jilid Dokumen',
    unit: 'Buku',
    defaultPrice: 4000,
    costPrice: 1000,
    description: 'Cover mika bening + lakban hitam + buffalo',
  },
  {
    type: 'Jilid Spiral Plastik/Kawat',
    category: 'Jilid Dokumen',
    unit: 'Buku',
    defaultPrice: 8000,
    costPrice: 2500,
    description: 'Spiral ring kawat rapi bolak-balik',
  },
  {
    type: 'Jilid Hardcover',
    category: 'Jilid Dokumen',
    unit: 'Buku',
    defaultPrice: 35000,
    costPrice: 12000,
    description: 'Hardcover skripsi / laporan tinta emas',
  },
  {
    type: 'Cetak Foto 2x3',
    category: 'Cetak Foto',
    unit: 'Lembar',
    defaultPrice: 3000,
    costPrice: 800,
    description: 'Kertas foto glossy profesional',
  },
  {
    type: 'Cetak Foto 3x4',
    category: 'Cetak Foto',
    unit: 'Lembar',
    defaultPrice: 3000,
    costPrice: 800,
    description: 'Kertas foto glossy profesional',
  },
  {
    type: 'Cetak Foto 4x6',
    category: 'Cetak Foto',
    unit: 'Lembar',
    defaultPrice: 4000,
    costPrice: 1000,
    description: 'Kertas foto glossy profesional',
  },
  {
    type: 'Cetak Banner/Spanduk',
    category: 'Spanduk Banner',
    unit: 'Meter²',
    defaultPrice: 25000,
    costPrice: 14000,
    description: 'Bahan Flexi Standard 280gr / 340gr outdoor',
  },
  {
    type: 'Laminasi',
    category: 'Finishing',
    unit: 'Lembar',
    defaultPrice: 3000,
    costPrice: 900,
    description: 'Plastik laminating panas A4/F4',
  },
];

export const TabPrintServices: React.FC<TabPrintServicesProps> = ({
  orders,
  currentUser,
  currentShift,
  onSubmitOrder,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderItems, setOrderItems] = useState<PrintOrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'QRIS' | 'Hutang'>('Cash');
  const [cashGiven, setCashGiven] = useState('');

  // Kalkulator cepat Banner
  const [bannerLength, setBannerLength] = useState('3');
  const [bannerWidth, setBannerWidth] = useState('1');

  const addItemToOrder = (catalog: PrintCatalogItem, qty: number = 1, notes: string = '') => {
    setOrderItems((prev) => {
      return [
        ...prev,
        {
          type: catalog.type,
          quantity: qty,
          unitPrice: catalog.defaultPrice,
          costPrice: catalog.costPrice,
          subtotal: catalog.defaultPrice * qty,
          notes,
        },
      ];
    });
  };

  const handleAddBanner = () => {
    const l = parseFloat(bannerLength) || 1;
    const w = parseFloat(bannerWidth) || 1;
    const sqm = Math.round(l * w * 100) / 100;

    const bannerCatalog = PRINT_CATALOG.find((c) => c.type === 'Cetak Banner/Spanduk')!;
    addItemToOrder(bannerCatalog, sqm, `Ukuran ${l}m x ${w}m = ${sqm} m²`);
  };

  const removeItem = (idx: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemQty = (idx: number, qty: number) => {
    if (qty <= 0) return;
    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, quantity: qty, subtotal: qty * item.unitPrice } : item
      )
    );
  };

  const totalPrice = orderItems.reduce((acc, it) => acc + it.subtotal, 0);
  const totalCost = orderItems.reduce((acc, it) => acc + it.costPrice * it.quantity, 0);
  const profit = totalPrice - totalCost;

  const paid = paymentMethod === 'Cash' ? parseFloat(cashGiven) || 0 : totalPrice;
  const change = Math.max(0, paid - totalPrice);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Harap masukkan nama pelanggan!');
      return;
    }
    if (orderItems.length === 0) {
      alert('Daftar pesanan cetak masih kosong!');
      return;
    }
    if (paymentMethod === 'Cash' && paid < totalPrice) {
      alert('Nominal uang tunai yang diterima kurang!');
      return;
    }

    const orderNo = `PRT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newOrder: PrintOrder = {
      id: 'print-' + Date.now(),
      orderNumber: orderNo,
      customerName,
      customerPhone: customerPhone || undefined,
      items: orderItems,
      totalPrice,
      totalCost,
      profit,
      paymentMethod,
      customerPaid: paid,
      change,
      createdAt: new Date().toISOString(),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
    };

    const receiptData: ReceiptData = {
      title: 'NOTA LAYANAN PERCETAKAN',
      subtitle: 'JU-FAT CELL DIGITAL PRINTING',
      receiptNumber: orderNo,
      date: formatDateTime(new Date().toISOString()),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName,
      customerPhone: customerPhone || undefined,
      items: orderItems.map((it) => ({
        name: it.type,
        qty: it.quantity,
        price: it.unitPrice,
        total: it.subtotal,
        note: it.notes,
      })),
      subtotal: totalPrice,
      grandTotal: totalPrice,
      paymentMethod,
      cashPaid: paid,
      change,
      footerNote: 'Hasil cetak harap diperiksa sebelum meninggalkan toko. Terima kasih!',
    };

    onSubmitOrder(newOrder, receiptData);

    // Reset
    setCustomerName('');
    setCustomerPhone('');
    setOrderItems([]);
    setCashGiven('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pilihan Layanan Cetak & Kalkulator Dinamis */}
        <div className="lg:col-span-7 space-y-4">
          {/* Header Info */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Katalog & Kalkulator Percetakan</h3>
                <p className="text-xs text-slate-500">
                  Hitung biaya print per lembar, jilid skripsi, foto, laminasi & banner per m²
                </p>
              </div>
            </div>
          </div>

          {/* Quick Banner Calculator Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Maximize className="w-4 h-4 text-blue-600" />
              <span>Kalkulator Cetak Banner Spanduk (Per Meter)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Panjang (Meter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bannerLength}
                  onChange={(e) => setBannerLength(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lebar (Meter)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bannerWidth}
                  onChange={(e) => setBannerWidth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <button
                type="button"
                onClick={handleAddBanner}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Banner ({bannerLength}x{bannerWidth}m)</span>
              </button>
            </div>
          </div>

          {/* Grid Katalog Cetak */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRINT_CATALOG.filter((c) => c.type !== 'Cetak Banner/Spanduk').map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                    {item.category}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.type}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs text-slate-900 font-mono-num block">
                      {formatRupiah(item.defaultPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400">/{item.unit}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemToOrder(item, 1)}
                    className="p-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                    title="Tambah ke nota"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Rincian Nota & Checkout Cetak */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Rincian Nota Percetakan</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
              {orderItems.length} Item
            </span>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pemesan *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Rina Mahasiswi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">No HP / WA</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* List Item Cetak */}
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{item.type}</div>
                    {item.notes && <div className="text-[10px] text-slate-500 italic">{item.notes}</div>}
                    <div className="text-[11px] text-slate-600 font-mono-num">
                      {formatRupiah(item.unitPrice)} x {item.quantity} ={' '}
                      <strong>{formatRupiah(item.subtotal)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItemQty(idx, parseFloat(e.target.value) || 1)}
                      className="w-14 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-bold font-mono-num"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {orderItems.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Pilih item cetak di katalog sebelah kiri untuk menghitung biaya.
                </div>
              )}
            </div>

            {/* Total Ringkasan */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              {isAdmin && orderItems.length > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded text-[11px]">
                  <span>Estimasi Laba Cetak:</span>
                  <span className="font-bold font-mono-num">+{formatRupiah(profit)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-slate-900 pt-1">
                <span>TOTAL HARGA:</span>
                <span className="font-mono-num text-lg">{formatRupiah(totalPrice)}</span>
              </div>
            </div>

            {/* Metode Bayar */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-700">Metode Pembayaran:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Cash', 'Transfer', 'QRIS', 'Hutang'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-1 rounded-lg border text-center font-bold text-xs ${
                      paymentMethod === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700">Uang Diterima:</label>
                  <button
                    type="button"
                    onClick={() => setCashGiven(totalPrice.toString())}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Uang Pas
                  </button>
                </div>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
                />

                {paid > 0 && (
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span>Kembalian:</span>
                    <span className="font-mono-num text-sm text-emerald-700">
                      {formatRupiah(change)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={orderItems.length === 0}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                orderItems.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Simpan Order & Cetak Nota Percetakan</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
