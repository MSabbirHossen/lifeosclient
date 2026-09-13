import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import api from '../utils/api';
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
const CURRENCIES = ['SAR', 'BDT', 'USD'];

export const FinanceTracker = ({ selectedDate }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    currency: 'SAR',
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

  // Transaction Form State
  const [formDate, setFormDate] = useState(selectedDate || getFormattedDate());
  const [formType, setFormType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [category, setCategory] = useState('Food & Dining');
  const [subCategory, setSubCategory] = useState('Breakfast');
  const [paymentMethod, setPaymentMethod] = useState('Debit Card');
  const [notes, setNotes] = useState('');
  const [savingTx, setSavingTx] = useState(false);

  // Fund Transfer Form State
  const [transferDate, setTransferDate] = useState(selectedDate || getFormattedDate());
  const [transferTitle, setTransferTitle] = useState('');
  const [fromMethod, setFromMethod] = useState('Bank Transfer');
  const [toMethod, setToMethod] = useState('Cash');
  const [fromCurrency, setFromCurrency] = useState('SAR');
  const [toCurrency, setToCurrency] = useState('SAR');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [savingTransfer, setSavingTransfer] = useState(false);

  const fetchFinanceData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [txRes, summaryRes] = await Promise.all([
        api.get('/finance/transactions'),
        api.get('/finance/summary'),
      ]);
      setTransactions(txRes.data.transactions || txRes.data || []);
      setSummary(
        summaryRes.data || {
          currency: 'SAR',
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
  }, []);

  useEffect(() => {
    fetchFinanceData(true);
  }, [fetchFinanceData, selectedDate]);

  const openTransactionModal = (type = 'expense') => {
    setEditingTransactionId(null);
    setFormType(type);
    setFormDate(selectedDate || getFormattedDate());
    setTitle('');
    setAmount('');
    setCurrency('SAR');
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
    setCurrency(tx.currency || 'SAR');
    setCategory(tx.category || 'Food & Dining');
    setSubCategory(tx.subCategory || '');
    setPaymentMethod(tx.paymentMethod || 'Debit Card');
    setNotes(tx.notes || '');
    setIsTransactionModalOpen(true);
  };

  const openTransferModal = () => {
    setTransferDate(selectedDate || getFormattedDate());
    setTransferTitle('');
    setFromMethod('Bank Transfer');
    setToMethod('Cash');
    setFromCurrency('SAR');
    setToCurrency('SAR');
    setFromAmount('');
    setToAmount('');
    setTransferNotes('');
    setIsTransferModalOpen(true);
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
      const res = await api.post('/finance/transfer', {
        date: transferDate,
        title: transferTitle.trim() || `Transfer: ${fromMethod} → ${toMethod}`,
        fromPaymentMethod: fromMethod,
        toPaymentMethod: toMethod,
        fromCurrency,
        toCurrency,
        fromAmount: Number(fromAmount),
        toAmount: toAmount ? Number(toAmount) : Number(fromAmount),
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

  // Filtered List
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCurrency !== 'all' && tx.currency !== filterCurrency) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <PageHeader
        category="Wealth & Budgeting"
        title="Finance & Fund Transfers"
        description="Monitor income, expenses, multi-currency assets (SAR, BDT, USD), and transfer funds between payment methods."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              icon={ArrowRightLeft}
              onClick={openTransferModal}
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

      {/* Top Summary Stats (in default SAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          title="Net Wealth Balance"
          value={`${(summary.netSavings || 0).toFixed(2)} SAR`}
          subtitle="All accounts combined"
          icon={Wallet}
          color="indigo"
        />
        <StatCard
          title="Total Income"
          value={`${(summary.totalIncome || 0).toFixed(2)} SAR`}
          subtitle="All recorded earnings"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Expenses"
          value={`${(summary.totalExpenses || 0).toFixed(2)} SAR`}
          subtitle="All recorded outflows"
          icon={TrendingDown}
          color="rose"
        />
      </div>

      {/* Payment Method Balance Breakdown */}
      <Card title="Payment Method & Account Balances" subtitle="Live net balance per method in SAR equivalent" icon={Layers}>
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
                  {bal.toFixed(2)} <span className="text-[10px] text-secondary">SAR</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Filter Bar & Transactions List */}
      <Card
        title="Transaction & Transfer Ledger"
        subtitle="Chronological list of all financial entries"
        icon={CreditCard}
        action={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              className="select-base text-xs py-1.5 px-2.5 rounded-lg flex-1 sm:flex-initial"
            >
              <option value="all">All Currencies</option>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-base text-xs py-1.5 px-2.5 rounded-lg flex-1 sm:flex-initial"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
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
            description="Log your first income, expense, or fund transfer to build your financial ledger."
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
                  <th className="pb-3 px-3">Method</th>
                  <th className="pb-3 px-3">Notes</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle font-medium">
                {filteredTransactions.map((tx) => {
                  const isTransfer = tx.type === 'transfer';
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
                            {tx.paymentMethod} → {tx.toPaymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={
                            tx.type === 'income'
                              ? 'success'
                              : tx.type === 'transfer'
                              ? 'purple'
                              : 'neutral'
                          }
                          size="xs"
                          dot
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-secondary whitespace-nowrap">
                        {tx.paymentMethod || 'Debit Card'}
                      </td>
                      <td className="py-3 px-3 text-secondary max-w-xs truncate">
                        {tx.notes || '—'}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'transfer'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄ ' : '-'}
                        {tx.amount.toFixed(2)} {tx.currency || 'SAR'}
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
        subtitle={editingTransactionId ? 'Update financial entry details' : 'Record income or expense transaction'}
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
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="select-base"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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

      {/* Fund Transfer Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Funds"
        subtitle="Move balances between payment methods and currencies"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
              Transfer Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. ATM Cash Withdrawal, Currency Exchange"
              value={transferTitle}
              onChange={(e) => setTransferTitle(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                From Payment Method
              </label>
              <select
                value={fromMethod}
                onChange={(e) => setFromMethod(e.target.value)}
                className="select-base"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                To Payment Method
              </label>
              <select
                value={toMethod}
                onChange={(e) => setToMethod(e.target.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Transfer Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                Currency
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value);
                  setToCurrency(e.target.value);
                }}
                className="select-base"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
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
              placeholder="e.g. Moved savings to checking account"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="input-base"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-subtle">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingTransfer}>
              Execute Transfer
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
            Are you sure you want to delete this financial record? It will be removed from all balances.
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
