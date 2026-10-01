export type UserRole = 'admin' | 'shift1' | 'shift2';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  shiftName: 'Shift 1' | 'Shift 2' | 'Semua Shift';
  twoFactorEnabled: boolean;
  avatarUrl?: string;
}

export interface ShiftSession {
  id: string;
  shiftName: 'Shift 1' | 'Shift 2';
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number; // Modal Kas Awal di laci
  expectedCash: number; // Kas sistem: Modal + Penjualan Tunai + Kas Masuk - Kas Keluar
  actualCash?: number; // Kas fisik yang dihitung saat tutup shift
  difference?: number; // Selisih (actual - expected)
  totalCashSales: number;
  totalNonCashSales: number;
  totalServiceRevenue: number;
  totalPPOBProfit: number;
  totalTransferProfit: number;
  totalPrintRevenue: number;
  status: 'active' | 'closed';
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  costPrice: number; // Harga Modal/Beli (Disembunyikan dari Shift 1 & Shift 2)
  sellingPrice: number; // Harga Jual
  stock: number;
  minStock: number; // Peringatan stok menipis jika stock <= minStock
  unit: string; // Pcs, Pack, Rim, Lembar, Rol, dll.
  description?: string;
}

export interface StockOpnameItem {
  productId: string;
  sku: string;
  barcode: string;
  productName: string;
  categoryName: string;
  unit: string;
  systemStock: number; // Stok di sistem sebelum penyesuaian
  physicalStock: number; // Jumlah fisik nyata hasil hitung
  difference: number; // physicalStock - systemStock
  costPrice: number; // Harga modal per unit
  differenceValue: number; // difference * costPrice
  reason: string; // Alasan: "Barang Hilang / Rusak", "Koreksi Salah Hitung", "Bonus Supplier", dll.
  notes?: string;
}

export interface StockOpnameRecord {
  id: string;
  opnameNumber: string; // cth: "OPN-202610-001"
  date: string;
  auditorName: string; // Pemeriksa / Admin
  notes: string;
  totalAuditedProducts: number;
  totalDiscrepancyQty: number; // Total selisih kuantiti (+ / -)
  totalDiscrepancyLoss: number; // Total nilai kerugian barang hilang/rusak (Rp)
  totalDiscrepancySurplus: number; // Total nilai kelebihan barang (Rp)
  netFinancialAdjustment: number; // Selisih nilai bersih modal (Rp)
  status: 'Selesai' | 'Draf';
  items: StockOpnameItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discount: number;
  subtotal: number;
}

export type ServiceStatus = 'Diterima' | 'Diproses' | 'Selesai' | 'Diambil' | 'Batal';

export interface ServiceRecord {
  id: string;
  serviceNumber: string;
  customerName: string;
  customerPhone: string;
  phoneBrandModel: string; // misal: "iPhone 11", "Samsung Galaxy A54", "Redmi Note 12"
  issueDescription: string; // Keluhan / Kerusakan
  estimatedCost: number; // Estimasi Biaya
  downPayment: number; // Uang Muka (DP)
  finalCost: number; // Biaya Akhir setelah servis selesai
  status: ServiceStatus;
  technicianNotes?: string;
  passcodeOrPattern?: string; // Disimpan dengan enkripsi E2EE
  includedAccessories?: string[]; // Unit HP, Batere, Dus, Kabel, SIM Card
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  pickedUpAt?: string;
  warrantyDays: number; // Default 7 hari garansi servis
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
}

export type PPOBType =
  | 'Pulsa'
  | 'Paket Data'
  | 'Token PLN'
  | 'Bayar PLN'
  | 'Bayar BPJS'
  | 'Bayar PDAM'
  | 'Top Up DANA'
  | 'Top Up OVO'
  | 'Top Up Gopay'
  | 'Top Up ShopeePay'
  | 'Top Up LinkAja'
  | 'Top Up Game'
  | 'Lainnya';

export interface PPOBTransaction {
  id: string;
  txNumber: string;
  type: PPOBType;
  targetNumber: string; // No HP / No Meter / ID Pelanggan
  provider: string; // Telkomsel, Indosat, PLN, BPJS, dll.
  nominalDisplay: string; // cth: "50.000", "100.000"
  costPrice: number; // Harga Modal (Disembunyikan dari kasir)
  sellingPrice: number; // Harga Jual
  profit: number; // Margin (sellingPrice - costPrice)
  paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'Hutang';
  customerPaid: number;
  change: number;
  createdAt: string;
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
  status: 'Sukses' | 'Pending' | 'Gagal';
  customerName?: string;
}

