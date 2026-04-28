import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Wallet, Receipt, CreditCard, Banknote, Calendar, TrendingUp, TrendingDown, ShoppingBag, Utensils, Zap, Dumbbell, Car, GraduationCap, HeartPulse, Gamepad2, MoreHorizontal, RefreshCw, AlertCircle, Target, Settings, X, Check, Loader2 } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import ChatbotWidget from '../../components/ChatbotWidget/ChatbotWidget';
import AreaChart from '../../components/Charts/AreaChart';
import CategoryPieChart from '../../components/Charts/PieChart';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getBudgetStatus, setBudget } from '../../services/budgetService';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map period filter key → API period value */
const PERIOD_MAP = {
  today: 'today',
  week: 'week',
  month: 'month',
};

/** Map category key → icon component */
const CATEGORY_ICONS = {
  'An uong': Utensils,
  'Di chuyen': Car,
  'Mua sam': ShoppingBag,
  'Giai tri': Gamepad2,
  'Y te': HeartPulse,
  'Giao duc': GraduationCap,
  'Tien ich': Zap,
  'Khac': MoreHorizontal,
};

/** Map category key → Vietnamese display label */
const CATEGORY_LABELS = {
  'An uong': 'Ăn uống',
  'Di chuyen': 'Di chuyển',
  'Mua sam': 'Mua sắm',
  'Giai tri': 'Giải trí',
  'Y te': 'Y tế',
  'Giao duc': 'Giáo dục',
  'Tien ich': 'Tiện ích',
  'Khac': 'Khác',
};

/** Format a number as VND string. VD: 1500000 → "1,500,000 ₫" */
function formatVND(amount) {
  if (amount == null) return '0 ₫';
  return `${Number(amount).toLocaleString('vi-VN')} ₫`;
}

