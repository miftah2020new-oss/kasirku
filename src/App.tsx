import React, { useState, useEffect } from 'react';
import {
  User,
  ShiftSession,
  Product,
  Category,
  ServiceRecord,
  PPOBTransaction,
  MoneyTransferRecord,
  PrintOrder,
  DebtRecord,
  DebtPayment,
  PosTransaction,
  CashFlowMovement,
  ReceiptData,
  ServiceStatus,
  StockOpnameRecord,
} from './types';
import { appStorage } from './utils/storage';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, AppNavSection } from './components/Sidebar';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { SecurityModal } from './components/SecurityModal';
import { CloseShiftModal } from './components/CloseShiftModal';
import { ArchitectureModal } from './components/ArchitectureModal';

// Tabs
import { TabDashboard } from './components/tabs/TabDashboard';
import { TabPosAtk } from './components/tabs/TabPosAtk';
import { TabServiceHp } from './components/tabs/TabServiceHp';
import { TabPpob } from './components/tabs/TabPpob';
import { TabPrintServices } from './components/tabs/TabPrintServices';
import { TabMoneyTransfer } from './components/tabs/TabMoneyTransfer';
import { TabDebts } from './components/tabs/TabDebts';
import { TabCashFlow } from './components/tabs/TabCashFlow';
import { TabReports } from './components/tabs/TabReports';
import { TabProductsManage } from './components/tabs/TabProductsManage';
import { TabHistory } from './components/tabs/TabHistory';
import { TabCategories } from './components/tabs/TabCategories';
import { TabReturns } from './components/tabs/TabReturns';
import { TabStockPurchases } from './components/tabs/TabStockPurchases';

