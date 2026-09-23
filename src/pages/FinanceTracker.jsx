import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { LoadingScreen } from '../components/LoadingScreen';
import api, { getLocalCache, setLocalCache } from '../utils/api';
import { notifyCreated, notifyUpdated, notifyDeleted, notifyError, showSuccessToast, confirmDelete } from '../utils/alerts';
import { useAuth } from '../context/AuthContext';
import { DateInput } from '../components/DateInput';
import { getFormattedDate, formatDisplayDate } from '../utils/dateHelpers';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowRightLeft,
  CreditCard,
  Layers,
  Coins,
  RefreshCw,
  ArrowLeftRight,
  Banknote,
  Landmark,
  Smartphone,
} from 'lucide-react';

const NESTED_EXPENSE_CATEGORIES = {
  'Food & Dining': ['Breakfast', 'Lunch', 'Dinner', 'Sahri', 'Iftar', 'Groceries', 'Restaurants', 'Coffee & Snacks', 'Delivery'],
  'Religion & Deen': ['Umrah & Hajj', 'Fitra', 'Zakat', 'Sadaqah', 'Islamic Books', 'Donations'],
  'Technology & Cloud': ['Cloud & Hosting', 'AI Tools', 'Software Subscriptions', 'Hardware & Gadgets', 'Domains'],
  'Housing & Rent': ['Rent', 'Maintenance', 'Furniture', 'Home Improvement'],
  'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Mobile Recharge', 'Gas'],
  'Transportation': ['Fuel', 'Public Transit', 'Taxi/Rideshare (Uber)', 'Vehicle Maintenance'],
  'Shopping & Apparel': ['Clothing', 'Electronics', 'Personal Care', 'Accessories'],
  'Health & Fitness': ['Gym & Training', 'Medical', 'Pharmacy', 'Supplements'],
  'Education & Courses': ['Books', 'Courses & Certifications', 'Tuition', 'Software Tools'],
  'Gifts & Family': ['Family Support', 'Gifts', 'Celebrations'],
  'Other Expense': ['Miscellaneous', 'Uncategorized'],
};

const EXPENSE_CATEGORIES = Object.keys(NESTED_EXPENSE_CATEGORIES);
const INCOME_CATEGORIES = ['Salary', 'Freelance & Business', 'Investments', 'Gift & Support', 'Other Income'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Debit Card', 'Credit Card', 'Mobile Wallet (bKash/Nagad)', 'Other'];

const METHOD_ICONS = {
  Cash: Banknote,
  'Bank Transfer': Landmark,
  'Debit Card': CreditCard,
  'Credit Card': CreditCard,
  'Mobile Wallet (bKash/Nagad)': Smartphone,
  Other: Wallet,
};

export const POPULAR_CURRENCIES = [
  'USD',
  'BDT',
  'SAR',
  'EUR',
  'GBP',
  'AED',
  'INR',
  'CAD',
  'AUD',
  'QAR',
  'MYR',
  'TRY',
  'JPY',
  'KWD',
  'OMR',
  'PKR',
];

export const CURRENCY_SYMBOLS = {
  USD: '$',
  BDT: '৳',
  SAR: '﷼',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  QAR: 'ر.ق',
  MYR: 'RM',
  TRY: '₺',
  JPY: '¥',
  KWD: 'د.ك',
  OMR: 'ر.ع',
  PKR: '₨',
};

// Rates relative to 1 USD
export const RATES_TO_USD = {
  USD: 1.0,
  SAR: 3.75,
  BDT: 120.0,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  INR: 83.5,
  CAD: 1.37,
  AUD: 1.52,
  QAR: 3.64,
  MYR: 4.70,
  TRY: 33.0,
  JPY: 155.0,
  KWD: 0.31,
  OMR: 0.38,
  PKR: 278.0,
};

export const getConversionRate = (from, to) => {
  const f = (from || 'USD').toUpperCase();
  const t = (to || 'USD').toUpperCase();
  if (f === t) return 1;
  const fRate = RATES_TO_USD[f];
  const tRate = RATES_TO_USD[t];
  if (fRate && tRate) {
    return tRate / fRate;
  }
  return 1;
};

export const convertAmount = (amt, from, to) => {
  if (!amt || isNaN(Number(amt))) return '';
  const rate = getConversionRate(from, to);
  const result = Number(amt) * rate;
  return result >= 100 ? result.toFixed(2) : result.toFixed(4);
};

// Reusable Currency Selector with custom input capability
const CurrencySelectorInput = ({
  value,
  onChange,
  label,
  availableCurrencies,
  className = '',
  id,
}) => {
  const [customMode, setCustomMode] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const isValueInList = availableCurrencies.includes(value);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setCustomMode(true);
      setCustomVal(value || '');
    } else {
      setCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e) => {
    const u = e.target.value.toUpperCase();
    setCustomVal(u);
    if (u.trim()) {
      onChange(u.trim());
    }
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="block text-xs font-bold text-secondary uppercase tracking-wider">
            {label}
          </label>
          <button
            type="button"
            onClick={() => {
              if (!customMode) {
                setCustomVal(value || '');
                setCustomMode(true);
              } else {
                setCustomMode(false);
              }
            }}
            className="text-[10px] font-bold text-accent hover:underline cursor-pointer transition-colors"
          >
            {customMode ? '← Common Currencies' : '+ Custom Code'}
          </button>
        </div>
      )}

      {customMode ? (
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="text"
            maxLength={6}
            value={customVal}
            onChange={handleCustomChange}
            placeholder="e.g. CAD, SGD"
            className="input-base text-xs font-mono uppercase font-bold"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className="px-2.5 py-2 rounded-xl border border-theme text-secondary hover:text-primary text-xs cursor-pointer hover:bg-subtle transition-colors"
            title="Switch back to currency list"
          >
            ✕
          </button>
        </div>
      ) : (
        <select
          id={id}
          value={isValueInList ? value : '__custom__'}
          onChange={handleSelectChange}
          className="select-base font-semibold"
        >
          {availableCurrencies.map((c) => (
            <option key={c} value={c}>
              {c} {CURRENCY_SYMBOLS[c] ? `(${CURRENCY_SYMBOLS[c]})` : ''}
            </option>
          ))}
          <option value="__custom__">+ Custom ISO Code...</option>
        </select>
      )}
    </div>
  );
};

