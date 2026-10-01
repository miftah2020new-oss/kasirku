import React, { useState } from 'react';
import { Product, CartItem, User, ReceiptData, PosTransaction, ShiftSession } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  CreditCard,
  Banknote,
  Receipt,
  UserCheck,
  Package,
} from 'lucide-react';

interface TabPosAtkProps {
  products: Product[];
  currentUser: User;
  currentShift: ShiftSession;
  onCheckout: (
    transaction: PosTransaction,
    receiptData: ReceiptData,
    debtData?: { customerName: string; customerPhone: string; customerAddress?: string; dueDate?: string }
  ) => void;
  onNavigateToProducts?: () => void;
  categoryFilter?: string;
}

export const TabPosAtk: React.FC<TabPosAtkProps> = ({
  products,
  currentUser,
  currentShift,
  onCheckout,
  onNavigateToProducts,
  categoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || 'all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');

  // Update selected category when prop changes
  React.useEffect(() => {
    if (categoryFilter) {
      // Find category ID by name if needed
      const found = products.find((p) => p.categoryName === categoryFilter);
      if (found) {
        setSelectedCategory(found.categoryId);
      } else if (categoryFilter === 'all') {
        setSelectedCategory('all');
      }
    }
  }, [categoryFilter, products]);
  
  // Checkout form states
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'QRIS' | 'Hutang'>('Cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  
  // Debt form states
  const [debtCustomerName, setDebtCustomerName] = useState('');
  const [debtCustomerPhone, setDebtCustomerPhone] = useState('');
  const [debtCustomerAddress, setDebtCustomerAddress] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  const isAdmin = currentUser.role === 'admin';

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || prod.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories
  const categories = Array.from(
    new Set(products.map((p) => JSON.stringify({ id: p.categoryId, name: p.categoryName })))
  ).map((c) => JSON.parse(c) as { id: string; name: string });

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok barang "${product.name}" habis!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Maksimal stok tersedia hanya ${product.stock} ${product.unit}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.sellingPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            discount: 0,
            subtotal: product.sellingPrice,
          },
        ];
      }
    });
  };

  // Barcode enter handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan Barcode/SKU "${barcodeInput}" tidak ditemukan!`);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tersedia hanya ${item.product.stock}`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.sellingPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.subtotal, 0);
  const totalCost = cart.reduce((acc, it) => acc + it.product.costPrice * it.quantity, 0);
  const grossProfit = subtotal - totalCost;

  const paidAmount = paymentMethod === 'Cash' ? parseFloat(cashGiven) || 0 : subtotal;
  const changeAmount = paymentMethod === 'Cash' ? Math.max(0, paidAmount - subtotal) : 0;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    if (paymentMethod === 'Cash' && paidAmount < subtotal) {
      alert('Nominal uang tunai yang diterima masih kurang!');
      return;
    }

    if (paymentMethod === 'Hutang') {
      if (!debtCustomerName.trim()) {
        alert('Harap masukkan nama pelanggan yang berhutang!');
        return;
      }
      if (!debtCustomerPhone.trim()) {
        alert('Harap masukkan nomor HP / WhatsApp pelanggan!');
        return;
      }
    }

    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const transaction: PosTransaction = {
      id: 'tx-' + Date.now(),
      invoiceNumber: invoiceNo,
      type: 'ATK',
      itemsSummary: cart.map((it) => `${it.product.name} (x${it.quantity})`).join(', '),
      itemsList: cart,
      subtotal,
      discount: 0,
      totalAmount: subtotal,
      totalCost,
      profit: grossProfit,
      paymentMethod,
      customerPaid: paymentMethod === 'Hutang' ? 0 : paidAmount,
      change: paymentMethod === 'Hutang' ? 0 : changeAmount,
      customerName: paymentMethod === 'Hutang' ? debtCustomerName : undefined,
      customerPhone: paymentMethod === 'Hutang' ? debtCustomerPhone : undefined,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      createdAt: new Date().toISOString(),
    };

    const receiptData: ReceiptData = {
      title: 'NOTA PENJUALAN ATK & AKSESORIS',
      subtitle: 'JU-FAT CELL POS',
      receiptNumber: invoiceNo,
      date: new Date().toLocaleString('id-ID'),
      cashierName: currentUser.name,
      shift: currentShift.shiftName,
      customerName: paymentMethod === 'Hutang' ? debtCustomerName : undefined,
      customerPhone: paymentMethod === 'Hutang' ? debtCustomerPhone : undefined,
      items: cart.map((it) => ({
        name: it.product.name,
        qty: it.quantity,
        price: it.product.sellingPrice,
        total: it.subtotal,
      })),
      subtotal,
      grandTotal: subtotal,
      paymentMethod,
      cashPaid: paymentMethod === 'Hutang' ? 0 : paidAmount,
      change: paymentMethod === 'Hutang' ? 0 : changeAmount,
      remainingDebt: paymentMethod === 'Hutang' ? subtotal : undefined,
      footerNote:
        paymentMethod === 'Hutang'
          ? 'STATUS: HUTANG TERCATAT DI BUKU PIUTANG JU-FAT CELL'
          : 'Terima kasih atas kepercayaan Anda berbelanja di Ju-Fat Cell!',
    };

    const debtData =
      paymentMethod === 'Hutang'
        ? {
            customerName: debtCustomerName,
            customerPhone: debtCustomerPhone,
            customerAddress: debtCustomerAddress,
            dueDate: debtDueDate || undefined,
          }
        : undefined;

    onCheckout(transaction, receiptData, debtData);
    setCart([]);
    setCashGiven('');
    setDebtCustomerName('');
    setDebtCustomerPhone('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Kolom Kiri: Katalog Produk ATK & Aksesoris */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Barcode & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Input Barcode Scanner */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode / Ketik SKU lalu Enter..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            {/* Pencarian Nama */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Kategori Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Produk */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => {
            const isLowStock = prod.stock <= prod.minStock;
            return (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className={`bg-white p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between hover:shadow-md ${
                  prod.stock <= 0
                    ? 'opacity-50 border-red-200 bg-red-50/20 cursor-not-allowed'
                    : isLowStock
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{prod.sku}</span>
                    <span
                      className={`font-semibold ${
                        prod.stock <= 0
                          ? 'text-red-600'
                          : isLowStock
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      Stok: {prod.stock} {prod.unit}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                    {prod.name}
                  </h4>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900 font-mono-num">
                      {formatRupiah(prod.sellingPrice)}
                    </div>
                    {/* HANYA ADMIN YANG DAPAT MELIHAT HARGA MODAL */}
                    {isAdmin && (
                      <div className="text-[10px] text-slate-400 font-mono-num">
                        Modal: {formatRupiah(prod.costPrice)}
                      </div>
                    )}
                  </div>

                  {isLowStock && (
                    <span
                      title="Peringatan stok menipis!"
                      className="p-1 rounded bg-amber-100 text-amber-700"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">
                {products.length === 0
                  ? 'Belum Ada Barang Dagangan Terdaftar'
                  : 'Tidak Ada Produk Sesuai Kategori / Pencarian'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {products.length === 0
                  ? 'Data toko Anda saat ini masih kosong bersih. Silakan daftarkan barang dagangan yang Anda perjualkan (ATK, Aksesoris HP, dll) untuk mulai melayani transaksi kasir.'
                  : 'Coba ubah kata kunci pencarian atau pilih kategori lain di atas.'}
              </p>
            </div>
            {products.length === 0 && onNavigateToProducts && isAdmin && (
              <button
                type="button"
                onClick={onNavigateToProducts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Barang Dagangan Anda</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Keranjang Kasir & Checkout */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-sm text-slate-900">Keranjang Kasir</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {cart.reduce((a, b) => a + b.quantity, 0)} Item
          </span>
        </div>

        {/* Item List di Keranjang */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2"
            >
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-xs text-slate-900 truncate">
                  {item.product.name}
                </h5>
                <div className="text-[11px] text-slate-500 font-mono-num">
                  {formatRupiah(item.product.sellingPrice)} x {item.quantity} ={' '}
                  <strong className="text-slate-800">{formatRupiah(item.subtotal)}</strong>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-xs w-5 text-center font-mono-num">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 text-slate-400 hover:text-red-600 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Pilih barang di sebelah kiri atau scan barcode untuk menambahkan ke kasir.
            </div>
          )}
        </div>

        {/* Total Ringkasan */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold font-mono-num">{formatRupiah(subtotal)}</span>
          </div>

          {/* Rincian Modal Khusus Admin */}
          {isAdmin && cart.length > 0 && (
            <div className="flex justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <span>Estimasi Laba Kotor:</span>
              <span className="font-bold font-mono-num">+{formatRupiah(grossProfit)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
            <span>TOTAL TAGIHAN:</span>
            <span className="font-mono-num text-lg">{formatRupiah(subtotal)}</span>
          </div>
        </div>

        {/* Pilihan Metode Bayar */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-700">Metode Pembayaran:</label>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            {(['Cash', 'Transfer', 'QRIS', 'Hutang'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-2 px-1 rounded-lg border text-center transition-all ${
                  paymentMethod === method
                    ? method === 'Hutang'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Form Tunai / Cash */}
        {paymentMethod === 'Cash' && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700">Uang Diterima:</label>
              <button
                type="button"
                onClick={() => setCashGiven(subtotal.toString())}
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                Uang Pas
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">Rp</span>
              <input
                type="number"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            {/* Quick cash shortcut buttons */}
            <div className="flex gap-1.5 text-[11px] font-semibold">
              {[20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashGiven(amt.toString())}
                  className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200"
                >
                  +{formatRupiah(amt)}
                </button>
              ))}
            </div>

            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold pt-1 text-slate-800">
                <span>Kembalian:</span>
                <span
                  className={`font-mono-num text-sm ${
                    changeAmount >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {formatRupiah(changeAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Form Hutang / Kredit Pelanggan */}
        {paymentMethod === 'Hutang' && (
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-red-700 font-bold">
              <UserCheck className="w-4 h-4" />
              <span>Data Pelanggan (Buku Piutang)</span>
            </div>
            <div>
              <input
                type="text"
                value={debtCustomerName}
                onChange={(e) => setDebtCustomerName(e.target.value)}
                placeholder="Nama Lengkap Pelanggan *"
                required
                className="w-full px-2.5 py-1.5 border border-red-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <input
                type="text"
                value={debtCustomerPhone}
                onChange={(e) => setDebtCustomerPhone(e.target.value)}
                placeholder="No HP / WhatsApp *"
                required
                className="w-full px-2.5 py-1.5 border border-red-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={debtCustomerAddress}
                onChange={(e) => setDebtCustomerAddress(e.target.value)}
                placeholder="Alamat / Catatan"
                className="w-full px-2.5 py-1.5 border border-red-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <input
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
                placeholder="Jatuh Tempo"
                className="w-full px-2.5 py-1.5 border border-red-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        )}

        {/* Tombol Proses Checkout */}
        <button
          type="button"
          onClick={handleCheckoutSubmit}
          disabled={cart.length === 0}
          className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
            cart.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : paymentMethod === 'Hutang'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.99]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>
            {paymentMethod === 'Hutang'
              ? 'Simpan Hutang & Cetak Struk'
              : 'Bayar & Cetak Struk Kasir'}
          </span>
        </button>
      </div>
    </div>
  );
};
