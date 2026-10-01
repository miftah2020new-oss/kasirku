import {
  Product,
  Category,
  ServiceRecord,
  PPOBTransaction,
  MoneyTransferRecord,
  PrintOrder,
  DebtRecord,
  PosTransaction,
  CashFlowMovement,
  ShiftSession,
  User,
  UserRole,
  StockOpnameRecord,
} from '../types';

export interface UserAccount extends User {
  password?: string;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'jufat_current_user_clean_v3',
  REGISTERED_USERS: 'jufat_users_clean_v3',
  PRODUCTS: 'jufat_products_clean_v3',
  CATEGORIES: 'jufat_categories_clean_v3',
  SERVICES: 'jufat_services_clean_v3',
  PPOB_TX: 'jufat_ppob_tx_clean_v3',
  TRANSFERS: 'jufat_transfers_clean_v3',
  PRINT_ORDERS: 'jufat_print_orders_clean_v3',
  DEBTS: 'jufat_debts_clean_v3',
  TRANSACTIONS: 'jufat_transactions_clean_v3',
  CASH_FLOW: 'jufat_cash_flow_clean_v3',
  CURRENT_SHIFT: 'jufat_current_shift_clean_v3',
  TRANSFER_CAPITAL_BALANCE: 'jufat_transfer_capital_clean_v3',
  STOCK_OPNAMES: 'jufat_stock_opnames_clean_v3',
  E2EE_ENABLED: 'jufat_e2ee_status',
  TWO_FACTOR_ENABLED: 'jufat_2fa_status',
  CLEAN_INITIALIZED: 'jufat_clean_v3_ready',
};

// Kategori barang standar siap pakai untuk mempermudah saat menambah produk dagangan baru
export const DEFAULT_PRODUCT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'ATK & Alat Tulis' },
  { id: 'cat-2', name: 'Kertas & Pembukuan' },
  { id: 'cat-3', name: 'Kabel & Adaptor Charger' },
  { id: 'cat-4', name: 'Tempered Glass & Proteksi' },
  { id: 'cat-5', name: 'Aksesoris Audio & Gadget' },
  { id: 'cat-6', name: 'Peralatan Percetakan & Tinta' },
  { id: 'cat-7', name: 'Kartu Perdana & Voucher' },
];

// Bersihkan data dummy lama dan siapkan tempat bersih kosong untuk diisi oleh pemilik toko
function setupCleanStore() {
  const isClean = localStorage.getItem(STORAGE_KEYS.CLEAN_INITIALIZED);
  if (!isClean) {
    // Hapus sisa-sisa kunci dummy versi lama
    const oldKeys = [
      'jufat_products_v1',
      'jufat_services_v1',
      'jufat_ppob_tx_v1',
      'jufat_transfers_v1',
      'jufat_print_orders_v1',
      'jufat_debts_v1',
      'jufat_transactions_v1',
      'jufat_cash_flow_v1',
      'jufat_products_v2',
      'jufat_services_v2',
      'jufat_ppob_tx_v2',
      'jufat_transfers_v2',
      'jufat_print_orders_v2',
      'jufat_debts_v2',
      'jufat_transactions_v2',
      'jufat_cash_flow_v2',
      'jufat_current_user_v2',
    ];
    oldKeys.forEach((k) => localStorage.removeItem(k));

    // Siapkan wadah kosong (0 data dagangan, 0 transaksi dummy)
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PPOB_TX, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRINT_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFER_CAPITAL_BALANCE, '0');
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_PRODUCT_CATEGORIES));

    // Siapkan daftar pengguna kosong (tidak ada akun demo; user mendaftar sendiri di halaman depan)
    if (!localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS)) {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify([]));
    }

    localStorage.setItem(STORAGE_KEYS.CLEAN_INITIALIZED, 'true');
  }
}

setupCleanStore();

