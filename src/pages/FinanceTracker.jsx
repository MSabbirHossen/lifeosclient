import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
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
  const defaultCurrency = (user?.currency || localStorage.getItem('lifeos_currency') || 'USD').toUpperCase();
  const [customCurrencies, setCustomCurrencies] = useState([]);
  const availableCurrencies = Array.from(new Set([defaultCurrency, ...POPULAR_CURRENCIES, ...customCurrencies]));
  const displayCurrency = defaultCurrency || 'USD';

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    currency: defaultCurrency,
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    methodBalances: {},
    currencyTotals: {},
  });
  const [loading, setLoading] = useState(true);

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
    if (showLoading) setLoading(true);
    try {
      const [txRes, summaryRes] = await Promise.all([
        api.get('/finance/transactions'),
        api.get(`/finance/summary?currency=${defaultCurrency}`),
      ]);
      setTransactions(txRes.data.transactions || txRes.data || []);
      setSummary(
        summaryRes.data || {
          currency: defaultCurrency,
          totalIncome: 0,
          totalExpenses: 0,
          netSavings: 0,
          methodBalances: {},
          currencyTotals: {},
        }
      );
    } catch (err) {
      console.error('Failed to fetch finance data', err);
    } finally {
      if (showLoading) setLoading(false);
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
      } else {
        const res = await api.post('/finance/transactions', payload);
        setIsTransactionModalOpen(false);
        if (res.data) setTransactions((prev) => [res.data, ...prev]);
      }
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to log transaction', err);
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
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to transfer funds', err);
    } finally {
      setSavingTransfer(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteId) return;
    const targetId = deleteId;
    setDeleteId(null);
    setTransactions((prev) => prev.filter((tx) => tx._id !== targetId));

    try {
      await api.delete(`/finance/transactions/${targetId}`);
      fetchFinanceData(false);
    } catch (err) {
      console.error('Failed to delete transaction', err);
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
        category="Wealth & Budgeting"
        title="Finance & Fund Transfers"
        description={`Monitor income, expenses, multi-currency assets (${defaultCurrency}), and exchange currencies seamlessly.`}
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
              + Income
            </Button>
            <Button
              variant="gradient"
              size="md"
              icon={Plus}
              onClick={() => openTransactionModal('expense')}
            >
              Log Expense
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

      {/* Multi-Currency Asset Holdings & Vaults */}
      <Card
        title="Multi-Currency Asset Holdings"
        subtitle={`Live balances per currency · Converted total valuations in ${displayCurrency}`}
        icon={Coins}
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowRightLeft}
            onClick={() => openTransferModal()}
          >
            Exchange Currencies ⇄
          </Button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
          {activeCurrencies.map((c) => {
            const holding = summary.currencyTotals?.[c] || { balance: 0, balanceInTarget: 0 };
            const bal = holding.balance || 0;
            const balInTarget = holding.balanceInTarget !== undefined ? holding.balanceInTarget : bal;
            const sym = CURRENCY_SYMBOLS[c] || c;

            return (
              <div
                key={c}
                className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between relative overflow-hidden group hover:border-accent/40 transition-all shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent font-extrabold text-sm flex items-center justify-center">
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
                          Holdings
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

                <div className="mt-3">
                  <div
                    className={`text-base font-extrabold tracking-tight truncate ${
                      bal >= 0 ? 'text-primary' : 'text-[var(--color-danger)]'
                    }`}
                  >
                    {bal >= 0 ? '' : '-'}{sym} {Math.abs(bal).toFixed(2)}{' '}
                    <span className="text-[10px] text-secondary font-medium">{c}</span>
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
      </Card>

      {/* Payment Method Balance Breakdown */}
      <Card title="Payment Method & Account Balances" subtitle={`Live net balance per method in ${displayCurrency} equivalent`} icon={Layers}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-2">
          {PAYMENT_METHODS.map((method) => {
            const bal = summary.methodBalances?.[method] || 0;
            return (
              <div
                key={method}
                className="p-3.5 rounded-2xl bg-subtle border border-theme flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block truncate">
                  {method}
                </span>
                <div
                  className={`mt-1.5 text-base font-extrabold tracking-tight truncate ${
                    bal >= 0 ? 'text-primary' : 'text-[var(--color-danger)]'
                  }`}
                >
                  {bal.toFixed(2)} <span className="text-[10px] text-secondary">{displayCurrency}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
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
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                          tx.type === 'income'
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
                            onClick={() => setDeleteId(tx._id)}
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
        title={editingTransactionId ? 'Edit Transaction' : formType === 'income' ? 'Log Income' : 'Log Expense'}
        subtitle={editingTransactionId ? 'Update financial entry details' : `Record transaction (Default: ${defaultCurrency})`}
      >
        <form onSubmit={handleCreateTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Title / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Salary, Grocery Shopping, Coffee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Amount
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
                label="Currency"
                value={currency}
                onChange={setCurrency}
                availableCurrencies={availableCurrencies}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Category
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
                  Subcategory
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
                Payment Method
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
            label="Transaction Date"
            value={formDate}
            onChange={setFormDate}
            required
          />

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #1024, Split with friends"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTx}>
              {editingTransactionId ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Fund Transfer & Currency Exchange Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={isCrossCurrency ? 'Currency Exchange & Transfer' : 'Transfer Funds'}
        subtitle="Exchange currencies back and forth or move balances between payment methods"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Transfer Title (Optional)
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

          {/* Transfer & Exchange Box */}
          <div className="p-4 rounded-2xl bg-subtle border border-theme space-y-4">
            {/* SOURCE (FROM) SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  From (Send / Outflow)
                </span>
                <span className="text-[11px] text-secondary font-medium">
                  Source Account
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                    From Method
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
                    label="Send Currency"
                    value={fromCurrency}
                    onChange={handleFromCurrencyChange}
                    availableCurrencies={availableCurrencies}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                  Amount to Send ({fromCurrency})
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
                    className="input-base font-extrabold text-base"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary pointer-events-none">
                    {fromCurrency}
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE SWAP BUTTON BAR */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme"></div>
              </div>
              <button
                type="button"
                onClick={handleSwapCurrenciesAndMethods}
                className="relative z-10 px-3.5 py-1.5 rounded-full bg-background border border-theme text-xs font-bold text-accent hover:bg-accent hover:text-white shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer group"
                title="Swap Currencies & Accounts (⇄)"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                <span>Swap Currencies (⇄)</span>
              </button>
            </div>

            {/* DESTINATION (TO) SECTION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  To (Receive / Inflow)
                </span>
                <span className="text-[11px] text-secondary font-medium">
                  Destination Account
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1">
                    To Method
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
                    label="Receive Currency"
                    value={toCurrency}
                    onChange={handleToCurrencyChange}
                    availableCurrencies={availableCurrencies}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">
                    Amount Received ({toCurrency})
                  </label>
                  {isCustomRate && (
                    <button
                      type="button"
                      onClick={resetToMarketRate}
                      className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset to Market Rate
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
                    className="input-base font-extrabold text-base text-emerald-600 dark:text-emerald-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary pointer-events-none">
                    {toCurrency}
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE EXCHANGE RATE & SPREAD PREVIEW */}
            {isCrossCurrency ? (
              <div className="p-3 rounded-xl bg-background/80 border border-theme/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-primary">
                      1 {fromCurrency} ≈ {referenceRate >= 100 ? referenceRate.toFixed(2) : referenceRate.toFixed(4)} {toCurrency}
                    </span>
                    <Badge variant={isCustomRate ? 'purple' : 'primary'} size="xs">
                      {isCustomRate ? 'Custom User Rate' : 'Market Reference'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-secondary">
                    1 {toCurrency} ≈ {inverseReferenceRate >= 100 ? inverseReferenceRate.toFixed(2) : inverseReferenceRate.toFixed(4)} {fromCurrency}
                  </div>
                </div>

                {isCustomRate && fromAmount && toAmount && Number(fromAmount) > 0 && (
                  <div className="text-right text-[11px]">
                    <span className="text-secondary font-medium block">Effective Applied Rate:</span>
                    <span className="font-bold text-accent">
                      1 {fromCurrency} = {effectiveCustomRate.toFixed(4)} {toCurrency}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-background/60 border border-theme/60 text-xs text-secondary flex items-center justify-between">
                <span>Direct Transfer: Moving funds within {fromCurrency}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">1:1 Ratio</span>
              </div>
            )}
          </div>

          <DateInput
            label="Transfer Date"
            value={transferDate}
            onChange={setTransferDate}
            required
          />

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank currency exchange, cash withdrawal, online conversion"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTransfer} icon={ArrowRightLeft}>
              {isCrossCurrency ? 'Execute Currency Exchange' : 'Execute Transfer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Deletion"
        subtitle="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            Are you sure you want to delete this financial record? It will be removed from all balances and multi-currency accounts.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteTransaction}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FinanceTracker;
