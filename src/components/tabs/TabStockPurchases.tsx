import React, { useState } from 'react';
import { Product, User, ShiftSession, CashFlowMovement } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { ShoppingBag, Plus, Search, Truck, CheckCircle2 } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paymentMethod: 'Cash (Kasir)' | 'Transfer Rekening' | 'Hutang Supplier';
  status: 'Diterima' | 'Proses Kirim';
  cashierName: string;
}

interface TabStockPurchasesProps {
  products: Product[];
  currentUser: User;
  currentShift: ShiftSession;
  onRecordPurchase: (
    order: PurchaseOrder,
    stockUpdates: { productId: string; addedQty: number }[],
    cashMovement?: CashFlowMovement
  ) => void;
}

export const TabStockPurchases: React.FC<TabStockPurchasesProps> = ({
  products,
  currentUser,
  currentShift,
  onRecordPurchase,
}) => {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([
    {
      id: 'po-1',
      orderNumber: 'KULAKAN-20260925-01',
      date: '2026-09-25T11:00:00.000Z',
      supplierName: 'Distributor Sinar Jaya ATK',
      items: [
        {
          productId: 'prod-1',
          productName: 'Pulpen Standard AE7 0.5 Hitam',
          quantity: 100,
          costPrice: 1800,
          subtotal: 180000,
        },
        {
          productId: 'prod-2',
          productName: 'Buku Tulis Sinar Dunia 38 Lembar',
          quantity: 50,
          costPrice: 3200,
          subtotal: 160000,
        },
      ],
      totalAmount: 340000,
      paymentMethod: 'Cash (Kasir)',
      status: 'Diterima',
      cashierName: 'Miftah (Admin)',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('20');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash (Kasir)' | 'Transfer Rekening' | 'Hutang Supplier'>('Cash (Kasir)');

  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const p = products.find((prod) => prod.id === prodId);
    if (p) {
      setPurchaseUnitCost(p.costPrice.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(purchaseQty, 10) || 0;
    const cost = parseFloat(purchaseUnitCost) || 0;
    const p = products.find((prod) => prod.id === selectedProductId);

    if (!p || qty <= 0 || cost <= 0) {
      alert('Harap masukkan produk, kuantiti, dan harga beli yang valid!');
      return;
    }

    const subtotal = qty * cost;
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const newOrder: PurchaseOrder = {
      id: 'po-' + Date.now(),
      orderNumber: poNumber,
      date: new Date().toISOString(),
      supplierName: supplierName || 'Distributor Pusat',
      items: [
        {
          productId: p.id,
          productName: p.name,
          quantity: qty,
          costPrice: cost,
          subtotal,
        },
      ],
      totalAmount: subtotal,
      paymentMethod,
      status: 'Diterima',
      cashierName: currentUser.name,
    };

    setPurchases([newOrder, ...purchases]);

    const cashMovement: CashFlowMovement | undefined =
      paymentMethod === 'Cash (Kasir)'
        ? {
            id: 'cf-' + Date.now(),
            type: 'out',
            account: 'Kas Fisik Toko',
            category: 'Belanja Stok ATK',
            amount: subtotal,
            description: `Kulakan stok: ${p.name} (${qty} ${p.unit}) dari ${supplierName}`,
            referenceNumber: poNumber,
            date: new Date().toISOString(),
            cashierName: currentUser.name,
            shift: currentShift.shiftName,
          }
        : undefined;

    onRecordPurchase(
      newOrder,
      [{ productId: p.id, addedQty: qty }],
      cashMovement
    );

    setShowModal(false);
    setSupplierName('');
    alert(`Stok ${p.name} berhasil bertambah +${qty} ${p.unit}!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Pembelian & Kulakan Stok Barang</h3>
          <p className="text-xs text-slate-500">
            Pencatatan faktur barang masuk dari distributor, otomatis menambah stok dan mencatat kas keluar
          </p>
        </div>

        <button
          onClick={() => {
            const firstProd = products[0];
            if (firstProd) {
              setSelectedProductId(firstProd.id);
              setPurchaseUnitCost(firstProd.costPrice.toString());
            }
            setShowModal(true);
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Input Kulakan Stok Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. PO / Faktur</th>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Item & Jumlah</th>
                <th className="py-3 px-4 text-right">Total Biaya Kulakan</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{po.orderNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(po.date)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{po.supplierName}</td>
                  <td className="py-3 px-4 text-slate-700">
                    {po.items.map((it, idx) => (
                      <div key={idx} className="truncate max-w-xs">
                        {it.productName} (x{it.quantity})
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono-num font-bold text-red-600">
                    -{formatRupiah(po.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {po.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{po.cashierName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900">Input Kulakan Stok Masuk</h4>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Supplier / Toko Grosir</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Contoh: Distributor Sinar Jaya / Agen Grosir"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Produk Yang Dibeli *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Masuk (Qty) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-slate-900 rounded-lg text-sm font-bold font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={purchaseUnitCost}
                    onChange={(e) => setPurchaseUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono-num"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between font-bold text-xs text-slate-800">
                  <span>Total Biaya Kulakan:</span>
                  <span className="font-mono-num text-red-600">
                    {formatRupiah(
                      (parseInt(purchaseQty, 10) || 0) * (parseFloat(purchaseUnitCost) || 0)
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="Cash (Kasir)">Cash Tunai Laci Kasir (Otomatis Kas Keluar)</option>
                  <option value="Transfer Rekening">Transfer Rekening Toko</option>
                  <option value="Hutang Supplier">Tempo / Hutang Supplier</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