export const appStorage = {
  // ================= PENGGUNA & REGISTRASI =================
  getRegisteredUsers(): UserAccount[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  registerUser(
    fullName: string,
    emailOrUsername: string,
    password: string,
    role: UserRole
  ): UserAccount {
    const users = this.getRegisteredUsers();
    const cleanId = emailOrUsername.trim().toLowerCase();

    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.username.toLowerCase() === cleanId
    );

    if (existing) {
      throw new Error('Email atau username ini sudah terdaftar! Silakan gunakan ID lain atau masuk.');
    }

    const shiftName = role === 'shift1' ? 'Shift 1' : role === 'shift2' ? 'Shift 2' : 'Semua Shift';

    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      name: fullName.trim(),
      username: cleanId,
      email: cleanId,
      password,
      role,
      shiftName,
      twoFactorEnabled: false,
    };

    const updated = [...users, newUser];
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(updated));
    return newUser;
  },

  authenticateUser(emailOrUsername: string, pass: string): UserAccount | null {
    const users = this.getRegisteredUsers();
    const cleanId = emailOrUsername.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        (u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId) &&
        u.password === pass
    );
    return matched || null;
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  // ================= DATA DAGANGAN (PRODUK ATK & AKSESORIS) =================
  getProducts(): Product[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  // ================= KATEGORI =================
  getCategories(): Category[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      this.saveCategories(DEFAULT_PRODUCT_CATEGORIES);
      return DEFAULT_PRODUCT_CATEGORIES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PRODUCT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // ================= SERVICE HP =================
  getServices(): ServiceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveServices(services: ServiceRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  // ================= PPOB =================
  getPPOBTransactions(): PPOBTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PPOB_TX);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePPOBTransactions(txs: PPOBTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.PPOB_TX, JSON.stringify(txs));
  },

  // ================= TRANSFER UANG & BRILINK =================
  getTransfers(): MoneyTransferRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTransfers(transfers: MoneyTransferRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  },

  // ================= PERCETAKAN =================
  getPrintOrders(): PrintOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PRINT_ORDERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePrintOrders(orders: PrintOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.PRINT_ORDERS, JSON.stringify(orders));
  },

  // ================= PIUTANG / HUTANG =================
  getDebts(): DebtRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveDebts(debts: DebtRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  },

  // ================= TRANSAKSI KASIR =================
  getTransactions(): PosTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTransactions(txs: PosTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  // ================= ARUS KAS =================
  getCashFlow(): CashFlowMovement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CASH_FLOW);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCashFlow(flow: CashFlowMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify(flow));
  },

  // Saldo modal transfer agen
  getTransferCapitalBalance(): number {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFER_CAPITAL_BALANCE);
    if (!raw) return 0;
    return parseFloat(raw) || 0;
  },

  saveTransferCapitalBalance(val: number): void {
    localStorage.setItem(STORAGE_KEYS.TRANSFER_CAPITAL_BALANCE, val.toString());
  },

  getE2EEEnabled(): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.E2EE_ENABLED);
    return raw !== 'false';
  },

  setE2EEEnabled(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.E2EE_ENABLED, String(val));
  },

  get2FAEnabled(): boolean {
    const raw = localStorage.getItem(STORAGE_KEYS.TWO_FACTOR_ENABLED);
    return raw === 'true';
  },

  set2FAEnabled(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.TWO_FACTOR_ENABLED, String(val));
  },

  getCurrentShift(): ShiftSession {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT);
    if (!raw) {
      const defaultShift: ShiftSession = {
        id: 'shift-' + Date.now(),
        shiftName: 'Shift 1',
        cashierId: 'usr-main',
        cashierName: 'Kasir Toko',
        startTime: new Date().toISOString(),
        initialCash: 0,
        expectedCash: 0,
        totalCashSales: 0,
        totalNonCashSales: 0,
        totalServiceRevenue: 0,
        totalPPOBProfit: 0,
        totalTransferProfit: 0,
        totalPrintRevenue: 0,
        status: 'active',
      };
      this.saveCurrentShift(defaultShift);
      return defaultShift;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        id: 'shift-' + Date.now(),
        shiftName: 'Shift 1',
        cashierId: 'usr-main',
        cashierName: 'Kasir Toko',
        startTime: new Date().toISOString(),
        initialCash: 0,
        expectedCash: 0,
        totalCashSales: 0,
        totalNonCashSales: 0,
        totalServiceRevenue: 0,
        totalPPOBProfit: 0,
        totalTransferProfit: 0,
        totalPrintRevenue: 0,
        status: 'active',
      };
    }
  },

  saveCurrentShift(shift: ShiftSession): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(shift));
  },

  // ================= STOK OPNAME =================
  getStockOpnames(): StockOpnameRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STOCK_OPNAMES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveStockOpnames(records: StockOpnameRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAMES, JSON.stringify(records));
  },

  // Reset total data dagangan & transaksi kapanpun pemilik menginginkan
  clearAllStoreData(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PPOB_TX, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRINT_ORDERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CASH_FLOW, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCK_OPNAMES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSFER_CAPITAL_BALANCE, '0');
  },
};