/** Relative time from ISO string. VD: "2h trước", "Hôm qua" */
function relativeTime(isoString) {
  if (!isoString) return '';
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHr < 24) return `${diffHr}h trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

const StatCardSkeleton = () => (
  <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 bg-surface-container-high rounded-xl" />
      <div className="w-24 h-5 bg-surface-container-high rounded-md" />
    </div>
    <div className="w-28 h-4 bg-surface-container-high rounded mb-2" />
    <div className="w-36 h-7 bg-surface-container-high rounded" />
  </div>
);

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-surface-container-high" />
      <div>
        <div className="w-24 h-4 bg-surface-container-high rounded mb-2" />
        <div className="w-32 h-3 bg-surface-container-high rounded" />
      </div>
    </div>
    <div className="w-20 h-4 bg-surface-container-high rounded" />
  </div>
);

// ─── Dashboard Component ──────────────────────────────────────────────────────

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState('month');
  const { data, loading, error, refetch } = useAnalytics(currentUser?.uid, period);

  // Budget state
  const [budget, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [thresholdInput, setThresholdInput] = useState(80);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);

  // Fetch budget status
  const fetchBudget = useCallback(async () => {
    if (!currentUser?.uid) return;
    setBudgetLoading(true);
    try {
      const result = await getBudgetStatus(currentUser.uid);
      setBudgetData(result);
    } catch (err) {
      console.error('[Dashboard] Budget fetch error:', err);
    } finally {
      setBudgetLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  // Save budget
  const handleSaveBudget = async () => {
    if (savingBudget) return;
    const amount = Number(budgetInput);
    if (!amount || amount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setSavingBudget(true);
    try {
      await setBudget({
        userId: currentUser.uid,
        monthlyBudget: amount,
        alertEnabled,
        alertThreshold: thresholdInput,
      });
      toast.success('Đã cập nhật ngân sách!');
      setShowBudgetModal(false);
      fetchBudget();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSavingBudget(false);
    }
  };

  // Open modal with current values
  const openBudgetModal = () => {
    setBudgetInput(budget?.monthly_budget || '');
    setThresholdInput(budget?.alert_threshold || 80);
    setAlertEnabled(budget?.alert_enabled !== false);
    setShowBudgetModal(true);
  };

  const periodLabels = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'week', label: 'Tuần' },
    { key: 'month', label: 'Tháng' },
  ];

  // Get the 5 most recent transactions
  const recentTransactions = data?.transactions?.slice(0, 5) || [];

  // Trend info
  const trendDirection = data?.trend?.direction;
  const trendPercent = data?.trend?.change_percentage;

  return (
    <div className="bg-background text-on-surface antialiased flex min-h-screen">
      <Sidebar />

      {/* Main Content Canvas */}
      <main className="flex-1 ml-64 min-h-screen pb-20">
        {/* TopAppBar */}
        <header className="w-full sticky top-0 z-10 flex items-center justify-between px-12 py-8 bg-background/80 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-on-surface">Tổng quan tài chính</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Chào mừng trở lại, {currentUser?.displayName || 'bạn'}.
              {data && data.transaction_count > 0
                ? ' Hãy xem tình hình chi tiêu của bạn.'
                : ' Bắt đầu ghi nhận chi tiêu qua chatbot nhé!'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refetch}
              className="hover:bg-surface-container-low rounded-full p-2 text-on-surface-variant transition-colors border border-transparent hover:border-outline-variant/20"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <section className="px-12 space-y-8">
          {/* Budget Progress Bar */}
          {!budgetLoading && budget && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  <div>
                    <h4 className="text-base font-bold text-on-surface">Ngân sách tháng</h4>
                    {budget.has_budget ? (
                      <p className="text-xs text-on-surface-variant">
                        {formatVND(budget.current_spending)} / {formatVND(budget.monthly_budget)}
                        {budget.is_over_budget && <span className="text-error font-bold ml-2">⚠️ Vượt ngân sách!</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-on-surface-variant">Chưa đặt ngân sách</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={openBudgetModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {budget.has_budget ? 'Chỉnh sửa' : 'Đặt ngân sách'}
                </button>
              </div>

              {budget.has_budget && (
                <>
                  <div className="relative w-full h-4 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        budget.is_over_budget
                          ? 'bg-gradient-to-r from-error/80 to-error'
                          : budget.percentage >= budget.alert_threshold
                            ? 'bg-gradient-to-r from-tertiary/80 to-tertiary'
                            : 'bg-gradient-to-r from-primary/80 to-primary'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-sm font-black ${
                      budget.is_over_budget ? 'text-error' : budget.percentage >= budget.alert_threshold ? 'text-tertiary' : 'text-primary'
                    }`}>
                      {budget.actual_percentage}%
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      Còn lại: <strong className="text-on-surface">{formatVND(budget.remaining)}</strong>
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex justify-end">
            <div className="inline-flex bg-surface-container-low p-1 rounded-xl">
              {periodLabels.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${period === key
                      ? 'font-bold bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-3 bg-error-container/30 text-on-error-container px-6 py-4 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <div>
                <p className="text-sm font-bold">Không thể tải dữ liệu</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
              <button onClick={refetch} className="ml-auto text-sm font-bold text-primary hover:underline">
                Thử lại
              </button>
            </div>
          )}

          {/* Bento Grid: Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                {/* Tổng chi tiêu */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <Banknote className="w-10 h-10 text-primary p-2 bg-primary-fixed rounded-xl" />
                    {trendPercent != null && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${trendDirection === 'down'
                          ? 'text-secondary bg-secondary-fixed'
                          : 'text-tertiary bg-tertiary-fixed'
                        }`}>
                        {trendDirection === 'down' ? '↓' : '↑'}{Math.abs(trendPercent)}%
                      </span>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium">Tổng chi tiêu</p>
                  <h3 className="text-2xl font-black mt-1 text-on-surface">{formatVND(data?.total_spending)}</h3>
                </div>

                {/* Số giao dịch */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <Receipt className="w-10 h-10 text-secondary p-2 bg-secondary-fixed rounded-xl" />
                    <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-md">
                      {period === 'today' ? 'Hôm nay' : period === 'week' ? '7 ngày' : '30 ngày'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium">Số giao dịch</p>
                  <h3 className="text-2xl font-black mt-1 text-on-surface">{data?.transaction_count ?? 0}</h3>
                </div>

                {/* Chi tiêu trung bình / ngày */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-10 h-10 text-tertiary p-2 bg-tertiary-fixed rounded-xl" />
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">
                      TB / ngày
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium">Trung bình mỗi ngày</p>
                  <h3 className="text-2xl font-black mt-1 text-on-surface">{formatVND(data?.average_daily_spending)}</h3>
                </div>

                {/* Danh mục cao nhất */}
                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="w-10 h-10 text-primary p-2 bg-primary-fixed rounded-xl" />
                    {data?.top_category && (
                      <span className="text-xs font-bold text-secondary bg-secondary-fixed px-2 py-1 rounded-md">
                        Top 1
                      </span>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium">
                    {data?.top_category ? CATEGORY_LABELS[data.top_category] || data.top_category : 'Chưa có dữ liệu'}
                  </p>
                  <h3 className="text-2xl font-black mt-1 text-on-surface">{formatVND(data?.max_spending)}</h3>
                </div>
              </>
            )}
          </div>

          {/* Dashboard Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spending Trends Chart Area */}
            <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-on-surface">Xu hướng chi tiêu</h4>
                  <p className="text-sm text-on-surface-variant">
                    Chi tiêu theo ngày ({period === 'today' ? 'hôm nay' : period === 'week' ? '7 ngày qua' : '30 ngày qua'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm font-medium text-on-surface-variant">Chi phí</span>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="h-64 w-full mt-4 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <AreaChart data={data?.daily_spending} />
              )}
            </div>

            {/* Category PieChart */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
              <div className="mb-6">
                <h4 className="text-lg font-bold text-on-surface">Chi tiêu theo danh mục</h4>
                <p className="text-sm text-on-surface-variant">Tỷ lệ phân bổ chi tiêu</p>
              </div>
              <CategoryPieChart categories={data?.categories || {}} loading={loading} />
            </div>
          </div>
        </section>
      </main>

      {/* Budget Setting Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowBudgetModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-[#005ab6] to-[#1672df] px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-lg">Đặt ngân sách tháng</h3>
              <button onClick={() => setShowBudgetModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Budget Amount */}
              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-1.5">Ngân sách tháng (VND)</label>
                <input
                  type="number"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  min="0"
                  placeholder="VD: 10000000"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/30 text-on-surface font-bold text-lg"
                />
                {budgetInput > 0 && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    = {formatVND(budgetInput)}
                  </p>
                )}
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="text-sm font-bold text-on-surface-variant block mb-1.5">
                  Ngưỡng cảnh báo: <span className="text-primary">{thresholdInput}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={thresholdInput}
                  onChange={e => setThresholdInput(Number(e.target.value))}
                  className="w-full h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-outline mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Email Alert Toggle */}
              <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-on-surface">Gửi email cảnh báo</p>
                  <p className="text-xs text-on-surface-variant">Nhận email khi vượt ngưỡng ngân sách</p>
                </div>
                <button
                  onClick={() => setAlertEnabled(!alertEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${alertEnabled ? 'bg-primary' : 'bg-surface-container-high'}`}
                >
                  <span className={`absolute left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${alertEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="flex-1 py-3 bg-surface-container-low text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-high transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveBudget}
                  disabled={savingBudget}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {savingBudget ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</> : <><Check className="w-4 h-4" /> Lưu ngân sách</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default Dashboard;
