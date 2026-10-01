import React, { useState, useEffect } from 'react';
import {
  Product,
  Category,
  User,
  StockOpnameRecord,
  StockOpnameItem,
} from '../../types';
import { formatRupiah, formatDateTime, exportToCSV } from '../../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Tag,
  ShieldAlert,
  ClipboardCheck,
  SlidersHorizontal,
  History,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  X,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface TabProductsManageProps {
  products: Product[];
  categories: Category[];
  currentUser: User;
  stockOpnames: StockOpnameRecord[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onApplyStockOpname: (
    record: StockOpnameRecord,
    stockAdjustments: { productId: string; newStock: number }[]
  ) => void;
  initialSubTab?: 'catalog' | 'opname';
}

export const TabProductsManage: React.FC<TabProductsManageProps> = ({
  products,
  categories,
  currentUser,
  stockOpnames,
  onSaveProduct,
  onDeleteProduct,
  onApplyStockOpname,
  initialSubTab = 'catalog',
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Sub-tab: Katalog vs Stok Opname
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'opname'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Filter & Search Katalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStockStatus, setFilterStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Modal Tambah / Edit Produk
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states produk
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('Pcs');
  const [description, setDescription] = useState('');

  // ================= STATE STOK OPNAME =================
  // Modal Sesi Stok Opname Penuh
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameAuditor, setOpnameAuditor] = useState(currentUser.name || 'Admin Toko');
  const [opnameNotes, setOpnameNotes] = useState('Audit rutin stok fisik etalase & gudang');
  const [opnameSearch, setOpnameSearch] = useState('');
  const [opnameCategoryFilter, setOpnameCategoryFilter] = useState('all');
  const [opnameDiscrepancyFilter, setOpnameDiscrepancyFilter] = useState<'all' | 'diff_only' | 'match_only'>('all');

  // Map input fisik produk dalam sesi opname: productId -> physicalQty
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});
  // Map alasan selisih: productId -> reason
  const [discrepancyReasons, setDiscrepancyReasons] = useState<{ [productId: string]: string }>({});
  // Map catatan per item: productId -> notes
  const [itemNotes, setItemNotes] = useState<{ [productId: string]: string }>({});

  // Modal Quick Single-Item Opname
  const [quickOpnameProduct, setQuickOpnameProduct] = useState<Product | null>(null);
  const [quickPhysicalQty, setQuickPhysicalQty] = useState('');
  const [quickReason, setQuickReason] = useState('Barang Hilang / Rusak');
  const [quickNotes, setQuickNotes] = useState('');

  // Modal Detail Riwayat Opname
  const [viewingOpnameRecord, setViewingOpnameRecord] = useState<StockOpnameRecord | null>(null);

  // Akses Proteksi Khusus Admin
  if (!isAdmin) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-red-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Akses Dibatasi Khusus Admin</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Pengaturan stok barang, harga modal beli, pengelolaan produk, dan pelaksanaan <strong>Stok Opname</strong> hanya diizinkan untuk <strong>Admin (Pemilik Toko)</strong>. Kasir shift tidak diperkenankan melihat atau mengubah harga modal dan stok sistem.
        </p>
      </div>
    );
  }

  // ================= HANDLER PRODUK CRUD =================
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setSku(`ATK-${Math.floor(100 + Math.random() * 900)}`);
    setBarcode(`899123${Math.floor(100000 + Math.random() * 900000)}`);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setCostPrice('');
    setSellingPrice('');
    setStock('');
    setMinStock('5');
    setUnit('Pcs');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setBarcode(p.barcode);
    setName(p.name);
    setCategoryId(p.categoryId);
    setCostPrice(p.costPrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setStock(p.stock.toString());
    setMinStock(p.minStock.toString());
    setUnit(p.unit);
    setDescription(p.description || '');
    setShowModal(true);
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama produk tidak boleh kosong!');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);

    const saved: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: barcode.trim(),
      name: name.trim(),
      categoryId,
      categoryName: cat ? cat.name : 'Umum',
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      stock: parseInt(stock, 10) || 0,
      minStock: parseInt(minStock, 10) || 5,
      unit: unit || 'Pcs',
      description,
    };

    onSaveProduct(saved);
    setShowModal(false);
  };

  // Filter data produk katalog
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

    let matchesStock = true;
    if (filterStockStatus === 'low') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (filterStockStatus === 'out') {
      matchesStock = p.stock <= 0;
    }

    return matchesSearch && matchesCat && matchesStock;
  });

  // ================= METRIK STATISTIK STOK OPNAME =================
  const totalAuditSessions = stockOpnames.length;
  const totalAccumulatedLoss = stockOpnames.reduce((acc, r) => acc + (r.totalDiscrepancyLoss || 0), 0);
  const totalAccumulatedSurplus = stockOpnames.reduce((acc, r) => acc + (r.totalDiscrepancySurplus || 0), 0);
  const lastOpnameDate = stockOpnames[0]?.date ? formatDateTime(stockOpnames[0].date) : 'Belum pernah';

  // ================= HANDLER SESI STOK OPNAME =================
  const handleStartOpnameSession = () => {
    // Inisialisasi hitungan fisik awal dengan stok sistem saat ini
    const initialCounts: { [productId: string]: number } = {};
    const initialReasons: { [productId: string]: string } = {};
    const initialNotes: { [productId: string]: string } = {};

    products.forEach((p) => {
      initialCounts[p.id] = p.stock;
      initialReasons[p.id] = 'Sesuai / Tidak Ada Masalah';
      initialNotes[p.id] = '';
    });

    setPhysicalCounts(initialCounts);
    setDiscrepancyReasons(initialReasons);
    setItemNotes(initialNotes);
    setOpnameAuditor(currentUser.name || 'Admin Toko');
    setOpnameNotes(`Audit stok fisik tanggal ${new Date().toLocaleDateString('id-ID')}`);
    setOpnameSearch('');
    setOpnameCategoryFilter('all');
    setOpnameDiscrepancyFilter('all');
    setShowOpnameModal(true);
  };

  const handleUpdatePhysicalQty = (productId: string, val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setPhysicalCounts((prev) => ({ ...prev, [productId]: safeVal }));

    // Jika terjadi selisih dan alasan masih "Sesuai", otomatis default ke "Barang Hilang / Rusak"
    const currentProd = products.find((p) => p.id === productId);
    if (currentProd && safeVal !== currentProd.stock) {
      if (discrepancyReasons[productId] === 'Sesuai / Tidak Ada Masalah') {
        const defaultReason = safeVal < currentProd.stock ? 'Barang Hilang / Rusak' : 'Bonus / Kelebihan Supplier';
        setDiscrepancyReasons((prev) => ({ ...prev, [productId]: defaultReason }));
      }
    } else if (currentProd && safeVal === currentProd.stock) {
      setDiscrepancyReasons((prev) => ({ ...prev, [productId]: 'Sesuai / Tidak Ada Masalah' }));
    }
  };

  // Hitung live selisih untuk seluruh produk dalam sesi
  const opnameItemsCalculation = products.map((p) => {
    const phys = physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : p.stock;
    const diff = phys - p.stock;
    const diffVal = diff * p.costPrice;
    return {
      product: p,
      physicalStock: phys,
      difference: diff,
      differenceValue: diffVal,
      reason: discrepancyReasons[p.id] || (diff === 0 ? 'Sesuai / Tidak Ada Masalah' : 'Barang Hilang / Rusak'),
      notes: itemNotes[p.id] || '',
    };
  });

  const totalMismatchCount = opnameItemsCalculation.filter((item) => item.difference !== 0).length;
  const sessionTotalLoss = opnameItemsCalculation
    .filter((item) => item.difference < 0)
    .reduce((acc, item) => acc + Math.abs(item.differenceValue), 0);
  const sessionTotalSurplus = opnameItemsCalculation
    .filter((item) => item.difference > 0)
    .reduce((acc, item) => acc + item.differenceValue, 0);
  const sessionNetAdjustment = sessionTotalSurplus - sessionTotalLoss;
  const sessionTotalDiscrepancyQty = opnameItemsCalculation.reduce((acc, item) => acc + item.difference, 0);

  // Filter tampilan di modal opname
  const filteredOpnameItems = opnameItemsCalculation.filter((item) => {
    const matchesSearch =
      item.product.name.toLowerCase().includes(opnameSearch.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(opnameSearch.toLowerCase()) ||
      item.product.barcode.includes(opnameSearch);
    const matchesCat = opnameCategoryFilter === 'all' || item.product.categoryId === opnameCategoryFilter;

    let matchesDiff = true;
    if (opnameDiscrepancyFilter === 'diff_only') {
      matchesDiff = item.difference !== 0;
    } else if (opnameDiscrepancyFilter === 'match_only') {
      matchesDiff = item.difference === 0;
    }

    return matchesSearch && matchesCat && matchesDiff;
  });

  // Terapkan penyesuaian stok opname massal
  const handleApplyOpnameSession = () => {
    if (products.length === 0) {
      alert('Tidak ada barang dagangan yang dapat diaudit.');
      return;
    }

    const confirmMsg =
      totalMismatchCount > 0
        ? `Terdapat ${totalMismatchCount} barang dengan selisih fisik.\nEstimasi kerugian modal: ${formatRupiah(sessionTotalLoss)}.\n\nApakah Anda yakin ingin menerapkan penyesuaian stok sistem dengan jumlah fisik nyata?`
        : `Semua data fisik cocok dengan sistem. Simpan catatan audit ini?`;

    if (!window.confirm(confirmMsg)) return;

    const opnameNumber = `OPN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
      stockOpnames.length + 1
    ).padStart(3, '0')}`;

    const itemsToSave: StockOpnameItem[] = opnameItemsCalculation.map((calc) => ({
      productId: calc.product.id,
      sku: calc.product.sku,
      barcode: calc.product.barcode,
      productName: calc.product.name,
      categoryName: calc.product.categoryName,
      unit: calc.product.unit,
      systemStock: calc.product.stock,
      physicalStock: calc.physicalStock,
      difference: calc.difference,
      costPrice: calc.product.costPrice,
      differenceValue: calc.differenceValue,
      reason: calc.reason,
      notes: calc.notes,
    }));

    const newRecord: StockOpnameRecord = {
      id: 'opn-' + Date.now(),
      opnameNumber,
      date: new Date().toISOString(),
      auditorName: opnameAuditor.trim() || 'Admin',
      notes: opnameNotes.trim(),
      totalAuditedProducts: products.length,
      totalDiscrepancyQty: sessionTotalDiscrepancyQty,
      totalDiscrepancyLoss: sessionTotalLoss,
      totalDiscrepancySurplus: sessionTotalSurplus,
      netFinancialAdjustment: sessionNetAdjustment,
      status: 'Selesai',
      items: itemsToSave,
    };

    // Daftar penyesuaian stok fisik
    const adjustments = itemsToSave.map((it) => ({
      productId: it.productId,
      newStock: it.physicalStock,
    }));

    onApplyStockOpname(newRecord, adjustments);
    setShowOpnameModal(false);
    alert(`Stok Opname ${opnameNumber} berhasil disimpan dan stok fisik telah diselaraskan ke dalam sistem!`);
  };

  // ================= HANDLER QUICK OPNAME SINGLE ITEM =================
  const handleOpenQuickOpname = (p: Product) => {
    setQuickOpnameProduct(p);
    setQuickPhysicalQty(p.stock.toString());
    setQuickReason('Barang Hilang / Rusak');
    setQuickNotes('');
  };

  const handleApplyQuickOpname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickOpnameProduct) return;

    const pQty = parseInt(quickPhysicalQty, 10);
    if (isNaN(pQty) || pQty < 0) {
      alert('Jumlah fisik barang harus berupa angka bulat positif!');
      return;
    }

    const diff = pQty - quickOpnameProduct.stock;
    const diffVal = diff * quickOpnameProduct.costPrice;

    const opnameNumber = `OPN-Q-${Date.now().toString().slice(-6)}`;

    const opnameItem: StockOpnameItem = {
      productId: quickOpnameProduct.id,
      sku: quickOpnameProduct.sku,
      barcode: quickOpnameProduct.barcode,
      productName: quickOpnameProduct.name,
      categoryName: quickOpnameProduct.categoryName,
      unit: quickOpnameProduct.unit,
      systemStock: quickOpnameProduct.stock,
      physicalStock: pQty,
      difference: diff,
      costPrice: quickOpnameProduct.costPrice,
      differenceValue: diffVal,
      reason: diff === 0 ? 'Sesuai / Tidak Ada Masalah' : quickReason,
      notes: quickNotes.trim(),
    };

    const newRecord: StockOpnameRecord = {
      id: 'opn-' + Date.now(),
      opnameNumber,
      date: new Date().toISOString(),
      auditorName: currentUser.name || 'Admin',
      notes: `Penyesuaian cepat produk ${quickOpnameProduct.name} (${quickReason})`,
      totalAuditedProducts: 1,
      totalDiscrepancyQty: diff,
      totalDiscrepancyLoss: diff < 0 ? Math.abs(diffVal) : 0,
      totalDiscrepancySurplus: diff > 0 ? diffVal : 0,
      netFinancialAdjustment: diffVal,
      status: 'Selesai',
      items: [opnameItem],
    };

    onApplyStockOpname(newRecord, [{ productId: quickOpnameProduct.id, newStock: pQty }]);
    setQuickOpnameProduct(null);
    alert(`Stok produk "${quickOpnameProduct.name}" berhasil disesuaikan menjadi ${pQty} ${quickOpnameProduct.unit}!`);
  };

  // Unduh laporan riwayat sesi opname ke Excel/CSV
  const handleExportOpnameCSV = (record: StockOpnameRecord) => {
    const rows = [
      ['LAPORAN HASIL STOK OPNAME - JU-FAT CELL'],
      ['Nomor Opname', record.opnameNumber],
      ['Tanggal Pelaksanaan', formatDateTime(record.date)],
      ['Pemeriksa / Auditor', record.auditorName],
      ['Catatan Audit', record.notes || '-'],
      ['Total Produk Diaudit', record.totalAuditedProducts],
      ['Total Nilai Kerugian Fisik', formatRupiah(record.totalDiscrepancyLoss)],
      ['Total Nilai Surplus Fisik', formatRupiah(record.totalDiscrepancySurplus)],
      ['Penyesuaian Bersih (Net)', formatRupiah(record.netFinancialAdjustment)],
      [''],
      [
        'SKU',
        'Barcode',
        'Nama Produk',
        'Kategori',
        'Stok Sistem',
        'Stok Fisik',
        'Selisih (Qty)',
        'Harga Modal',
        'Nilai Selisih (Rp)',
        'Alasan / Kategori Selisih',
        'Catatan Pemeriksaan',
      ],
      ...record.items.map((it) => [
        it.sku,
        it.barcode,
        it.productName,
        it.categoryName,
        it.systemStock,
        it.physicalStock,
        it.difference,
        it.costPrice,
        it.differenceValue,
        it.reason,
        it.notes || '-',
      ]),
    ];

    exportToCSV(`Laporan_Stok_Opname_${record.opnameNumber}_${record.date.slice(0, 10)}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* ================= TAB HEADER UTAMA ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">
              Produk & Monitoring Stok Barang
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola katalog barang, harga modal/jual, serta penyesuaian stok opname fisik berkala
          </p>
        </div>

        {/* Tab Switcher: Katalog vs Stok Opname */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 text-amber-500" />
            <span>Katalog & Stok ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('opname')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'opname'
                ? 'bg-slate-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>Stok Opname & Audit</span>
            {stockOpnames.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                {stockOpnames.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= SUB-TAB 1: KATALOG PRODUK ================= */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Header Aksi Katalog */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-80 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari SKU, Barcode, atau nama produk..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Filter Status Stok */}
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
              >
                <option value="all">Semua Status Stok</option>
                <option value="low">⚠️ Stok Menipis (&le; Min)</option>
                <option value="out">❌ Stok Habis (0)</option>
              </select>

              {/* Tombol Tambah Barang Baru */}
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Tambah Barang Baru</span>
              </button>
            </div>
          </div>

          {/* Filter Kategori Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Tabel Data Produk */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4">Nama Produk</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-right">Harga Modal</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-center">Stok Fisik</th>
                    <th className="py-3 px-4 text-center">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-sm">Tidak ada produk ditemukan.</p>
                        <p className="text-xs">Klik "Tambah Barang Baru" untuk mulai mengisi data dagangan Anda.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isLow = p.stock <= p.minStock && p.stock > 0;
                      const isOut = p.stock <= 0;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono">
                            <div className="font-bold text-slate-900">{p.sku}</div>
                            <div className="text-[10px] text-slate-400">{p.barcode || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            {p.description && (
                              <div className="text-[10px] text-slate-400 line-clamp-1">{p.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                              {p.categoryName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                            {formatRupiah(p.costPrice)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(p.sellingPrice)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                                  isOut
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : isLow
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {p.stock} {p.unit}
                              </span>
                              {isOut && <span className="text-[10px] font-bold text-red-600">Habis</span>}
                              {isLow && <span className="text-[10px] font-bold text-amber-600">Menipis</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Tombol Quick Opname */}
                              <button
                                onClick={() => handleOpenQuickOpname(p)}
                                title="Audit / Sesuaikan Stok Fisik Produk Ini"
                                className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Edit */}
                              <button
                                onClick={() => handleOpenEdit(p)}
                                title="Ubah Data Produk"
                                className="p-1.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus produk "${p.name}"?`)) {
                                    onDeleteProduct(p.id);
                                  }
                                }}
                                title="Hapus Produk"
                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: STOK OPNAME & AUDIT FISIK ================= */}
      {activeSubTab === 'opname' && (
        <div className="space-y-6">
          {/* 4 Kartu KPI Ringkasan Stok Opname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Sesi Audit Opname
              </span>
              <div className="text-2xl font-black font-mono-num text-slate-900">
                {totalAuditSessions} Sesi
              </div>
              <span className="text-[11px] text-slate-500">Pencocokan berkala terselesaikan</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block flex items-center justify-between">
                <span>Total Kerugian Fisik</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </span>
              <div className="text-2xl font-black font-mono-num text-rose-600">
                {formatRupiah(totalAccumulatedLoss)}
              </div>
              <span className="text-[11px] text-rose-700">Akumulasi barang hilang/rusak</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block flex items-center justify-between">
                <span>Total Surplus Fisik</span>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </span>
              <div className="text-2xl font-black font-mono-num text-blue-600">
                {formatRupiah(totalAccumulatedSurplus)}
              </div>
              <span className="text-[11px] text-blue-700">Barang lebih dari stok sistem</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Audit Terakhir Kali
              </span>
              <div className="text-sm font-bold text-slate-900 truncate">
                {lastOpnameDate}
              </div>
              <span className="text-[11px] text-slate-500">
                {stockOpnames[0]?.auditorName ? `Oleh: ${stockOpnames[0].auditorName}` : 'Belum pernah audit'}
              </span>
            </div>
          </div>

          {/* Banner Aksi Mulai Sesi Baru */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">Sesi Audit Stok Opname Baru</h4>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Hitung jumlah fisik barang nyata di etalase/gudang toko. Masukkan kuantiti riil untuk mencocokkan stok sistem. Selisih kurang otomatis dihitung sebagai kerugian modal, dan selisih lebih dicatat sebagai surplus.
              </p>
            </div>

            <button
              onClick={handleStartOpnameSession}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Mulai Sesi Opname Sekarang</span>
            </button>
          </div>

          {/* Tabel Riwayat Sesi Stok Opname Sebelumnya */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h4 className="font-bold text-sm text-slate-900">Riwayat Catatan Sesi Stok Opname</h4>
              </div>
              <span className="text-xs text-slate-500">
                Total Riwayat: {stockOpnames.length} kali
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Opname</th>
                    <th className="py-3 px-4">Tanggal Audit</th>
                    <th className="py-3 px-4">Pemeriksa (Auditor)</th>
                    <th className="py-3 px-4 text-center">Item Diaudit</th>
                    <th className="py-3 px-4 text-center">Selisih Fisik (Qty)</th>
                    <th className="py-3 px-4 text-right">Nilai Kerugian</th>
                    <th className="py-3 px-4 text-right">Penyesuaian Bersih</th>
                    <th className="py-3 px-4 text-center">Aksi Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockOpnames.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-xs">Belum ada riwayat sesi stok opname.</p>
                        <p className="text-[11px]">Klik tombol "Mulai Sesi Opname Sekarang" di atas untuk melakukan audit fisik pertama.</p>
                      </td>
                    </tr>
                  ) : (
                    stockOpnames.map((rec) => {
                      const hasLoss = rec.totalDiscrepancyLoss > 0;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {rec.opnameNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {formatDateTime(rec.date)}
                          </td>
                          <td className="py-3 px-4 text-slate-800 font-medium">
                            {rec.auditorName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                              {rec.totalAuditedProducts} produk
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                rec.totalDiscrepancyQty < 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : rec.totalDiscrepancyQty > 0
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {rec.totalDiscrepancyQty > 0 ? `+${rec.totalDiscrepancyQty}` : rec.totalDiscrepancyQty}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                            {hasLoss ? `-${formatRupiah(rec.totalDiscrepancyLoss)}` : 'Rp 0'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span
                              className={
                                rec.netFinancialAdjustment < 0
                                  ? 'text-rose-600'
                                  : rec.netFinancialAdjustment > 0
                                  ? 'text-blue-600'
                                  : 'text-slate-600'
                              }
                            >
                              {rec.netFinancialAdjustment > 0 ? '+' : ''}
                              {formatRupiah(rec.netFinancialAdjustment)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Lihat Rincian */}
                              <button
                                onClick={() => setViewingOpnameRecord(rec)}
                                className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Rincian</span>
                              </button>

                              {/* Unduh CSV */}
                              <button
                                onClick={() => handleExportOpnameCSV(rec)}
                                title="Unduh Bukti Audit (Excel/CSV)"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SESI STOK OPNAME PENUH ================= */}
      {showOpnameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Formulir Audit & Penyesuaian Stok Opname
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan jumlah fisik barang nyata untuk mendeteksi selisih dan kerugian modal
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowOpnameModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Header Auditor & Catatan Sesi */}
            <div className="p-5 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Pemeriksa (Auditor) *
                </label>
                <input
                  type="text"
                  value={opnameAuditor}
                  onChange={(e) => setOpnameAuditor(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Sesi Opname
                </label>
                <input
                  type="text"
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Contoh: Audit akhir bulan toko, pengecekan rak ATK depan..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Filter & Pencarian Barang di Modal */}
            <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  value={opnameSearch}
                  onChange={(e) => setOpnameSearch(e.target.value)}
                  placeholder="Cari barcode, SKU, nama produk..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Kategori */}
                <select
                  value={opnameCategoryFilter}
                  onChange={(e) => setOpnameCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Filter Selisih */}
                <select
                  value={opnameDiscrepancyFilter}
                  onChange={(e) => setOpnameDiscrepancyFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="all">Semua Status</option>
                  <option value="diff_only">⚠️ Hanya Yang Selisih ({totalMismatchCount})</option>
                  <option value="match_only">✅ Hanya Yang Cocok</option>
                </select>
              </div>
            </div>

            {/* Tabel Perhitungan Fisik Opname (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                    <th className="py-2.5 px-3 text-center">Stok Fisik Nyata</th>
                    <th className="py-2.5 px-3 text-center">Selisih</th>
                    <th className="py-2.5 px-3 text-right">Nilai Selisih (Modal)</th>
                    <th className="py-2.5 px-3">Alasan / Kategori Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOpnameItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada barang yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredOpnameItems.map(({ product, physicalStock, difference, differenceValue, reason, notes }) => {
                      const isMinus = difference < 0;
                      const isPlus = difference > 0;
                      const isMatch = difference === 0;

                      return (
                        <tr
                          key={product.id}
                          className={`transition-colors ${
                            isMinus
                              ? 'bg-rose-50/50 hover:bg-rose-50'
                              : isPlus
                              ? 'bg-blue-50/50 hover:bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Nama & SKU */}
                          <td className="py-2.5 px-3 max-w-[200px]">
                            <div className="font-bold text-slate-900 truncate">{product.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                              <span>{product.sku}</span>
                              <span>•</span>
                              <span>Modal: {formatRupiah(product.costPrice)}</span>
                            </div>
                          </td>

                          {/* Stok Sistem */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {product.stock} {product.unit}
                          </td>

                          {/* Input Stok Fisik Nyata */}
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdatePhysicalQty(product.id, physicalStock - 1)}
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={physicalStock}
                                onChange={(e) =>
                                  handleUpdatePhysicalQty(product.id, parseInt(e.target.value, 10))
                                }
                                className={`w-16 py-1 text-center font-mono font-extrabold text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                                  isMinus
                                    ? 'border-rose-400 bg-rose-50 text-rose-700'
                                    : isPlus
                                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                                    : 'border-slate-300 text-slate-900'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdatePhysicalQty(product.id, physicalStock + 1)}
                                className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>

                              {/* Reset ke stok sistem */}
                              {!isMatch && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePhysicalQty(product.id, product.stock)}
                                  title="Reset sama dengan stok sistem"
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors ml-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Selisih Qty */}
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs inline-block ${
                                isMinus
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : isPlus
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isMatch ? '0 Cocok' : isMinus ? `${difference} Kurang` : `+${difference} Lebih`}
                            </span>
                          </td>

                          {/* Nilai Selisih Modal */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span
                              className={
                                isMinus ? 'text-rose-600' : isPlus ? 'text-blue-600' : 'text-slate-400'
                              }
                            >
                              {isMatch ? 'Rp 0' : formatRupiah(differenceValue)}
                            </span>
                          </td>

                          {/* Alasan & Catatan */}
                          <td className="py-2.5 px-3 space-y-1">
                            {!isMatch ? (
                              <>
                                <select
                                  value={reason}
                                  onChange={(e) =>
                                    setDiscrepancyReasons((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded-lg bg-white"
                                >
                                  <option value="Barang Hilang / Rusak">Barang Hilang / Rusak</option>
                                  <option value="Barang Cacat / Bocor / Expired">Barang Cacat / Kadaluarsa</option>
                                  <option value="Salah Hitung / Input Transaksi">Koreksi Salah Hitung Kasir</option>
                                  <option value="Bonus / Kelebihan Supplier">Bonus / Kelebihan Supplier</option>
                                  <option value="Lainnya">Lain-lain</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Catatan detail..."
                                  value={notes}
                                  onChange={(e) =>
                                    setItemNotes((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full px-2 py-0.5 text-[10px] border border-slate-200 rounded"
                                />
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Cocok dengan sistem</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary & Tombol Terapkan */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Produk Selisih:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {totalMismatchCount} dari {products.length} barang
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                <div>
                  <span className="text-rose-500 block text-[10px] uppercase font-bold">Kerugian Fisik (Modal):</span>
                  <span className="font-extrabold text-rose-600 text-sm font-mono">
                    -{formatRupiah(sessionTotalLoss)}
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                <div>
                  <span className="text-blue-500 block text-[10px] uppercase font-bold">Surplus Fisik (Modal):</span>
                  <span className="font-extrabold text-blue-600 text-sm font-mono">
                    +{formatRupiah(sessionTotalSurplus)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="flex-1 md:flex-none px-4 py-2.5 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleApplyOpnameSession}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan & Simpan Penyesuaian Stok</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL QUICK OPNAME (INDIVIDUAL PRODUK) ================= */}
      {quickOpnameProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Sesuaikan Stok Fisik Produk</h3>
              </div>
              <button
                onClick={() => setQuickOpnameProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyQuickOpname} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[10px] text-slate-400 font-mono">{quickOpnameProduct.sku}</div>
                <div className="font-bold text-slate-900 text-sm">{quickOpnameProduct.name}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>Harga Modal: {formatRupiah(quickOpnameProduct.costPrice)}</span>
                  <span>Stok Sistem Saat Ini: <strong>{quickOpnameProduct.stock} {quickOpnameProduct.unit}</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Stok Fisik Nyata di Toko *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    required
                    value={quickPhysicalQty}
                    onChange={(e) => setQuickPhysicalQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="font-semibold text-slate-500">{quickOpnameProduct.unit}</span>
                </div>
              </div>

              {/* Perhitungan Selisih Live */}
              {quickPhysicalQty !== '' && (
                <div className="p-3 rounded-xl border text-xs space-y-1 bg-slate-50 border-slate-200">
                  {(() => {
                    const diff = parseInt(quickPhysicalQty, 10) - quickOpnameProduct.stock;
                    const val = diff * quickOpnameProduct.costPrice;
                    return (
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span>Selisih: {diff > 0 ? `+${diff}` : diff} {quickOpnameProduct.unit}</span>
                        <span className={diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-blue-600' : 'text-emerald-600'}>
                          {diff < 0 ? `Kerugian: -${formatRupiah(Math.abs(val))}` : diff > 0 ? `Surplus: +${formatRupiah(val)}` : 'Sesuai (Rp 0)'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penyesuaian
                </label>
                <select
                  value={quickReason}
                  onChange={(e) => setQuickReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="Barang Hilang / Rusak">Barang Hilang / Rusak</option>
                  <option value="Barang Cacat / Kadaluarsa">Barang Cacat / Kadaluarsa</option>
                  <option value="Salah Hitung / Input Transaksi">Koreksi Salah Hitung Kasir</option>
                  <option value="Bonus / Kelebihan Supplier">Bonus / Kelebihan Supplier</option>
                  <option value="Lainnya">Lain-lain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Keterangan kondisi barang..."
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickOpnameProduct(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Terapkan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL RIWAYAT OPNAME ================= */}
      {viewingOpnameRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>Rincian Sesi Stok Opname</span>
                  <span className="font-mono text-emerald-600">{viewingOpnameRecord.opnameNumber}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tanggal: {formatDateTime(viewingOpnameRecord.date)} • Auditor: {viewingOpnameRecord.auditorName}
                </p>
              </div>

              <button
                onClick={() => setViewingOpnameRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Ringkasan Finansial Sesi */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Produk</span>
                  <span className="font-bold text-slate-900">{viewingOpnameRecord.totalAuditedProducts} item</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 uppercase font-bold block">Total Kerugian</span>
                  <span className="font-bold text-rose-600 font-mono">-{formatRupiah(viewingOpnameRecord.totalDiscrepancyLoss)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-500 uppercase font-bold block">Total Surplus</span>
                  <span className="font-bold text-blue-600 font-mono">+{formatRupiah(viewingOpnameRecord.totalDiscrepancySurplus)}</span>
                </div>
              </div>

              {viewingOpnameRecord.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold">Catatan:</span> {viewingOpnameRecord.notes}
                </div>
              )}

              {/* Tabel Item yang Diaudit */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3 text-center">Stok Awal</th>
                      <th className="py-2.5 px-3 text-center">Stok Fisik</th>
                      <th className="py-2.5 px-3 text-center">Selisih</th>
                      <th className="py-2.5 px-3 text-right">Nilai Selisih</th>
                      <th className="py-2.5 px-3">Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingOpnameRecord.items.map((it, idx) => (
                      <tr key={idx} className={it.difference !== 0 ? 'bg-slate-50/60' : ''}>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{it.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{it.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{it.systemStock}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{it.physicalStock}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          <span
                            className={
                              it.difference < 0
                                ? 'text-rose-600'
                                : it.difference > 0
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }
                          >
                            {it.difference > 0 ? `+${it.difference}` : it.difference}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          <span className={it.differenceValue < 0 ? 'text-rose-600' : it.differenceValue > 0 ? 'text-blue-600' : 'text-slate-400'}>
                            {formatRupiah(it.differenceValue)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <div>{it.reason}</div>
                          {it.notes && <div className="text-[10px] text-slate-400">{it.notes}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleExportOpnameCSV(viewingOpnameRecord)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Laporan (CSV/Excel)</span>
              </button>

              <button
                onClick={() => setViewingOpnameRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH / UBAH PRODUK ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Ubah Data Produk Dagangan' : 'Tambah Produk Dagangan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Barcode Produk</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan / ketik barcode"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pulpen Standard AE7 0.5 Black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Pcs, Rim, Pack..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Modal Beli (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Khusus admin toko</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Harga Jual Kasir (Rp) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900 text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400">Harga bayar pelanggan</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok Fisik *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Peringatan Min. Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Lokasi Rak</label>
                <input
                  type="text"
                  placeholder="Contoh: Rak A2, Etalase Depan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