// Icons
import {
  Menu,
  Clock,
  ShieldCheck,
  Layers,
  ChevronLeft,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  // Authentication & Session
  const [currentUser, setCurrentUser] = useState<User | null>(() => appStorage.getCurrentUser());
  const [currentShift, setCurrentShift] = useState<ShiftSession>(() => appStorage.getCurrentShift());

  // Master Data
  const [products, setProducts] = useState<Product[]>(() => appStorage.getProducts());
  const [categories, setCategories] = useState<Category[]>(() => appStorage.getCategories());
  const [services, setServices] = useState<ServiceRecord[]>(() => appStorage.getServices());
  const [ppobTxs, setPpobTxs] = useState<PPOBTransaction[]>(() => appStorage.getPPOBTransactions());
  const [transfers, setTransfers] = useState<MoneyTransferRecord[]>(() => appStorage.getTransfers());
  const [printOrders, setPrintOrders] = useState<PrintOrder[]>(() => appStorage.getPrintOrders());
  const [debts, setDebts] = useState<DebtRecord[]>(() => appStorage.getDebts());
  const [transactions, setTransactions] = useState<PosTransaction[]>(() => appStorage.getTransactions());
  const [cashFlows, setCashFlows] = useState<CashFlowMovement[]>(() => appStorage.getCashFlow());
  const [transferCapital, setTransferCapital] = useState<number>(() => appStorage.getTransferCapitalBalance());
  const [stockOpnames, setStockOpnames] = useState<StockOpnameRecord[]>(() => appStorage.getStockOpnames());

  // Security
  const [isE2EEActive, setIsE2EEActive] = useState<boolean>(() => appStorage.getE2EEEnabled());
  const [is2FAActive, setIs2FAActive] = useState<boolean>(() => appStorage.get2FAEnabled());

  // UI state: Default to dashboard or pos_atk
  const [currentSection, setCurrentSection] = useState<AppNavSection>('dashboard');
  const [sectionCategoryFilter, setSectionCategoryFilter] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showArchitectureModal, setShowArchitectureModal] = useState<boolean>(false);

  // Fitur Reset Toko ke Kondisi Bersih Kosong (khusus permintaan user)
  const handleResetStoreData = () => {
    if (
      confirm(
        'PERHATIAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data barang dagangan, transaksi, dan arus kas untuk mengosongkan toko dan menginput barang Anda sendiri?'
      )
    ) {
      appStorage.clearAllStoreData();
      setProducts([]);
      setTransactions([]);
      setServices([]);
      setPpobTxs([]);
      setTransfers([]);
      setPrintOrders([]);
      setDebts([]);
      setCashFlows([]);
      setStockOpnames([]);
      setTransferCapital(0);
      alert('Semua data berhasil dibersihkan! Anda sekarang dapat mulai menginput barang dagangan Anda.');
    }
  };

  // Sync state to LocalStorage
  useEffect(() => {
    appStorage.saveProducts(products);
  }, [products]);

  useEffect(() => {
    appStorage.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    appStorage.saveServices(services);
  }, [services]);

  useEffect(() => {
    appStorage.savePPOBTransactions(ppobTxs);
  }, [ppobTxs]);

  useEffect(() => {
    appStorage.saveTransfers(transfers);
  }, [transfers]);

  useEffect(() => {
    appStorage.savePrintOrders(printOrders);
  }, [printOrders]);

  useEffect(() => {
    appStorage.saveDebts(debts);
  }, [debts]);

  useEffect(() => {
    appStorage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    appStorage.saveCashFlow(cashFlows);
  }, [cashFlows]);

  useEffect(() => {
    appStorage.saveTransferCapitalBalance(transferCapital);
  }, [transferCapital]);

  useEffect(() => {
    appStorage.saveStockOpnames(stockOpnames);
  }, [stockOpnames]);

  useEffect(() => {
    appStorage.setE2EEEnabled(isE2EEActive);
  }, [isE2EEActive]);

  useEffect(() => {
    appStorage.set2FAEnabled(is2FAActive);
  }, [is2FAActive]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    appStorage.setCurrentUser(user);

    if (user.role === 'shift1') {
      const updatedShift: ShiftSession = {
        ...currentShift,
        shiftName: 'Shift 1',
        cashierId: user.id,
        cashierName: user.name,
      };
      setCurrentShift(updatedShift);
      appStorage.saveCurrentShift(updatedShift);
    } else if (user.role === 'shift2') {
      const updatedShift: ShiftSession = {
        ...currentShift,
        shiftName: 'Shift 2',
        cashierId: user.id,
        cashierName: user.name,
      };
      setCurrentShift(updatedShift);
      appStorage.saveCurrentShift(updatedShift);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    appStorage.setCurrentUser(null);
  };

  // 1. POS ATK Checkout Handler
  const handlePosCheckout = (
    tx: PosTransaction,
    receipt: ReceiptData,
    debtData?: { customerName: string; customerPhone: string; customerAddress?: string; dueDate?: string }
  ) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const cartMatch = tx.itemsList.find((it) => it.product.id === prod.id);
        if (cartMatch) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartMatch.quantity),
          };
        }
        return prod;
      })
    );

    setTransactions((prev) => [tx, ...prev]);

    if (tx.paymentMethod === 'Cash') {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Penjualan ATK',
        amount: tx.totalAmount,
        description: `${tx.invoiceNumber} (${tx.itemsSummary})`,
        referenceNumber: tx.invoiceNumber,
        date: new Date().toISOString(),
        cashierName: tx.cashierName,
        shift: tx.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalCashSales: prev.totalCashSales + tx.totalAmount,
        expectedCash: prev.expectedCash + tx.totalAmount,
      }));
    } else if (tx.paymentMethod === 'Hutang' && debtData) {
      const existingDebt = debts.find(
        (d) => d.customerName.toLowerCase() === debtData.customerName.toLowerCase()
      );

      if (existingDebt) {
        setDebts((prev) =>
          prev.map((d) =>
            d.id === existingDebt.id
              ? {
                  ...d,
                  totalDebt: d.totalDebt + tx.totalAmount,
                  remainingDebt: d.remainingDebt + tx.totalAmount,
                  status: 'Belum Lunas',
                  updatedAt: new Date().toISOString(),
                  history: [
                    ...d.history,
                    {
                      id: 'dh-' + Date.now(),
                      date: new Date().toISOString(),
                      description: `Belanja ATK (${tx.itemsSummary})`,
                      amount: tx.totalAmount,
                      transactionType: 'ATK',
                      refNumber: tx.invoiceNumber,
                    },
                  ],
                }
              : d
          )
        );
      } else {
        const newDebtRecord: DebtRecord = {
          id: 'debt-' + Date.now(),
          customerName: debtData.customerName,
          customerPhone: debtData.customerPhone,
          customerAddress: debtData.customerAddress,
          totalDebt: tx.totalAmount,
          remainingDebt: tx.totalAmount,
          dueDate: debtData.dueDate,
          status: 'Belum Lunas',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          history: [
            {
              id: 'dh-' + Date.now(),
              date: new Date().toISOString(),
              description: `Belanja ATK (${tx.itemsSummary})`,
              amount: tx.totalAmount,
              transactionType: 'ATK',
              refNumber: tx.invoiceNumber,
            },
          ],
          payments: [],
        };
        setDebts((prev) => [newDebtRecord, ...prev]);
      }
    }

    setActiveReceipt(receipt);
  };

  // 2. Service HP Handler
  const handleAddNewService = (record: ServiceRecord, receipt: ReceiptData) => {
    setServices((prev) => [record, ...prev]);

    if (record.downPayment > 0) {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Pembayaran Service',
        amount: record.downPayment,
        description: `DP Service HP ${record.serviceNumber} (${record.phoneBrandModel})`,
        referenceNumber: record.serviceNumber,
        date: new Date().toISOString(),
        cashierName: record.cashierName,
        shift: record.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalServiceRevenue: prev.totalServiceRevenue + record.downPayment,
        expectedCash: prev.expectedCash + record.downPayment,
      }));
    }

    setActiveReceipt(receipt);
  };

  const handleUpdateServiceStatus = (
    serviceId: string,
    newStatus: ServiceStatus,
    finalCost?: number,
    additionalCashReceived?: number,
    receipt?: ReceiptData
  ) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          return {
            ...s,
            status: newStatus,
            finalCost: finalCost !== undefined ? finalCost : s.finalCost,
            updatedAt: new Date().toISOString(),
            pickedUpAt: newStatus === 'Diambil' ? new Date().toISOString() : s.pickedUpAt,
            completedAt: newStatus === 'Selesai' ? new Date().toISOString() : s.completedAt,
          };
        }
        return s;
      })
    );

    if (additionalCashReceived && additionalCashReceived > 0) {
      const matched = services.find((s) => s.id === serviceId);
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Pembayaran Service',
        amount: additionalCashReceived,
        description: `Pelunasan Servis ${matched?.serviceNumber} (${matched?.phoneBrandModel})`,
        referenceNumber: matched?.serviceNumber,
        date: new Date().toISOString(),
        cashierName: currentUser?.name || 'Kasir',
        shift: currentShift.shiftName,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalServiceRevenue: prev.totalServiceRevenue + additionalCashReceived,
        expectedCash: prev.expectedCash + additionalCashReceived,
      }));
    }

    if (receipt) {
      setActiveReceipt(receipt);
    }
  };

  // 3. PPOB Handler
  const handlePPOBSubmit = (tx: PPOBTransaction, receipt: ReceiptData) => {
    setPpobTxs((prev) => [tx, ...prev]);

    if (tx.paymentMethod === 'Cash') {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Keuntungan PPOB',
        amount: tx.sellingPrice,
        description: `${tx.txNumber} ${tx.type} (${tx.targetNumber})`,
        referenceNumber: tx.txNumber,
        date: new Date().toISOString(),
        cashierName: tx.cashierName,
        shift: tx.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalPPOBProfit: prev.totalPPOBProfit + tx.profit,
        expectedCash: prev.expectedCash + tx.sellingPrice,
      }));
    }

    setActiveReceipt(receipt);
  };

  // 4. Print Order Handler
  const handlePrintOrderSubmit = (order: PrintOrder, receipt: ReceiptData) => {
    setPrintOrders((prev) => [order, ...prev]);

    if (order.paymentMethod === 'Cash') {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Penjualan Cetak',
        amount: order.totalPrice,
        description: `${order.orderNumber} Cetak a.n ${order.customerName}`,
        referenceNumber: order.orderNumber,
        date: new Date().toISOString(),
        cashierName: order.cashierName,
        shift: order.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalPrintRevenue: prev.totalPrintRevenue + order.totalPrice,
        expectedCash: prev.expectedCash + order.totalPrice,
      }));
    }

    setActiveReceipt(receipt);
  };

  // 5. Money Transfer Handler
  const handleTransferSubmit = (
    transfer: MoneyTransferRecord,
    receipt: ReceiptData,
    newBalance: number
  ) => {
    setTransfers((prev) => [transfer, ...prev]);
    setTransferCapital(newBalance);

    if (transfer.type === 'Tarik Tunai') {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'out',
        account: 'Kas Fisik Toko',
        category: 'Lain-lain',
        amount: transfer.transferAmount,
        description: `Tarik Tunai ${transfer.txNumber} Rek: ${transfer.targetBank}`,
        referenceNumber: transfer.txNumber,
        date: new Date().toISOString(),
        cashierName: transfer.cashierName,
        shift: transfer.shift,
      };
      const feeCashFlow: CashFlowMovement = {
        id: 'cf-' + (Date.now() + 1),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Jasa Transfer Konter',
        amount: transfer.counterFee,
        description: `Jasa Tarik Tunai ${transfer.txNumber}`,
        referenceNumber: transfer.txNumber,
        date: new Date().toISOString(),
        cashierName: transfer.cashierName,
        shift: transfer.shift,
      };
      setCashFlows((prev) => [newCashFlow, feeCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalTransferProfit: prev.totalTransferProfit + transfer.counterFee,
        expectedCash: prev.expectedCash - transfer.transferAmount + transfer.counterFee,
      }));
    } else {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Jasa Transfer Konter',
        amount: transfer.totalCustomerPay,
        description: `${transfer.txNumber} ${transfer.type} ke ${transfer.targetBank}`,
        referenceNumber: transfer.txNumber,
        date: new Date().toISOString(),
        cashierName: transfer.cashierName,
        shift: transfer.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        totalTransferProfit: prev.totalTransferProfit + transfer.counterFee,
        expectedCash: prev.expectedCash + transfer.totalCustomerPay,
      }));
    }

    setActiveReceipt(receipt);
  };

  // 6. Piutang Cicilan Handler
  const handleRecordDebtPayment = (
    debtId: string,
    payment: DebtPayment,
    receipt: ReceiptData,
    newRemaining: number
  ) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          return {
            ...d,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'Lunas' : 'Belum Lunas',
            updatedAt: new Date().toISOString(),
            payments: [...d.payments, payment],
          };
        }
        return d;
      })
    );

    if (payment.paymentMethod === 'Cash') {
      const newCashFlow: CashFlowMovement = {
        id: 'cf-' + Date.now(),
        type: 'in',
        account: 'Kas Fisik Toko',
        category: 'Pelunasan Piutang',
        amount: payment.amountPaid,
        description: `Cicilan Piutang ${payment.receiptNumber} (${receipt.customerName})`,
        referenceNumber: payment.receiptNumber,
        date: new Date().toISOString(),
        cashierName: payment.cashierName,
        shift: payment.shift,
      };
      setCashFlows((prev) => [newCashFlow, ...prev]);

      setCurrentShift((prev) => ({
        ...prev,
        expectedCash: prev.expectedCash + payment.amountPaid,
      }));
    }

    setActiveReceipt(receipt);
  };

  const handleAddNewDebtDirect = (newDebt: DebtRecord) => {
    setDebts((prev) => [newDebt, ...prev]);
  };

  // 7. Manual Cash Flow Movement
  const handleAddManualMovement = (mov: CashFlowMovement) => {
    setCashFlows((prev) => [mov, ...prev]);

    if (mov.account === 'Kas Fisik Toko') {
      setCurrentShift((prev) => ({
        ...prev,
        expectedCash:
          mov.type === 'in'
            ? prev.expectedCash + mov.amount
            : prev.expectedCash - mov.amount,
      }));
    }
  };

  // 8. Product Catalog Admin Handler
  const handleSaveProduct = (prod: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      if (exists) {
        return prev.map((p) => (p.id === prod.id ? prod : p));
      } else {
        return [prod, ...prev];
      }
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // 9. Categories
  const handleSaveCategory = (cat: Category) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      if (exists) {
        return prev.map((c) => (c.id === cat.id ? cat : c));
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // 10. Kulakan / Pembelian Stok
  const handleRecordPurchase = (
    order: any,
    stockUpdates: { productId: string; addedQty: number }[],
    cashMovement?: CashFlowMovement
  ) => {
    // Tambah kuantiti stok
    setProducts((prev) =>
      prev.map((p) => {
        const update = stockUpdates.find((u) => u.productId === p.id);
        if (update) {
          return { ...p, stock: p.stock + update.addedQty };
        }
        return p;
      })
    );

    if (cashMovement) {
      setCashFlows((prev) => [cashMovement, ...prev]);
      setCurrentShift((prev) => ({
        ...prev,
        expectedCash: prev.expectedCash - cashMovement.amount,
      }));
    }
  };

  // 11. Stok Opname & Audit Fisik Handler
  const handleApplyStockOpname = (
    record: StockOpnameRecord,
    stockAdjustments: { productId: string; newStock: number }[]
  ) => {
    // Perbarui stok produk secara massal sesuai hasil fisik nyata
    setProducts((prev) =>
      prev.map((p) => {
        const adj = stockAdjustments.find((a) => a.productId === p.id);
        if (adj) {
          return { ...p, stock: adj.newStock };
        }
        return p;
      })
    );

    // Simpan catatan audit opname
    setStockOpnames((prev) => [record, ...prev]);

    // Jika terjadi kerugian fisik (hilang/rusak), catat ke arus kas keluar kategori penyesuaian stok
    if (record.totalDiscrepancyLoss > 0) {
      const lossCashFlow: CashFlowMovement = {
        id: 'cf-opn-' + Date.now(),
        type: 'out',
        account: 'Kas Fisik Toko',
        category: 'Operasional Toko',
        amount: record.totalDiscrepancyLoss,
        description: `Kerugian Selisih Stok Opname ${record.opnameNumber} (${record.items.filter((i) => i.difference < 0).length} barang hilang/rusak)`,
        referenceNumber: record.opnameNumber,
        date: new Date().toISOString(),
        cashierName: record.auditorName,
        shift: currentShift.shiftName,
      };
      setCashFlows((prev) => [lossCashFlow, ...prev]);
    }
  };

  // 11. Close Shift / Serah Terima Kasir
  const handleConfirmCloseShift = (actualCash: number, notes: string) => {
    const diff = actualCash - currentShift.expectedCash;
    const closedShift: ShiftSession = {
      ...currentShift,
      actualCash,
      difference: diff,
      endTime: new Date().toISOString(),
      status: 'closed',
      notes,
    };
    appStorage.saveCurrentShift(closedShift);

    alert(
      `Shift berhasil ditutup!\nTotal Kas Fisik Aktual: Rp ${actualCash.toLocaleString(
        'id-ID'
      )}\nSelisih: Rp ${diff.toLocaleString('id-ID')}`
    );

    const nextShiftName = currentShift.shiftName === 'Shift 1' ? 'Shift 2' : 'Shift 1';
    const newSession: ShiftSession = {
      id: 'shift-' + Date.now(),
      shiftName: nextShiftName,
      cashierId: currentUser?.id || 'usr-next',
      cashierName: currentUser?.name || 'Kasir',
      startTime: new Date().toISOString(),
      initialCash: actualCash,
      expectedCash: actualCash,
      totalCashSales: 0,
      totalNonCashSales: 0,
      totalServiceRevenue: 0,
      totalPPOBProfit: 0,
      totalTransferProfit: 0,
      totalPrintRevenue: 0,
      status: 'active',
    };
    setCurrentShift(newSession);
    appStorage.saveCurrentShift(newSession);
  };

  // Jika belum login, tampilkan layar login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = currentUser.role === 'admin';
  const serviceBadgeCount = services.filter((s) => s.status === 'Diproses').length;
  const debtBadgeCount = debts.filter((d) => d.status === 'Belum Lunas').length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  // Title formatter for current page
  const getPageTitle = (section: AppNavSection) => {
    switch (section) {
      case 'dashboard':
        return 'Dashboard & Ringkasan POS';
      case 'pos_atk':
        return '< Transaksi Kasir ATK & Aksesoris';
      case 'brilink':
        return '< Transaksi BRILink & Transfer Bank Baru';
      case 'ppob':
        return '< Transaksi Pulsa/PPOB Baru';
      case 'service_hp':
        return '< Penerimaan & Status Service HP';
      case 'percetakan':
        return '< Transaksi Layanan Percetakan Baru';
      case 'piutang':
        return '< Buku Piutang & Cicilan Pelanggan';
      case 'retur':
        return '< Manajemen Retur & Klaim Garansi';
      case 'kas_harian':
        return '< Buku Arus Kas Harian & Mutasi';
      case 'riwayat':
        return '< Riwayat Transaksi Toko';
      case 'produk':
      case 'stok':
        return '< Kelola Produk & Monitoring Stok';
      case 'stok_opname':
        return '< Stok Opname & Audit Fisik Barang';
      case 'kategori':
      case 'jenis_transaksi':
        return '< Pengaturan Kategori Produk & Transaksi';
      case 'pembelian':
        return '< Pembelian & Kulakan Stok Masuk';
      case 'laporan':
        return '< Laporan Keuangan & Laba Rugi';
      default:
        return 'Ju-Fat Cell POS';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      {/* 1. Permanent Dark Navy Sidebar Sesuai Gambar catatkonter (#122238) */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec, catFilter) => {
          setCurrentSection(sec);
          setSectionCategoryFilter(catFilter);
        }}
        currentUser={currentUser}
        currentShift={currentShift}
        onLogout={handleLogout}
        onOpenCloseShift={() => setShowCloseShiftModal(true)}
        onOpenSecurity={() => setShowSecurityModal(true)}
        onOpenArchitecture={() => setShowArchitectureModal(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        serviceBadgeCount={serviceBadgeCount}
        debtBadgeCount={debtBadgeCount}
        lowStockCount={lowStockCount}
      />

      {/* 2. Main Content Viewport Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 h-14 px-4 sm:px-6 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back button or Page title */}
            <div className="flex items-center gap-2 truncate">
              {currentSection !== 'dashboard' && (
                <button
                  onClick={() => setCurrentSection('dashboard')}
                  className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Kembali ke Dashboard"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {getPageTitle(currentSection)}
              </h1>
            </div>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tombol Bersihkan / Reset Data Dagangan (Khusus Admin / Pemilik Toko) */}
            {isAdmin && (
              <button
                onClick={handleResetStoreData}
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="Kosongkan Semua Data Toko untuk Mulai Mengisi Barang Dagangan Sendiri"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset / Bersihkan Data</span>
              </button>
            )}

            {/* Shift Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{currentShift.shiftName}</span>
            </div>

            {/* Security Pill */}
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="Keamanan Enkripsi E2EE & 2FA"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">{isE2EEActive ? 'E2EE Aktif' : 'Security'}</span>
            </button>

            {/* Arsitektur & DB Button */}
            <button
              onClick={() => setShowArchitectureModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              title="Lihat Arsitektur Sistem, Relasi ERD & Skrip DDL DB"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">Arsitektur & DB</span>
            </button>

            {/* Tutup Shift */}
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-2xs cursor-pointer"
              title="Rekap Setoran Kasir"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tutup Shift</span>
            </button>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentSection === 'dashboard' && (
            <TabDashboard
              transactions={transactions}
              services={services}
              ppobTxs={ppobTxs}
              transfers={transfers}
              printOrders={printOrders}
              debts={debts}
              products={products}
              currentUser={currentUser}
              currentShift={currentShift}
              onNavigate={(sec) => setCurrentSection(sec)}
            />
          )}

          {currentSection === 'pos_atk' && (
            <TabPosAtk
              products={products}
              currentUser={currentUser}
              currentShift={currentShift}
              onCheckout={handlePosCheckout}
              onNavigateToProducts={() => setCurrentSection('produk')}
              categoryFilter={sectionCategoryFilter}
            />
          )}

          {currentSection === 'service_hp' && (
            <TabServiceHp
              services={services}
              currentUser={currentUser}
              currentShift={currentShift}
              onAddNewService={handleAddNewService}
              onUpdateServiceStatus={handleUpdateServiceStatus}
              onPrintTicket={(receipt) => setActiveReceipt(receipt)}
              isE2EEActive={isE2EEActive}
            />
          )}

          {currentSection === 'ppob' && (
            <TabPpob
              transactions={ppobTxs}
              currentUser={currentUser}
              currentShift={currentShift}
              onSubmitTransaction={handlePPOBSubmit}
            />
          )}

          {currentSection === 'percetakan' && (
            <TabPrintServices
              orders={printOrders}
              currentUser={currentUser}
              currentShift={currentShift}
              onSubmitOrder={handlePrintOrderSubmit}
            />
          )}

          {currentSection === 'brilink' && (
            <TabMoneyTransfer
              transfers={transfers}
              transferCapitalBalance={transferCapital}
              currentUser={currentUser}
              currentShift={currentShift}
              onSubmitTransfer={handleTransferSubmit}
              isE2EEActive={isE2EEActive}
            />
          )}

          {currentSection === 'piutang' && (
            <TabDebts
              debts={debts}
              currentUser={currentUser}
              currentShift={currentShift}
              onRecordPayment={handleRecordDebtPayment}
              onAddNewDebtDirect={handleAddNewDebtDirect}
            />
          )}

          {currentSection === 'retur' && (
            <TabReturns
              products={products}
              services={services}
              currentUser={currentUser}
              currentShift={currentShift}
              onProcessRefundCash={(flow) => {
                setCashFlows((prev) => [flow, ...prev]);
                setCurrentShift((prev) => ({
                  ...prev,
                  expectedCash: prev.expectedCash - flow.amount,
                }));
              }}
            />
          )}

          {currentSection === 'kas_harian' && (
            <TabCashFlow
              cashFlows={cashFlows}
              currentUser={currentUser}
              currentShift={currentShift}
              onAddManualMovement={handleAddManualMovement}
            />
          )}

          {currentSection === 'riwayat' && (
            <TabHistory
              transactions={transactions}
              currentUser={currentUser}
              onPrintReceipt={(receipt) => setActiveReceipt(receipt)}
            />
          )}

          {(currentSection === 'produk' || currentSection === 'stok' || currentSection === 'stok_opname') && (
            <TabProductsManage
              products={products}
              categories={categories}
              currentUser={currentUser}
              stockOpnames={stockOpnames}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onApplyStockOpname={handleApplyStockOpname}
              initialSubTab={currentSection === 'stok_opname' ? 'opname' : 'catalog'}
            />
          )}

          {(currentSection === 'kategori' || currentSection === 'jenis_transaksi') && (
            <TabCategories
              categories={categories}
              products={products}
              currentUser={currentUser}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {currentSection === 'pembelian' && (
            <TabStockPurchases
              products={products}
              currentUser={currentUser}
              currentShift={currentShift}
              onRecordPurchase={handleRecordPurchase}
            />
          )}

          {currentSection === 'laporan' && (
            <TabReports
              currentUser={currentUser}
              transactions={transactions}
              services={services}
              ppobTxs={ppobTxs}
              transfers={transfers}
              printOrders={printOrders}
              cashFlows={cashFlows}
            />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <ThermalReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        currentShift={currentShift}
        currentUser={currentUser}
        onConfirmCloseShift={handleConfirmCloseShift}
        onTriggerReceipt={(receipt) => setActiveReceipt(receipt)}
      />

      <SecurityModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        isE2EEActive={isE2EEActive}
        onToggleE2EE={setIsE2EEActive}
        is2FAActive={is2FAActive}
        onToggle2FA={setIs2FAActive}
      />

      <ArchitectureModal
        isOpen={showArchitectureModal}
        onClose={() => setShowArchitectureModal(false)}
      />
    </div>
  );
}
