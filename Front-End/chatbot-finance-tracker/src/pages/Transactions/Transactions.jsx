import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2, X, Check, Loader2, Receipt, Utensils, Car, ShoppingBag, Gamepad2, HeartPulse, GraduationCap, Zap, MoreHorizontal, AlertCircle, Plus, Menu } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import ChatbotWidget from '../../components/ChatbotWidget/ChatbotWidget';
import { useAuth } from '../../context/AuthContext';
import { getTransactions, updateTransaction, deleteTransaction } from '../../services/transactionService';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'An uong', label: 'Ăn uống', icon: Utensils },
  { key: 'Di chuyen', label: 'Di chuyển', icon: Car },
  { key: 'Mua sam', label: 'Mua sắm', icon: ShoppingBag },
  { key: 'Giai tri', label: 'Giải trí', icon: Gamepad2 },
  { key: 'Y te', label: 'Y tế', icon: HeartPulse },
  { key: 'Giao duc', label: 'Giáo dục', icon: GraduationCap },
  { key: 'Tien ich', label: 'Tiện ích', icon: Zap },
  { key: 'Khac', label: 'Khác', icon: MoreHorizontal },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function formatVND(amount) {
  if (amount == null) return '0 ₫';
  return `${Number(amount).toLocaleString('vi-VN')} ₫`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

const RowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="w-32 h-4 bg-surface-container-high rounded" /></td>
    <td className="px-6 py-4"><div className="w-20 h-4 bg-surface-container-high rounded" /></td>
    <td className="px-6 py-4"><div className="w-24 h-6 bg-surface-container-high rounded-full" /></td>
    <td className="px-6 py-4"><div className="w-40 h-4 bg-surface-container-high rounded" /></td>
    <td className="px-6 py-4"><div className="w-16 h-4 bg-surface-container-high rounded" /></td>
    <td className="px-6 py-4"><div className="w-16 h-4 bg-surface-container-high rounded" /></td>
  </tr>
);

// ─── Edit Modal ──────────────────────────────────────────────────────────────