export type PrintServiceType =
  | 'Print A4 Hitam Putih'
  | 'Print A4 Warna'
  | 'Print F4 Hitam Putih'
  | 'Print F4 Warna'
  | 'Cetak Foto 2x3'
  | 'Cetak Foto 3x4'
  | 'Cetak Foto 4x6'
  | 'Cetak Banner/Spanduk'
  | 'Jilid Biasa (Lakban)'
  | 'Jilid Spiral Plastik/Kawat'
  | 'Jilid Hardcover'
  | 'Laminasi';

export interface PrintOrderItem {
  type: PrintServiceType;
  quantity: number; // Jumlah lembar / eksemplar / meter persegi
  unitPrice: number;
  costPrice: number;
  subtotal: number;
  notes?: string;
}

export interface PrintOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  items: PrintOrderItem[];
  totalPrice: number;
  totalCost: number;
  profit: number;
  paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'Hutang';
  customerPaid: number;
  change: number;
  createdAt: string;
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
}

export type MoneyTransferType =
  | 'Tarik Tunai'
  | 'Setor Tunai'
  | 'Transfer Antar Bank'
  | 'Transfer Sesama Bank'
  | 'Top Up E-Wallet'
  | 'Pembayaran BRIVA/VA';

export interface MoneyTransferRecord {
  id: string;
  txNumber: string;
  type: MoneyTransferType;
  senderName: string;
  senderPhone?: string;
  targetBank: string; // BRI, BCA, Mandiri, BNI, Dana, dll.
  accountNumber: string; // No Rekening / No E-wallet
  recipientName: string; // Nama Pemilik Rekening
  transferAmount: number; // Nominal Transfer
  bankFee: number; // Biaya Admin Bank (Modal keluar ke bank)
  counterFee: number; // Biaya Jasa Konter (Keuntungan Ju-Fat Cell)
  totalCustomerPay: number; // Nominal + bankFee + counterFee (atau sesuai tipe)
  paymentMethod: 'Cash' | 'Transfer/Debit' | 'Hutang';
  status: 'Berhasil' | 'Pending' | 'Batal';
  notes?: string;
  createdAt: string;
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
}

export interface DebtPayment {
  id: string;
  receiptNumber: string;
  paymentDate: string;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod: 'Cash' | 'Transfer';
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
  notes?: string;
}

export interface DebtRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  totalDebt: number; // Akumulasi hutang
  remainingDebt: number; // Sisa hutang yang belum dibayar
  dueDate?: string; // Tanggal jatuh tempo
  status: 'Belum Lunas' | 'Lunas';
  createdAt: string;
  updatedAt: string;
  history: {
    id: string;
    date: string;
    description: string;
    amount: number;
    transactionType: 'ATK' | 'Service' | 'PPOB' | 'Transfer' | 'Percetakan';
    refNumber: string;
  }[];
  payments: DebtPayment[];
}

export interface PosTransaction {
  id: string;
  invoiceNumber: string;
  type: 'ATK' | 'Service' | 'PPOB' | 'Transfer' | 'Percetakan' | 'Campuran';
  itemsSummary: string;
  itemsList: CartItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  totalCost: number; // modal
  profit: number; // totalAmount - totalCost
  paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'Hutang';
  customerPaid: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  debtId?: string;
  cashierId: string;
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
  createdAt: string;
}

export interface CashFlowMovement {
  id: string;
  type: 'in' | 'out'; // Kas Masuk atau Kas Keluar
  account: 'Kas Fisik Toko' | 'Saldo Rekening Transfer'; // Kas Laci vs Saldo Modal Agen
  category:
    | 'Penjualan ATK'
    | 'Pembayaran Service'
    | 'Keuntungan PPOB'
    | 'Jasa Transfer Konter'
    | 'Penjualan Cetak'
    | 'Pelunasan Piutang'
    | 'Modal Awal Kasir'
    | 'Tarik Modal / Setoran'
    | 'Belanja Stok ATK'
    | 'Operasional Toko'
    | 'Gaji & Uang Makan'
    | 'Listrik & Wifi'
    | 'Lain-lain';
  amount: number;
  description: string;
  referenceNumber?: string;
  date: string;
  cashierName: string;
  shift: 'Shift 1' | 'Shift 2';
}

export interface ReceiptData {
  title: string;
  subtitle: string;
  receiptNumber: string;
  date: string;
  cashierName: string;
  shift: string;
  customerName?: string;
  customerPhone?: string;
  items: {
    name: string;
    qty?: number;
    price: number;
    total: number;
    note?: string;
  }[];
  subtotal: number;
  discount?: number;
  grandTotal: number;
  paymentMethod: string;
  cashPaid?: number;
  change?: number;
  remainingDebt?: number;
  footerNote: string;
  isServiceReceipt?: boolean;
  serviceDetails?: {
    device: string;
    issue: string;
    dp: number;
    remaining: number;
    warranty: string;
  };
}
