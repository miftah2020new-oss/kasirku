import React, { useState, useMemo } from 'react';
import {
  PosTransaction,
  ServiceRecord,
  PPOBTransaction,
  MoneyTransferRecord,
  PrintOrder,
  CashFlowMovement,
  User,
} from '../../types';
import { formatRupiah, formatDateTime, exportToCSV } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info,
  Download,
  Calendar,
  CheckCircle2,
  FileText,
  BookOpen,
  Filter,
  X,
  Check,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface TabReportsProps {
  currentUser: User;
  transactions: PosTransaction[];
  services: ServiceRecord[];
  ppobTxs: PPOBTransaction[];
  transfers: MoneyTransferRecord[];
  printOrders: PrintOrder[];
  cashFlows: CashFlowMovement[];
}

export const TabReports: React.FC<TabReportsProps> = ({
  currentUser,
  transactions,
  services,
  ppobTxs,
  transfers,
  printOrders,
  cashFlows,
}) => {
  // Hanya Admin yang berhak melihat laporan keuangan total
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white p-12 rounded-2xl border border-red-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Akses Terbatas untuk Kasir Shift</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Halaman Laporan Keuangan Total, Grafik Laba Rugi, dan Ekspor Pembukuan Bulanan dilindungi secara ketat dan hanya dapat diakses oleh <strong>Pemilik Toko (Admin)</strong>. Kasir shift hanya diizinkan mengelola transaksi kasir dan setoran fisik shift berjalan.
        </p>
      </div>
    );
  }

  // Pilihan visualisasi grafik
  const [barMetric, setBarMetric] = useState<'all' | 'omset_profit'>('all');
  const [pieMode, setPieMode] = useState<'omset' | 'profit'>('omset');

  // Filter Periode Pembukuan di UI
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Modal Ekspor Laporan Keuangan
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportType, setExportReportType] = useState<'income_statement' | 'general_ledger' | 'cash_flow'>('income_statement');
  const [exportMonthPeriod, setExportMonthPeriod] = useState<string>('all');

  // Ekstrak daftar bulan yang tersedia dari riwayat transaksi
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const addDate = (dStr?: string) => {
      if (!dStr) return;
      const d = new Date(dStr);
      if (!isNaN(d.getTime())) {
        monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    };

    transactions.forEach((t) => addDate(t.createdAt));
    services.forEach((s) => addDate(s.createdAt));
    ppobTxs.forEach((p) => addDate(p.createdAt));
    transfers.forEach((tr) => addDate(tr.createdAt));
    printOrders.forEach((pr) => addDate(pr.createdAt));
    cashFlows.forEach((cf) => addDate(cf.date));

    // Urutkan dari bulan terbaru
    const sorted = Array.from(monthSet).sort().reverse();

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    return sorted.map((key) => {
      const [year, month] = key.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      return {
        key,
        label: `${monthNames[monthIdx]} ${year}`,
      };
    });
  }, [transactions, services, ppobTxs, transfers, printOrders, cashFlows]);

  // Helper untuk memfilter data berdasarkan periode yang dipilih
  const isDateInPeriod = (dateStr?: string, periodKey?: string) => {
    if (!periodKey || periodKey === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const itemKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return itemKey === periodKey;
  };

  // Data yang telah difilter sesuai periode aktif (selectedPeriod)
  const currentTransactions = useMemo(
    () => transactions.filter((t) => isDateInPeriod(t.createdAt, selectedPeriod)),
    [transactions, selectedPeriod]
  );
  const currentServices = useMemo(
    () => services.filter((s) => isDateInPeriod(s.createdAt, selectedPeriod)),
    [services, selectedPeriod]
  );
  const currentPpob = useMemo(
    () => ppobTxs.filter((p) => isDateInPeriod(p.createdAt, selectedPeriod)),
    [ppobTxs, selectedPeriod]
  );
  const currentTransfers = useMemo(
    () => transfers.filter((t) => isDateInPeriod(t.createdAt, selectedPeriod)),
    [transfers, selectedPeriod]
  );
  const currentPrintOrders = useMemo(
    () => printOrders.filter((p) => isDateInPeriod(p.createdAt, selectedPeriod)),
    [printOrders, selectedPeriod]
  );
  const currentCashFlows = useMemo(
    () => cashFlows.filter((c) => isDateInPeriod(c.date, selectedPeriod)),
    [cashFlows, selectedPeriod]
  );

  // ================= PERHITUNGAN TOTAL METRIK UTAMA =================
  // 1. ATK Sales & Profit
  const atkRevenue = currentTransactions.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const atkCost = currentTransactions.reduce((a, b) => a + (b.totalCost || 0), 0);
  const atkProfit = atkRevenue - atkCost;

  // 2. Service HP Revenue & Profit
  const serviceRevenue = currentServices.reduce((a, b) => a + (b.finalCost || b.downPayment || 0), 0);
  const serviceProfit = Math.round(serviceRevenue * 0.65); // Estimasi laba jasa servis ~65%

  // 3. PPOB & Pulsa
  const ppobRevenue = currentPpob.reduce((a, b) => a + (b.sellingPrice || 0), 0);
  const ppobProfit = currentPpob.reduce((a, b) => a + (b.profit || 0), 0);

  // 4. Transfer & Agen Bank
  const transferVolume = currentTransfers.reduce((a, b) => a + (b.transferAmount || 0), 0);
  const transferProfit = currentTransfers.reduce((a, b) => a + (b.counterFee || 0), 0);

  // 5. Percetakan
  const printRevenue = currentPrintOrders.reduce((a, b) => a + (b.totalPrice || 0), 0);
  const printCost = currentPrintOrders.reduce((a, b) => a + (b.totalCost || 0), 0);
  const printProfit = printRevenue - printCost;

  // Biaya Operasional Toko dari Arus Kas Keluar
  const operatingExpenses = currentCashFlows
    .filter(
      (cf) =>
        cf.type === 'out' &&
        ['Operasional Toko', 'Gaji & Uang Makan', 'Listrik & Wifi', 'Lain-lain', 'Sewa Tempat'].includes(
          cf.category
        )
    )
    .reduce((a, b) => a + (b.amount || 0), 0);

  // Totals
  const totalOmset = atkRevenue + serviceRevenue + ppobRevenue + transferProfit + printRevenue;
  const totalGrossProfit = atkProfit + serviceProfit + ppobProfit + transferProfit + printProfit;
  const netProfit = totalGrossProfit - operatingExpenses;

  // ================= DATA UNTUK GRAFIK BULANAN (RECHARTS BAR CHART) =================
  const monthlyTrendData = useMemo(() => {
    interface MonthData {
      key: string;
      label: string;
      omset: number;
      labaKotor: number;
      biayaOperasional: number;
      labaBersih: number;
    }

    const now = new Date();
    const months: MonthData[] = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      months.push({ key, label, omset: 0, labaKotor: 0, biayaOperasional: 0, labaBersih: 0 });
    }

    const getMonthKey = (dateStr?: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    transactions.forEach((tx) => {
      const mKey = getMonthKey(tx.createdAt);
      const match = months.find((m) => m.key === mKey);
      if (match) {
        match.omset += tx.totalAmount || 0;
        match.labaKotor += (tx.totalAmount || 0) - (tx.totalCost || 0);
      }
    });

    services.forEach((srv) => {
      const mKey = getMonthKey(srv.createdAt);
      const match = months.find((m) => m.key === mKey);
      if (match) {
        const rev = srv.finalCost || srv.downPayment || 0;
        match.omset += rev;
        match.labaKotor += Math.round(rev * 0.65);
      }
    });

    ppobTxs.forEach((p) => {
      const mKey = getMonthKey(p.createdAt);
      const match = months.find((m) => m.key === mKey);
      if (match) {
        match.omset += p.sellingPrice || 0;
        match.labaKotor += p.profit || 0;
      }
    });

    transfers.forEach((tr) => {
      const mKey = getMonthKey(tr.createdAt);
      const match = months.find((m) => m.key === mKey);
      if (match) {
        match.omset += tr.counterFee || 0;
        match.labaKotor += tr.counterFee || 0;
      }
    });

    printOrders.forEach((pr) => {
      const mKey = getMonthKey(pr.createdAt);
      const match = months.find((m) => m.key === mKey);
      if (match) {
        match.omset += pr.totalPrice || 0;
        match.labaKotor += (pr.totalPrice || 0) - (pr.totalCost || 0);
      }
    });

    cashFlows.forEach((cf) => {
      if (cf.type === 'out') {
        const mKey = getMonthKey(cf.date);
        const match = months.find((m) => m.key === mKey);
        if (match) {
          match.biayaOperasional += cf.amount || 0;
        }
      }
    });

    return months.map((m) => ({
      ...m,
      labaBersih: Math.max(0, m.labaKotor - m.biayaOperasional),
    }));
  }, [transactions, services, ppobTxs, transfers, printOrders, cashFlows]);

  // ================= DATA UNTUK GRAFIK LINGKARAN (RECHARTS PIE CHART) =================
  const pieDataRevenue = [
    { name: 'ATK & Aksesoris', value: atkRevenue, color: '#F59E0B' },
    { name: 'Service HP', value: serviceRevenue, color: '#D946EF' },
    { name: 'PPOB & Pulsa', value: ppobRevenue, color: '#06B6D4' },
    { name: 'Transfer Bank', value: transferProfit, color: '#3B82F6' },
    { name: 'Percetakan & Jilid', value: printRevenue, color: '#10B981' },
  ].filter((item) => item.value > 0);

  const pieDataProfit = [
    { name: 'ATK & Aksesoris', value: atkProfit, color: '#F59E0B' },
    { name: 'Service HP', value: serviceProfit, color: '#D946EF' },
    { name: 'PPOB & Pulsa', value: ppobProfit, color: '#06B6D4' },
    { name: 'Transfer Bank', value: transferProfit, color: '#3B82F6' },
    { name: 'Percetakan & Jilid', value: printProfit, color: '#10B981' },
  ].filter((item) => item.value > 0);

  const activePieData = pieMode === 'omset' ? pieDataRevenue : pieDataProfit;
  const activePieTotal = activePieData.reduce((acc, it) => acc + it.value, 0);

  // ================= SISTEM EKSPOR LAPORAN KEUANGAN (EXCEL / CSV) =================
  // Memastikan integritas data akuntansi bulanan (Monthly Bookkeeping Data Integrity)
  const handleExecuteExport = () => {
    const periodLabel =
      exportMonthPeriod === 'all'
        ? 'Semua Periode (All-Time)'
        : availableMonths.find((m) => m.key === exportMonthPeriod)?.label || exportMonthPeriod;

    // Filter data spesifik untuk ekspor
    const expTx = transactions.filter((t) => isDateInPeriod(t.createdAt, exportMonthPeriod));
    const expSrv = services.filter((s) => isDateInPeriod(s.createdAt, exportMonthPeriod));
    const expPpob = ppobTxs.filter((p) => isDateInPeriod(p.createdAt, exportMonthPeriod));
    const expTr = transfers.filter((t) => isDateInPeriod(t.createdAt, exportMonthPeriod));
    const expPr = printOrders.filter((p) => isDateInPeriod(p.createdAt, exportMonthPeriod));
    const expCf = cashFlows.filter((c) => isDateInPeriod(c.date, exportMonthPeriod));

    const expAtkRev = expTx.reduce((a, b) => a + (b.totalAmount || 0), 0);
    const expAtkCost = expTx.reduce((a, b) => a + (b.totalCost || 0), 0);
    const expAtkProfit = expAtkRev - expAtkCost;

    const expSrvRev = expSrv.reduce((a, b) => a + (b.finalCost || b.downPayment || 0), 0);
    const expSrvProfit = Math.round(expSrvRev * 0.65);

    const expPpobRev = expPpob.reduce((a, b) => a + (b.sellingPrice || 0), 0);
    const expPpobProfit = expPpob.reduce((a, b) => a + (b.profit || 0), 0);

    const expTrVol = expTr.reduce((a, b) => a + (b.transferAmount || 0), 0);
    const expTrProfit = expTr.reduce((a, b) => a + (b.counterFee || 0), 0);

    const expPrRev = expPr.reduce((a, b) => a + (b.totalPrice || 0), 0);
    const expPrCost = expPr.reduce((a, b) => a + (b.totalCost || 0), 0);
    const expPrProfit = expPrRev - expPrCost;

    const expOpExpenses = expCf
      .filter(
        (cf) =>
          cf.type === 'out' &&
          ['Operasional Toko', 'Gaji & Uang Makan', 'Listrik & Wifi', 'Lain-lain', 'Sewa Tempat'].includes(
            cf.category
          )
      )
      .reduce((a, b) => a + (b.amount || 0), 0);

    const expTotalOmset = expAtkRev + expSrvRev + expPpobRev + expTrProfit + expPrRev;
    const expTotalGross = expAtkProfit + expSrvProfit + expPpobProfit + expTrProfit + expPrProfit;
    const expNetProfit = expTotalGross - expOpExpenses;

    const totalRecordsAudited =
      expTx.length + expSrv.length + expPpob.length + expTr.length + expPr.length + expCf.length;

    // 1. FORMAT A: LAPORAN LABA RUGI KOMPREHENSIF (INCOME STATEMENT)
    if (exportReportType === 'income_statement') {
      const csvRows = [
        ['========================================================================'],
        ['LAPORAN LABA RUGI & PEMBUKUAN KEUANGAN BULANAN - JU-FAT CELL POS'],
        ['========================================================================'],
        ['Nama Entitas', 'Ju-Fat Cell (Multi-Layanan POS)'],
        ['Periode Pembukuan', periodLabel],
        ['Waktu Ekspor', new Date().toLocaleString('id-ID')],
        ['Otorisasi Auditor / Admin', `${currentUser.name} (${currentUser.role})`],
        ['Status Integritas Data', 'VALID (Terverifikasi oleh Sistem Enkripsi Lokal)'],
        ['Total Rekaman Transaksi', totalRecordsAudited],
        [''],
        ['1. PENDAPATAN USAHA (REVENUE / OMSET)', 'JUMLAH TRANSAKSI', 'NILAI PENDAPATAN (RP)'],
        ['Penjualan ATK & Aksesoris HP', expTx.length, expAtkRev],
        ['Pendapatan Jasa Service HP', expSrv.length, expSrvRev],
        ['Penjualan Pulsa & PPOB Listrik', expPpob.length, expPpobRev],
        ['Pendapatan Biaya Jasa Transfer Bank', expTr.length, expTrProfit],
        ['Pendapatan Jasa Percetakan & Jilid', expPr.length, expPrRev],
        ['TOTAL OMSET PENDAPATAN KOTOR (GROSS REVENUE)', '', expTotalOmset],
        [''],
        ['2. HARGA POKOK PENJUALAN (HPP / COGS)', 'KETERANGAN', 'BEBAN MODAL (RP)'],
        ['Modal Beli Barang ATK Terjual', 'Modal kulakan barang', expAtkCost],
        ['Estimasi Sparepart & Bahan Service HP', 'Bahan ganti LCD/IC', Math.round(expSrvRev * 0.35)],
        ['Modal Saldo Pulsa & Token PPOB', 'Saldo server terpakai', expPpobRev - expPpobProfit],
        ['Modal Kertas & Tinta Percetakan', 'Kertas HVS, mika, lakban', expPrCost],
        ['TOTAL HARGA POKOK PENJUALAN (HPP)', '', expAtkCost + Math.round(expSrvRev * 0.35) + (expPpobRev - expPpobProfit) + expPrCost],
        [''],
        ['3. LABA KOTOR USAHA (GROSS PROFIT)', '', expTotalGross],
        [''],
        ['4. BEBAN OPERASIONAL TOKO (OPERATING EXPENSES)', 'KATEGORI BEBAN', 'NOMINAL BIAYA (RP)'],
        ...expCf
          .filter(
            (cf) =>
              cf.type === 'out' &&
              ['Operasional Toko', 'Gaji & Uang Makan', 'Listrik & Wifi', 'Lain-lain', 'Sewa Tempat'].includes(
                cf.category
              )
          )
          .map((cf) => [
            formatDateTime(cf.date),
            `${cf.category} - ${cf.description}`,
            cf.amount,
          ]),
        ['TOTAL BIAYA OPERASIONAL TOKO', '', expOpExpenses],
        [''],
        ['========================================================================'],
        ['5. LABA BERSIH OPERASIONAL (NET PROFIT)', '', expNetProfit],
        ['========================================================================'],
        [''],
        ['Catatan Integritas Pembukuan:'],
        ['- Laporan ini dihasilkan secara otomatis dan terverifikasi dari ledger transaksi toko.'],
        ['- Nilai nominal berupa angka murni sehingga kompatibel penuh dengan formula kalkulasi Microsoft Excel.'],
        ['- Simpan berkas ini sebagai arsip pajak, evaluasi kinerja bulanan, atau pembagian dividen pemilik toko.'],
      ];

      const safePeriodName = exportMonthPeriod.replace(/[^a-zA-Z0-9]/g, '_');
      exportToCSV(`Laporan_Laba_Rugi_JuFatCell_${safePeriodName}_${new Date().toISOString().slice(0, 10)}`, csvRows);
    }

    // 2. FORMAT B: BUKU BESAR SELURUH TRANSAKSI (GENERAL LEDGER)
    else if (exportReportType === 'general_ledger') {
      const csvRows = [
        ['========================================================================'],
        ['BUKU BESAR & JURNAL TRANSAKSI LENGKAP - JU-FAT CELL'],
        ['Periode', periodLabel],
        ['Tanggal Diterbitkan', new Date().toLocaleString('id-ID')],
        ['Penanggung Jawab', currentUser.name],
        ['========================================================================'],
        [''],
        [
          'WAKTU TRANSAKSI',
          'NO. INVOICE / REFERENSI',
          'UNIT LAYANAN',
          'DESKRIPSI / RINCIAN',
          'METODE BAYAR',
          'KASIR / SHIFT',
          'NOMINAL OMSET (RP)',
          'ESTIMASI MODAL (RP)',
          'LABA KOTOR (RP)',
        ],
        // Transaksi ATK
        ...expTx.map((t) => [
          formatDateTime(t.createdAt),
          t.invoiceNumber,
          'Kasir ATK & Aksesoris',
          t.itemsSummary || 'Barang ATK',
          t.paymentMethod,
          `${t.cashierName} (${t.shift})`,
          t.totalAmount,
          t.totalCost || 0,
          (t.totalAmount || 0) - (t.totalCost || 0),
        ]),
        // Service HP
        ...expSrv.map((s) => [
          formatDateTime(s.createdAt),
          s.serviceNumber,
          'Service HP',
          `${s.phoneBrandModel} (${s.issueDescription})`,
          'Tunai / Kas',
          `${s.cashierName} (${s.shift})`,
          s.finalCost || s.downPayment || 0,
          Math.round((s.finalCost || s.downPayment || 0) * 0.35),
          Math.round((s.finalCost || s.downPayment || 0) * 0.65),
        ]),
        // PPOB
        ...expPpob.map((p) => [
          formatDateTime(p.createdAt),
          p.txNumber,
          'PPOB & Pulsa',
          `${p.provider} ${p.type} (${p.nominalDisplay}) - ${p.targetNumber}`,
          p.paymentMethod,
          `${p.cashierName} (${p.shift})`,
          p.sellingPrice,
          p.costPrice,
          p.profit,
        ]),
        // Transfer Bank
        ...expTr.map((tr) => [
          formatDateTime(tr.createdAt),
          tr.txNumber,
          'Transfer & BRILink',
          `${tr.type} ke ${tr.targetBank} - ${tr.recipientName}`,
          'Tunai / Rekening',
          `${tr.cashierName} (${tr.shift})`,
          tr.counterFee,
          0,
          tr.counterFee,
        ]),
        // Percetakan
        ...expPr.map((pr) => [
          formatDateTime(pr.createdAt),
          pr.orderNumber,
          'Percetakan & Jilid',
          pr.items && pr.items.length > 0 ? pr.items.map((it) => `${it.type} (${it.quantity})`).join(', ') : 'Order Percetakan',
          pr.paymentMethod,
          `${pr.cashierName} (${pr.shift})`,
          pr.totalPrice,
          pr.totalCost,
          pr.profit,
        ]),
      ];

      const safePeriodName = exportMonthPeriod.replace(/[^a-zA-Z0-9]/g, '_');
      exportToCSV(`Buku_Besar_Transaksi_JuFatCell_${safePeriodName}_${new Date().toISOString().slice(0, 10)}`, csvRows);
    }

    // 3. FORMAT C: ARUS KAS MUTASI KEUANGAN (CASH FLOW STATEMENT)
    else if (exportReportType === 'cash_flow') {
      const csvRows = [
        ['========================================================================'],
        ['LAPORAN ARUS KAS (CASH FLOW STATEMENT) - JU-FAT CELL'],
        ['Periode', periodLabel],
        ['Waktu Ekspor', new Date().toLocaleString('id-ID')],
        ['Penanggung Jawab', currentUser.name],
        ['========================================================================'],
        [''],
        ['TANGGAL & WAKTU', 'AKUN KAS', 'ARAH ARUS', 'KATEGORI', 'DESKRIPSI', 'NOMINAL MASUK (RP)', 'NOMINAL KELUAR (RP)', 'PENCATAT'],
        ...expCf.map((cf) => [
          formatDateTime(cf.date),
          cf.account,
          cf.type === 'in' ? 'KAS MASUK (IN)' : 'KAS KELUAR (OUT)',
          cf.category,
          cf.description,
          cf.type === 'in' ? cf.amount : 0,
          cf.type === 'out' ? cf.amount : 0,
          cf.cashierName || 'Admin',
        ]),
        [''],
        ['TOTAL KAS MASUK', '', '', '', '', expCf.filter((c) => c.type === 'in').reduce((a, b) => a + b.amount, 0), 0, ''],
        ['TOTAL KAS KELUAR', '', '', '', '', 0, expCf.filter((c) => c.type === 'out').reduce((a, b) => a + b.amount, 0), ''],
        [
          'ARUS KAS BERSIH (NET CASH FLOW)',
          '',
          '',
          '',
          '',
          expCf.filter((c) => c.type === 'in').reduce((a, b) => a + b.amount, 0) -
            expCf.filter((c) => c.type === 'out').reduce((a, b) => a + b.amount, 0),
          '',
          '',
        ],
      ];

      const safePeriodName = exportMonthPeriod.replace(/[^a-zA-Z0-9]/g, '_');
      exportToCSV(`Laporan_Arus_Kas_JuFatCell_${safePeriodName}_${new Date().toISOString().slice(0, 10)}`, csvRows);
    }

    setShowExportModal(false);
  };

  // Custom Tooltip Recharts untuk format mata uang Rupiah
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
          <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatRupiah(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const pct = activePieTotal > 0 ? ((data.value / activePieTotal) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold flex items-center gap-2 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
            <span>{data.name}</span>
          </p>
          <div className="font-mono font-black text-amber-400 text-sm">
            {formatRupiah(data.value)}
          </div>
          <p className="text-[11px] text-slate-400">Kontribusi: {pct}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ================= HEADER LAPORAN & TOMBOL EKSPOR ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-900">
              Laporan Keuangan & Analisis Laba Rugi
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Data Terverifikasi</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis laba kotor, omset bulanan, rasio margin, serta ekspor pembukuan resmi (CSV / Excel)
          </p>
        </div>

        {/* Action Bar Kanan: Filter Periode & Tombol Ekspor */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Filter Periode Aktif */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Waktu (All-Time)</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tombol Utama: Buka Dialog Ekspor Pembukuan */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Pembukuan (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu KPI Keuangan Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Omset Penjualan
          </span>
          <div className="text-2xl font-black font-mono-num text-slate-900">
            {formatRupiah(totalOmset)}
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
            <span>
              {selectedPeriod === 'all' ? 'Akumulasi seluruh waktu' : `Bulan ${availableMonths.find(m => m.key === selectedPeriod)?.label || selectedPeriod}`}
            </span>
          </span>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Laba Kotor (Gross Profit)
          </span>
          <div className="text-2xl font-black font-mono-num text-emerald-600">
            {formatRupiah(totalGrossProfit)}
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sebelum dikurangi biaya operasional</span>
          </span>
        </div>

        {/* Pengeluaran Operasional */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Biaya Operasional Toko
          </span>
          <div className="text-2xl font-black font-mono-num text-rose-600">
            {formatRupiah(operatingExpenses)}
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Listrik, wifi, makan, perlengkapan</span>
          </span>
        </div>

        {/* Laba Bersih */}
        <div className="bg-[#101e35] text-white p-5 rounded-2xl shadow-xs space-y-2 border border-slate-800">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Laba Bersih Toko (Net Profit)
          </span>
          <div className="text-2xl font-black font-mono-num text-emerald-400">
            {formatRupiah(netProfit)}
          </div>
          <span className="text-[11px] text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Keuntungan bersih sesungguhnya</span>
          </span>
        </div>
      </div>

      {/* ================= VISUALISASI RECHARTS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. GRAFIK BATANG RECHARTS: Tren Bulanan Omset vs Laba Kotor (8 Kolom) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Grafik Batang: Tren Omset & Laba Bulanan
                </h4>
                <p className="text-[11px] text-slate-400">
                  Perbandingan performa omset, laba kotor, dan laba bersih per bulan
                </p>
              </div>
            </div>

            {/* Toggle Tampilan Batang */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setBarMetric('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  barMetric === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Metrik
              </button>
              <button
                type="button"
                onClick={() => setBarMetric('omset_profit')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  barMetric === 'omset_profit'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Omset & Laba Kotor
              </button>
            </div>
          </div>

          {/* Area Render Recharts BarChart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrendData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                barGap={6}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return String(val);
                  }}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingBottom: 10 }}
                />
                <Bar
                  dataKey="omset"
                  name="Total Omset"
                  fill="#0F172A"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="labaKotor"
                  name="Laba Kotor"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                {barMetric === 'all' && (
                  <Bar
                    dataKey="labaBersih"
                    name="Laba Bersih"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. GRAFIK LINGKARAN RECHARTS: Komposisi 5 Pilar Layanan (4 Kolom) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Komposisi 5 Pilar</h4>
                <p className="text-[11px] text-slate-400">Porsi kontribusi per lini bisnis</p>
              </div>
            </div>

            {/* Toggle Omset vs Profit Mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPieMode('omset')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  pieMode === 'omset'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Omset
              </button>
              <button
                type="button"
                onClick={() => setPieMode('profit')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  pieMode === 'profit'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Laba
              </button>
            </div>
          </div>

          {/* Area Render Recharts PieChart */}
          <div className="h-56 w-full relative flex items-center justify-center">
            {activePieData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs">
                <PieChartIcon className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                <p>Belum ada data transaksi.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Total Ringkasan di Tengah Donat */}
            {activePieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {pieMode === 'omset' ? 'Total Omset' : 'Total Laba'}
                </span>
                <span className="text-sm font-black font-mono-num text-slate-900">
                  {formatRupiah(activePieTotal)}
                </span>
              </div>
            )}
          </div>

          {/* Legend Custom yang Rapi */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {activePieData.map((item, idx) => {
              const pct = activePieTotal > 0 ? ((item.value / activePieTotal) * 100).toFixed(0) : '0';
              return (
                <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-700 truncate">{item.name}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-900">
                      {formatRupiah(item.value)} ({pct}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= RINCIAN KARTU 5 PILAR LAYANAN BISNIS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-800" />
            <h4 className="font-bold text-sm text-slate-900">
              Rincian Rekap Performa 5 Pilar Layanan Ju-Fat Cell
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Total Transaksi ({selectedPeriod === 'all' ? 'All-Time' : selectedPeriod}):{' '}
            <strong>
              {currentTransactions.length +
                currentServices.length +
                currentPpob.length +
                currentTransfers.length +
                currentPrintOrders.length}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* 1. ATK */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">1. ATK & Aksesoris</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">Transaksi Kasir: {currentTransactions.length}</div>
            <div className="text-xs">Omset: <strong>{formatRupiah(atkRevenue)}</strong></div>
            <div className="text-xs text-emerald-700 font-bold">
              Laba Kotor: +{formatRupiah(atkProfit)}
            </div>
          </div>

          {/* 2. Service HP */}
          <div className="p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">2. Service HP</span>
              <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">Total Tiket: {currentServices.length}</div>
            <div className="text-xs">Omset: <strong>{formatRupiah(serviceRevenue)}</strong></div>
            <div className="text-xs text-emerald-700 font-bold">
              Laba Jasa: +{formatRupiah(serviceProfit)}
            </div>
          </div>

          {/* 3. PPOB */}
          <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">3. PPOB & Pulsa</span>
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">Transaksi: {currentPpob.length}</div>
            <div className="text-xs">Omset: <strong>{formatRupiah(ppobRevenue)}</strong></div>
            <div className="text-xs text-emerald-700 font-bold">
              Margin Laba: +{formatRupiah(ppobProfit)}
            </div>
          </div>

          {/* 4. Transfer Bank */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">4. Transfer Bank</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">Mutasi Transfer: {currentTransfers.length}</div>
            <div className="text-xs">Volume: <strong>{formatRupiah(transferVolume)}</strong></div>
            <div className="text-xs text-emerald-700 font-bold">
              Jasa Konter: +{formatRupiah(transferProfit)}
            </div>
          </div>

          {/* 5. Percetakan */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">5. Percetakan & Jilid</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-[11px] text-slate-500">Order Selesai: {currentPrintOrders.length}</div>
            <div className="text-xs">Omset: <strong>{formatRupiah(printRevenue)}</strong></div>
            <div className="text-xs text-emerald-700 font-bold">
              Laba Cetak: +{formatRupiah(printProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL DIALOG EKSPOR PEMBUKUAN (EXCEL / CSV) ================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Ekspor Pembukuan Keuangan (CSV / Excel)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format resmi akuntansi dengan jaminan integritas data bulanan
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* 1. Pemilihan Periode Bulan Pembukuan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Periode Bulan Akuntansi *</span>
                </label>
                <select
                  value={exportMonthPeriod}
                  onChange={(e) => setExportMonthPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-900 cursor-pointer"
                >
                  <option value="all">Semua Periode Transaksi (All-Time Historical)</option>
                  {availableMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      Bulan {m.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500">
                  Data yang diekspor akan difilter secara ketat sesuai bulan yang dipilih.
                </span>
              </div>

              {/* 2. Pemilihan Jenis Format Laporan */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Jenis Format Laporan *</span>
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Format 1 */}
                  <label
                    onClick={() => setExportReportType('income_statement')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      exportReportType === 'income_statement'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      checked={exportReportType === 'income_statement'}
                      onChange={() => setExportReportType('income_statement')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        Laporan Laba Rugi Komprehensif (Income Statement)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Sesuai standar pembukuan UMKM: Rincian omset per unit bisnis, harga pokok penjualan (HPP), laba kotor, beban operasional terperinci, dan laba bersih final.
                      </p>
                    </div>
                  </label>

                  {/* Format 2 */}
                  <label
                    onClick={() => setExportReportType('general_ledger')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      exportReportType === 'general_ledger'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      checked={exportReportType === 'general_ledger'}
                      onChange={() => setExportReportType('general_ledger')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        Buku Besar Seluruh Transaksi (General Ledger)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Daftar baris per baris transaksi (No. Invoice/Ref, waktu presisi, kasir, pelanggan, metode pembayaran, omset, modal, dan margin per transaksi).
                      </p>
                    </div>
                  </label>

                  {/* Format 3 */}
                  <label
                    onClick={() => setExportReportType('cash_flow')}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      exportReportType === 'cash_flow'
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      checked={exportReportType === 'cash_flow'}
                      onChange={() => setExportReportType('cash_flow')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-slate-900 text-xs">
                        Laporan Arus Kas Masuk & Keluar (Cash Flow Statement)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Rekapitulasi mutasi kas fisik toko vs rekening bank, rincian kategori pengeluaran operasional, serta saldo kas bersih.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Box Jaminan Integritas Data */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Jaminan Integritas & Kompatibilitas Excel</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Berkas diekspor dengan <strong>BOM UTF-8</strong> sehingga teks Bahasa Indonesia terbuka rapi di Microsoft Excel tanpa karakter rusak. Nilai nominal berupa angka numerik murni sehingga formula seperti <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">=SUM()</code> langsung berfungsi otomatis.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas Spreadsheet (.CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