const EditModal = ({ transaction, onClose, onSave, saving }) => {
  const [amount, setAmount] = useState(transaction.amount);
  const [category, setCategory] = useState(transaction.category);
  const [note, setNote] = useState(transaction.note);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ amount: Number(amount), category, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-[#005ab6] to-[#1672df] px-6 py-4 flex items-center justify-between text-white">
          <h3 className="font-bold text-lg">Chỉnh sửa giao dịch</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-1.5">Số tiền (VND)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              required
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/30 text-on-surface font-bold text-lg"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-1.5">Danh mục</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-bold text-on-surface-variant block mb-1.5">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/30 text-on-surface"
              placeholder="Ghi chú giao dịch..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-surface-container-low text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

const DeleteModal = ({ transaction, onClose, onConfirm, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
      <div className="w-14 h-14 bg-error-container rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Trash2 className="w-7 h-7 text-error" />
      </div>
      <h3 className="text-lg font-bold text-on-surface text-center">Xóa giao dịch?</h3>
      <p className="text-sm text-on-surface-variant text-center mt-2">
        Bạn có chắc muốn xóa giao dịch <strong>{formatVND(transaction.amount)}</strong>?
        Hành động này không thể hoàn tác.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-surface-container-low text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-high transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-3 bg-error text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xóa...</> : <><Trash2 className="w-4 h-4" /> Xóa</>}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

const Transactions = () => {
  const { currentUser } = useAuth();

  // Mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const PAGE_SIZE = 10;

  // Modal state
  const [editingTx, setEditingTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch transactions
  const fetchData = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getTransactions({
        userId: currentUser.uid,
        page,
        pageSize: PAGE_SIZE,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      });
      setTransactions(result.transactions);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (err) {
      console.error('[Transactions] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, page, categoryFilter, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Search with debounce on Enter
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  // Category filter change
  const handleCategoryChange = (cat) => {
    setPage(1);
    setCategoryFilter(cat === categoryFilter ? '' : cat);
  };

  // Edit
  const handleEditSave = async ({ amount, category, note }) => {
    if (!editingTx || saving) return;
    setSaving(true);
    try {
      await updateTransaction(editingTx.transaction_id, {
        userId: currentUser.uid,
        amount,
        category,
        note,
      });
      toast.success('Cập nhật giao dịch thành công!');
      setEditingTx(null);
      fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingTx || deleting) return;
    setDeleting(true);
    try {
      await deleteTransaction(deletingTx.transaction_id, currentUser.uid);
      toast.success('Đã xóa giao dịch!');
      setDeletingTx(null);
      // If last item on page, go back
      if (transactions.length === 1 && page > 1) setPage(p => p - 1);
      else fetchData();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-64 min-h-screen pb-20 w-full transition-all duration-300">
        {/* Header */}
        <header className="w-full sticky top-0 z-10 flex items-center justify-between px-4 sm:px-12 py-6 sm:py-8 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-surface-container-low rounded-xl text-on-surface-variant transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-[-0.02em] text-on-surface">Lịch sử giao dịch</h1>
              <p className="hidden sm:block text-on-surface-variant text-sm mt-1">
                Tổng cộng <strong>{total}</strong> giao dịch
              </p>
            </div>
          </div>
        </header>

        <section className="px-4 sm:px-12 space-y-6">
          {/* Search + Category Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-surface-container-lowest rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm flex-1 max-w-md">
              <Search className="w-5 h-5 text-on-surface-variant mr-3 flex-shrink-0" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline p-0 w-full"
                placeholder="Tìm theo ghi chú hoặc danh mục..."
                type="text"
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchInput(''); setSearchQuery(''); setPage(1); }} className="ml-2 text-on-surface-variant hover:text-error">
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isActive = categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low shadow-sm'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-error-container/30 text-on-error-container px-6 py-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <p className="text-sm">{error}</p>
              <button onClick={fetchData} className="ml-auto text-sm font-bold text-primary hover:underline">Thử lại</button>
            </div>
          )}

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] overflow-hidden border border-outline-variant/10">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-outline-variant/20">
              <table className="w-full border-collapse text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ngày</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Số tiền</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Danh mục</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Ghi chú</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Nguồn</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <Receipt className="w-12 h-12 text-outline mx-auto mb-3" />
                        <p className="text-sm font-medium text-on-surface-variant">Chưa có giao dịch nào</p>
                        <p className="text-xs text-outline mt-1">
                          {searchQuery || categoryFilter
                            ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                            : 'Hãy chat với AI để bắt đầu ghi nhận chi tiêu!'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => {
                      const cat = CATEGORY_MAP[tx.category] || CATEGORY_MAP['Khac'];
                      const Icon = cat.icon;
                      return (
                        <tr key={tx.transaction_id} className="group hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-on-surface">{formatDate(tx.created_at)}</p>
                            <p className="text-xs text-on-surface-variant">{formatTime(tx.created_at)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-on-surface">-{formatVND(tx.amount)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-lg text-xs font-bold">
                              <Icon className="w-3.5 h-3.5" />
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-on-surface max-w-xs truncate">{tx.note || '—'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              tx.source === 'chatbot'
                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}>
                              {tx.source === 'chatbot' ? 'Chatbot' : 'Thủ công'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingTx(tx)}
                                className="p-2 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingTx(tx)}
                                className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
                <p className="text-sm text-on-surface-variant">
                  Trang <strong>{page}</strong> / <strong>{totalPages}</strong> • {total} giao dịch
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                          pageNum === page
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      {editingTx && (
        <EditModal
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={handleEditSave}
          saving={saving}
        />
      )}
      {deletingTx && (
        <DeleteModal
          transaction={deletingTx}
          onClose={() => setDeletingTx(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}

      <ChatbotWidget />
    </div>
  );
};

export default Transactions;