export const FinanceTracker = ({ selectedDate }) => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const defaultCurrency = (user?.currency || localStorage.getItem('lifeos_currency') || 'USD').toUpperCase();
  const [customCurrencies, setCustomCurrencies] = useState([]);
  const availableCurrencies = Array.from(new Set([defaultCurrency, ...POPULAR_CURRENCIES, ...customCurrencies]));
  const displayCurrency = defaultCurrency || 'USD';

  const [transactions, setTransactions] = useState(() => getLocalCache('/finance/transactions')?.data?.transactions || getLocalCache('/finance/transactions')?.data || []);
  const [summary, setSummary] = useState(() => getLocalCache(`/finance/summary?currency=${defaultCurrency}`)?.data || {
    currency: defaultCurrency,
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    methodBalances: {},
    currencyTotals: {},
  });
  const [loading, setLoading] = useState(() => !getLocalCache('/finance/transactions'));

  // Filters State
  const [filterType, setFilterType] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');

  // Modals State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Transaction Form State (Log Income / Expense)
  const [formDate, setFormDate] = useState(selectedDate || getFormattedDate());
  const [formType, setFormType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState('Food & Dining');
  const [subCategory, setSubCategory] = useState('Breakfast');
  const [paymentMethod, setPaymentMethod] = useState('Debit Card');
  const [notes, setNotes] = useState('');
  const [savingTx, setSavingTx] = useState(false);

  // Fund Transfer & Currency Exchange Form State
  const [transferDate, setTransferDate] = useState(selectedDate || getFormattedDate());
  const [transferTitle, setTransferTitle] = useState('');
  const [fromMethod, setFromMethod] = useState('Bank Transfer');
  const [toMethod, setToMethod] = useState('Cash');
  const [fromCurrency, setFromCurrency] = useState(defaultCurrency);
  const [toCurrency, setToCurrency] = useState(defaultCurrency);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [transferNotes, setTransferNotes] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);

  const fetchFinanceData = useCallback(async (showLoading = true) => {
    const hasCache = getLocalCache('/finance/transactions');
    if (showLoading && !hasCache) setLoading(true);

    try {
      const [txRes, summaryRes] = await Promise.all([
        api.get('/finance/transactions'),
        api.get(`/finance/summary?currency=${defaultCurrency}`),
      ]);
      const txData = txRes.data.transactions || txRes.data || [];
      const sumData = summaryRes.data || {
        currency: defaultCurrency,
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
        methodBalances: {},
        currencyTotals: {},
      };
      setLocalCache('/finance/transactions', txData);
      setLocalCache(`/finance/summary?currency=${defaultCurrency}`, sumData);

      setTransactions(txData);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      setLoading(false);
    }
  }, [defaultCurrency]);

  useEffect(() => {
    fetchFinanceData(true);
  }, [fetchFinanceData, selectedDate]);

  useEffect(() => {
    if (user?.currency) {
      const uCurr = user.currency.toUpperCase();
      setCurrency(uCurr);
      setFromCurrency(uCurr);
      setToCurrency(uCurr);
    }
  }, [user?.currency]);

  // Open Log Income / Log Expense modal with default currency
  const openTransactionModal = (type = 'expense') => {
    setEditingTransactionId(null);
    setFormType(type);
    setFormDate(selectedDate || getFormattedDate());
    setTitle('');
    setAmount('');
    setCurrency(defaultCurrency);
    setCategory(type === 'income' ? 'Salary' : 'Food & Dining');
    setSubCategory('Breakfast');
    setPaymentMethod('Debit Card');
    setNotes('');
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx) => {
    setEditingTransactionId(tx._id);
    setFormType(tx.type || 'expense');
    setFormDate(tx.date || getFormattedDate());
    setTitle(tx.title || '');
    setAmount(tx.amount !== undefined ? tx.amount.toString() : '');
    setCurrency(tx.currency || defaultCurrency);
    setCategory(tx.category || 'Food & Dining');
    setSubCategory(tx.subCategory || '');
    setPaymentMethod(tx.paymentMethod || 'Debit Card');
    setNotes(tx.notes || '');
    setIsTransactionModalOpen(true);
  };

  // Open Transfer / Exchange Modal
  const openTransferModal = (initFromCurr = null, initToCurr = null) => {
    setTransferDate(selectedDate || getFormattedDate());
    setTransferTitle('');
    setFromMethod('Bank Transfer');
    setToMethod('Cash');
    const sourceCurr = initFromCurr || defaultCurrency;
    const destCurr = initToCurr || (initFromCurr && initFromCurr !== defaultCurrency ? defaultCurrency : defaultCurrency);
    setFromCurrency(sourceCurr);
    setToCurrency(destCurr);
    setFromAmount('');
    setToAmount('');
    setIsCustomRate(false);
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  // Handle fromAmount typing & auto-conversion
  const handleFromAmountChange = (val) => {
    setFromAmount(val);
    if (!isCustomRate) {
      if (fromCurrency === toCurrency) {
        setToAmount(val);
      } else if (val && !isNaN(Number(val))) {
        setToAmount(convertAmount(val, fromCurrency, toCurrency));
      } else {
        setToAmount('');
      }
    }
  };

  // Handle toAmount manual override
  const handleToAmountChange = (val) => {
    setToAmount(val);
    if (fromCurrency !== toCurrency) {
      setIsCustomRate(true);
    }
  };

  // Reset to reference rate
  const resetToMarketRate = () => {
    setIsCustomRate(false);
    if (fromAmount && !isNaN(Number(fromAmount))) {
      setToAmount(convertAmount(fromAmount, fromCurrency, toCurrency));
    }
  };

  // Swap currencies & payment methods back and forth
  const handleSwapCurrenciesAndMethods = () => {
    const prevFromCurr = fromCurrency;
    const prevToCurr = toCurrency;
    const prevFromMethod = fromMethod;
    const prevToMethod = toMethod;
    const prevFromAmt = fromAmount;
    const prevToAmt = toAmount;

    setFromCurrency(prevToCurr);
    setToCurrency(prevFromCurr);
    setFromMethod(prevToMethod);
    setToMethod(prevFromMethod);
    setIsCustomRate(false);

    // Swap amounts and re-estimate
    if (prevToAmt && !isNaN(Number(prevToAmt))) {
      setFromAmount(prevToAmt);
      if (prevToCurr === prevFromCurr) {
        setToAmount(prevToAmt);
      } else {
        setToAmount(convertAmount(prevToAmt, prevToCurr, prevFromCurr));
      }
    } else if (prevFromAmt && !isNaN(Number(prevFromAmt))) {
      setFromAmount(prevFromAmt);
      setToAmount(convertAmount(prevFromAmt, prevToCurr, prevFromCurr));
    }
  };

  const handleFromCurrencyChange = (newFrom) => {
    setFromCurrency(newFrom);
    if (!availableCurrencies.includes(newFrom)) {
      setCustomCurrencies((prev) => Array.from(new Set([...prev, newFrom])));
    }
    if (!isCustomRate && fromAmount && !isNaN(Number(fromAmount))) {
      if (newFrom === toCurrency) {
        setToAmount(fromAmount);
      } else {
        setToAmount(convertAmount(fromAmount, newFrom, toCurrency));
      }
    }
  };

  const handleToCurrencyChange = (newTo) => {
    setToCurrency(newTo);
    if (!availableCurrencies.includes(newTo)) {
      setCustomCurrencies((prev) => Array.from(new Set([...prev, newTo])));
    }
    if (!isCustomRate && fromAmount && !isNaN(Number(fromAmount))) {
      if (fromCurrency === newTo) {
        setToAmount(fromAmount);
      } else {
        setToAmount(convertAmount(fromAmount, fromCurrency, newTo));
      }
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setSavingTx(true);
    try {
      const payload = {
        date: formDate,
        type: formType,
        title: title.trim() || (subCategory ? `${category} (${subCategory})` : category),
        amount: Number(amount),
        currency,
        category,
        subCategory: subCategory || undefined,
        paymentMethod,
        notes: notes.trim(),
      };

      if (editingTransactionId) {
        const res = await api.put(`/finance/transactions/${editingTransactionId}`, payload);
        setIsTransactionModalOpen(false);
        if (res.data) {
          setTransactions((prev) =>
            prev.map((t) => (t._id === editingTransactionId ? res.data : t))
          );
        }
        notifyUpdated('Transaction');
      } else {
        const res = await api.post('/finance/transactions', payload);
        setIsTransactionModalOpen(false);
        if (res.data) setTransactions((prev) => [res.data, ...prev]);
        notifyCreated('Transaction');
      }
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to log transaction', err);
      notifyError(err, 'Failed to save transaction');
    } finally {
      setSavingTx(false);
    }
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!fromAmount || isNaN(Number(fromAmount))) return;

    setSavingTransfer(true);
    try {
      const numFromAmount = Number(fromAmount);
      const numToAmount = toAmount && !isNaN(Number(toAmount))
        ? Number(toAmount)
        : numFromAmount;

      const isCrossCurrency = fromCurrency !== toCurrency;
      const autoTitle = isCrossCurrency
        ? `Exchange: ${numFromAmount} ${fromCurrency} → ${numToAmount} ${toCurrency}`
        : `Transfer: ${fromMethod} → ${toMethod}`;

      const res = await api.post('/finance/transfer', {
        date: transferDate,
        title: transferTitle.trim() || autoTitle,
        fromPaymentMethod: fromMethod,
        toPaymentMethod: toMethod,
        fromCurrency,
        toCurrency,
        fromAmount: numFromAmount,
        toAmount: numToAmount,
        notes: transferNotes.trim(),
      });

      setIsTransferModalOpen(false);
      if (res.data) setTransactions((prev) => [res.data, ...prev]);
      showSuccessToast('Funds transferred successfully!', 'Transfer Complete');
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to transfer funds', err);
      notifyError(err, 'Failed to transfer funds');
    } finally {
      setSavingTransfer(false);
    }
  };

  const handleDeleteTransaction = async (txId) => {
    const targetId = txId || deleteId;
    if (!targetId) return;

    const isConfirmed = await confirmDelete('Transaction');
    if (!isConfirmed) return;

    setDeleteId(null);
    setTransactions((prev) => prev.filter((tx) => tx._id !== targetId));

    try {
      await api.delete(`/finance/transactions/${targetId}`);
      notifyDeleted('Transaction');
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to delete transaction', err);
      notifyError(err, 'Failed to delete transaction');
      fetchFinanceData(false);
    }
  };

  // Filtered Ledger List
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCurrency !== 'all') {
      const matchFrom = tx.currency === filterCurrency;
      const matchTo = tx.toCurrency === filterCurrency;
      if (!matchFrom && !matchTo) return false;
    }
    return true;
  });

  // Calculate rate references for transfer modal
  const referenceRate = getConversionRate(fromCurrency, toCurrency);
  const inverseReferenceRate = getConversionRate(toCurrency, fromCurrency);
  const effectiveCustomRate =
    fromAmount && toAmount && Number(fromAmount) > 0
      ? Number(toAmount) / Number(fromAmount)
      : referenceRate;
  const isCrossCurrency = fromCurrency !== toCurrency;

  // Active Multi-Currency Holdings
  const activeCurrencies = Object.keys(summary.currencyTotals || {}).filter(
    (c) => summary.currencyTotals[c]?.balance !== 0 || c === defaultCurrency
  );
  if (!activeCurrencies.includes(defaultCurrency)) {
    activeCurrencies.unshift(defaultCurrency);
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category={t('nav.finance', 'Wealth & Budgeting')}
        title={t('finance.title', 'Personal Finance & Wealth')}
        description={`${t('finance.subtitle', 'Track income streams, categorize daily expenses, and analyze cash flow.')} (${defaultCurrency})`}
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={ArrowRightLeft}
              onClick={() => openTransferModal()}
            >
              Transfer Funds
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={ArrowUpRight}
              onClick={() => openTransactionModal('income')}
            >
              + {t('finance.income', 'Income')}
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => openTransactionModal('expense')}
            >
              {t('finance.addTransaction', 'Log Expense')}
            </Button>
          </div>
        }
      />

      {/* Top Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Net Wealth Balance"
          value={`${(summary.netSavings || 0).toFixed(2)} ${displayCurrency}`}
          subtitle="All currency vaults combined"
          icon={Wallet}
          color="indigo"
        />
        <StatCard
          title="Total Income"
          value={`${(summary.totalIncome || 0).toFixed(2)} ${displayCurrency}`}
          subtitle="All recorded earnings"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Expenses"
          value={`${(summary.totalExpenses || 0).toFixed(2)} ${displayCurrency}`}
          subtitle="All recorded outflows"
          icon={TrendingDown}
          color="rose"
        />
      </div>

      {/* 2-Column Side-by-Side: Multi-Currency Holdings & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 items-stretch">
        {/* Left Col: Multi-Currency Asset Holdings & Vaults */}
        <div className="flex flex-col">
          <Card
            hover
            className="h-full flex flex-col justify-between"
            title="Multi-Currency Asset Holdings"
            subtitle={`Live balances per currency · Valuations in ${displayCurrency}`}
            icon={Coins}
            action={
              <Button
                variant="secondary"
                size="xs"
                icon={ArrowRightLeft}
                onClick={() => openTransferModal()}
              >
                Exchange ⇄
              </Button>
            }
          >
            <div className="flex flex-col justify-between h-full space-y-3 mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeCurrencies.map((c) => {
                  const holding = summary.currencyTotals?.[c] || { balance: 0, balanceInTarget: 0 };
                  const bal = holding.balance || 0;
                  const balInTarget = holding.balanceInTarget !== undefined ? holding.balanceInTarget : bal;
                  const sym = CURRENCY_SYMBOLS[c] || c;

                  return (
                    <div
                      key={c}
                      className="p-3 rounded-2xl bg-subtle/80 border border-theme flex flex-col justify-between relative overflow-hidden group hover:border-accent/40 hover:bg-surface transition-all shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-accent/10 text-accent font-extrabold text-xs flex items-center justify-center">
                            {sym}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-primary block leading-tight">
                              {c}
                            </span>
                            {c === defaultCurrency ? (
                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">
                                Default
                              </span>
                            ) : (
                              <span className="text-[9px] text-secondary font-medium block">
                                Vault
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => openTransferModal(c)}
                          className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 opacity-80 hover:opacity-100 cursor-pointer"
                          title={`Exchange ${c} to another currency`}
                        >
                          Swap ⇄
                        </button>
                      </div>

                      <div className="mt-2.5">
                        <div
                          className={`text-base font-extrabold tracking-tight truncate ${
                            bal >= 0 ? 'text-primary' : 'text-[var(--color-danger)]'
                          }`}
                        >
                          {bal >= 0 ? '' : '-'}{sym} {Math.abs(bal).toFixed(2)}{' '}
                          <span className="text-[10px] text-secondary font-semibold">{c}</span>
                        </div>
                        {c !== displayCurrency && (
                          <div className="text-[11px] text-secondary mt-0.5 font-medium">
                            ≈ {(balInTarget || 0).toFixed(2)} {displayCurrency}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Valuation Pill */}
              <div className="p-2.5 rounded-xl bg-accent/5 border border-accent/15 text-[11px] text-secondary flex items-center justify-between">
                <span className="font-medium">Total Multi-Currency Valuation:</span>
                <span className="font-extrabold text-primary">
                  {(summary.netSavings || 0).toFixed(2)} {displayCurrency}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Payment Method & Account Balances */}
        <div className="flex flex-col">
          <Card
            hover
            className="h-full flex flex-col justify-between"
            title="Payment Methods & Accounts"
            subtitle={`Live net balance in ${displayCurrency} equivalent`}
            icon={Layers}
          >
            <div className="flex flex-col justify-between h-full space-y-3 mt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PAYMENT_METHODS.map((method) => {
                  const bal = summary.methodBalances?.[method] || 0;
                  const IconComp = METHOD_ICONS[method] || Wallet;
                  const displayName = method.replace(' (bKash/Nagad)', '');

                  return (
                    <div
                      key={method}
                      className="p-3 rounded-2xl bg-subtle/80 border border-theme flex flex-col justify-between group hover:border-theme-strong hover:bg-surface transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-5 h-5 rounded-lg bg-surface border border-theme flex items-center justify-center text-secondary group-hover:text-primary transition-colors shrink-0">
                          <IconComp className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider truncate block">
                          {displayName}
                        </span>
                      </div>
                      <div
                        className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${
                          bal >= 0 ? 'text-primary' : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {bal.toFixed(2)} <span className="text-[10px] text-secondary font-medium">{displayCurrency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status summary */}
              <div className="p-2.5 rounded-xl bg-subtle border border-theme text-[11px] text-secondary flex items-center justify-between">
                <span className="font-medium">Active Channels:</span>
                <span className="font-bold text-secondary">
                  {PAYMENT_METHODS.length} Recorded Accounts
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filter Bar & Transactions List */}
      <Card
        title="Transaction & Transfer Ledger"
        subtitle="Chronological list of all financial entries and currency exchanges"
        icon={CreditCard}
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="select-base text-xs py-1.5 px-2.5 rounded-lg flex-1 sm:flex-initial font-medium"
            >
              <option value="all">All Currencies</option>
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c} {CURRENCY_SYMBOLS[c] ? `(${CURRENCY_SYMBOLS[c]})` : ''}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-base text-xs py-1.5 px-2.5 rounded-lg flex-1 sm:flex-initial font-medium"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer & Exchange</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <LoadingScreen fullScreen={false} message="Loading financial records..." size="md" />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No transactions found"
            description="Log your first income, expense, or currency transfer to build your financial ledger."
            actionText="Log Transaction"
            onAction={() => openTransactionModal('expense')}
          />
        ) : (
          <div className="touch-scroll-x overflow-x-auto mt-3 -mx-2 sm:mx-0 px-2 sm:px-0">
            <table className="w-full min-w-[660px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-theme text-secondary font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Title / Details</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Method / Route</th>
                  <th className="pb-3 px-3">Notes</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle font-medium">
                {filteredTransactions.map((tx) => {
                  const isTransfer = tx.type === 'transfer';
                  const isExchange = isTransfer && tx.toCurrency && tx.currency !== tx.toCurrency;

                  return (
                    <tr key={tx._id} className="hover:bg-subtle/50 transition-colors">
                      <td className="py-3 px-3 text-primary font-bold whitespace-nowrap">
                        {formatDisplayDate(tx.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-primary block">
                          {tx.title || tx.category}
                        </span>
                        {isTransfer && tx.toPaymentMethod && (
                          <span className="text-[11px] text-secondary">
                            {tx.paymentMethod} ({tx.currency}) → {tx.toPaymentMethod} ({tx.toCurrency || tx.currency})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            tx.type === 'income'
                              ? 'success'
                              : isExchange
                                ? 'cyan'
                                : isTransfer
                                  ? 'purple'
                                  : 'neutral'
                          }
                          size="xs"
                          dot
                        >
                          {isExchange ? 'Exchange' : tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-secondary whitespace-nowrap font-medium">
                        {isTransfer && tx.toPaymentMethod ? (
                          <span>{tx.paymentMethod} ➔ {tx.toPaymentMethod}</span>
                        ) : (
                          tx.paymentMethod || 'Debit Card'
                        )}
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-xs truncate">
                        {tx.notes || '—'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--color-danger)]'
                          }`}
                      >
                        {tx.type === 'income' && `+${tx.amount.toFixed(2)} ${tx.currency || displayCurrency}`}
                        {tx.type === 'expense' && `-${tx.amount.toFixed(2)} ${tx.currency || displayCurrency}`}
                        {isTransfer && (
                          isExchange ? (
                            <div className="flex flex-col items-end leading-tight">
                              <span>{tx.amount.toFixed(2)} {tx.currency}</span>
                              <span className="text-[11px] text-accent font-semibold">
                                ➔ {(tx.toAmount !== undefined ? tx.toAmount : tx.amount).toFixed(2)} {tx.toCurrency}
                              </span>
                            </div>
                          ) : (
                            <span>⇄ {tx.amount.toFixed(2)} {tx.currency || displayCurrency}</span>
                          )
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEditTransaction(tx)}
                            className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx._id)}
                            className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Income / Expense Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title={editingTransactionId ? t('finance.editTransaction') : formType === 'income' ? t('finance.logIncome') : t('finance.logExpense')}
        subtitle={editingTransactionId ? t('finance.editTxSubtitle') : `${t('finance.recordTxSubtitle')} (${t('finance.currency')}: ${defaultCurrency})`}
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('finance.titleDescription')}
            </label>
            <input
              type="text"
              required
              placeholder={t('finance.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('finance.amount')}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-base font-bold"
              />
            </div>

            <div>
              <CurrencySelectorInput
                id="tx-currency"
                label={t('finance.currency')}
                value={currency}
                onChange={setCurrency}
                availableCurrencies={availableCurrencies}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('common.category')}
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const subList = NESTED_EXPENSE_CATEGORIES[e.target.value];
                  if (subList && subList.length > 0) setSubCategory(subList[0]);
                  else setSubCategory('');
                }}
                className="select-base"
              >
                {(formType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {formType === 'expense' && NESTED_EXPENSE_CATEGORIES[category] && (
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  {t('finance.subcategory')}
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="select-base"
                >
                  {NESTED_EXPENSE_CATEGORIES[category].map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('finance.paymentMethod')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select-base"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DateInput
            label={t('finance.txDate')}
            value={formDate}
            onChange={setFormDate}
            required
          />

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              {t('common.notes')} ({t('common.optional')})
            </label>
            <input
              type="text"
              placeholder={t('finance.txNotesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTransactionModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" loading={savingTx}>
              {editingTransactionId ? t('finance.updateTransaction') : t('finance.saveTransaction')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fund Transfer & Currency Exchange Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={isCrossCurrency ? t('finance.currencyExchangeAndTransfer') : t('finance.transferFunds')}
        subtitle={t('finance.transferSubtitle')}
        maxWidth="max-w-6xl"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-3.5">
          {/* Top Row: Title (2 cols) & Date (1 col) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('finance.transferTitle')}
              </label>
              <input
                type="text"
                placeholder={
                  isCrossCurrency
                    ? `e.g. Currency Exchange: ${fromCurrency} → ${toCurrency}`
                    : `e.g. Moved funds from ${fromMethod} to ${toMethod}`
                }
                value={transferTitle}
                onChange={(e) => setTransferTitle(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <DateInput
                label={t('finance.transferDate')}
                value={transferDate}
                onChange={setTransferDate}
                required
              />
            </div>
          </div>

          {/* Main Horizontal Transfer Deck */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-subtle border border-theme space-y-3">
            {/* 2-Column Side-by-Side Cards with Central Swap Action */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-center">
              {/* SOURCE (FROM) CARD */}
              <div className="p-3.5 rounded-xl bg-surface border border-theme space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-subtle">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    {t('finance.fromSend')}
                  </span>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-500/20">
                    {t('finance.sourceAccount')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('finance.fromMethod')}
                    </label>
                    <select
                      value={fromMethod}
                      onChange={(e) => setFromMethod(e.target.value)}
                      className="select-base text-xs"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <CurrencySelectorInput
                      id="transfer-from-currency"
                      label={t('finance.sendCurrency')}
                      value={fromCurrency}
                      onChange={handleFromCurrencyChange}
                      availableCurrencies={availableCurrencies}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                    {t('finance.amountToSend')} ({fromCurrency})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      className="input-base font-extrabold text-base pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-secondary pointer-events-none">
                      {fromCurrency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Swap Button (Vertical on LG, Horizontal on Mobile) */}
              <div className="flex items-center justify-center py-1 lg:py-0">
                <button
                  type="button"
                  onClick={handleSwapCurrenciesAndMethods}
                  className="p-2.5 lg:p-3 rounded-2xl bg-surface border border-theme text-accent hover:bg-accent hover:text-white shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer group active:scale-95"
                  title={t('finance.swapCurrencies')}
                  aria-label={t('finance.swapCurrencies')}
                >
                  <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="lg:hidden text-xs font-bold">{t('finance.swapCurrencies')}</span>
                </button>
              </div>

              {/* DESTINATION (TO) CARD */}
              <div className="p-3.5 rounded-xl bg-surface border border-theme space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-1 border-b border-subtle">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {t('finance.toReceive')}
                  </span>
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {t('finance.destAccount')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                      {t('finance.toMethod')}
                    </label>
                    <select
                      value={toMethod}
                      onChange={(e) => setToMethod(e.target.value)}
                      className="select-base text-xs"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <CurrencySelectorInput
                      id="transfer-to-currency"
                      label={t('finance.receiveCurrency')}
                      value={toCurrency}
                      onChange={handleToCurrencyChange}
                      availableCurrencies={availableCurrencies}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                      {t('finance.amountReceived')} ({toCurrency})
                    </label>
                    {isCustomRate && (
                      <button
                        type="button"
                        onClick={resetToMarketRate}
                        className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t('finance.resetMarketRate')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      className="input-base font-extrabold text-base text-emerald-600 dark:text-emerald-400 pr-12"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-secondary pointer-events-none">
                      {toCurrency}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE EXCHANGE RATE & SPREAD PREVIEW */}
            {isCrossCurrency ? (
              <div className="p-2.5 sm:p-3 rounded-xl bg-surface border border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-primary">
                      1 {fromCurrency} ≈ {referenceRate >= 100 ? referenceRate.toFixed(2) : referenceRate.toFixed(4)} {toCurrency}
                    </span>
                    <Badge variant={isCustomRate ? 'purple' : 'primary'} size="xs">
                      {isCustomRate ? t('finance.customUserRate') : t('finance.marketReference')}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-secondary">
                    1 {toCurrency} ≈ {inverseReferenceRate >= 100 ? inverseReferenceRate.toFixed(2) : inverseReferenceRate.toFixed(4)} {fromCurrency}
                  </div>
                </div>

                {isCustomRate && fromAmount && toAmount && Number(fromAmount) > 0 && (
                  <div className="text-right text-[11px]">
                    <span className="text-secondary font-medium block">{t('finance.effectiveAppliedRate')}:</span>
                    <span className="font-bold text-accent">
                      1 {fromCurrency} = {effectiveCustomRate.toFixed(4)} {toCurrency}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-surface border border-theme text-xs text-secondary flex items-center justify-between shadow-xs">
                <span className="font-medium">{t('finance.directTransferDesc')} {fromCurrency}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/20">
                  {t('finance.oneToOneRatio', '1:1 Ratio')}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Row: Notes & Action Buttons in a single balanced row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
            <div className="sm:col-span-7">
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                {t('common.notes')} ({t('common.optional')})
              </label>
              <input
                type="text"
                placeholder={t('finance.transferNotesPlaceholder')}
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="input-base text-xs"
              />
            </div>

            <div className="sm:col-span-5 flex items-center justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" loading={savingTransfer} icon={ArrowRightLeft}>
                {isCrossCurrency ? t('finance.executeExchange') : t('finance.executeTransfer')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={t('common.confirmDeleteTitle')}
        subtitle={t('common.confirmDeleteDesc')}
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            {t('finance.deleteTxDesc')}
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteTransaction}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceTracker;
