import React from 'react';
import { Search, Filter, Wallet, Receipt, CreditCard, Banknote, Calendar, TrendingUp, ShoppingBag, Utensils, Zap, Dumbbell } from 'lucide-react';
import Sidebar from '../../components/common/Sidebar';
import ChatbotWidget from '../../components/ChatbotWidget/ChatbotWidget';
import AreaChart from '../../components/Charts/AreaChart';

const Dashboard = () => {
  return (
    <div className="bg-background text-on-surface antialiased flex min-h-screen">
      <Sidebar />

      {/* Main Content Canvas */}
      <main className="flex-1 ml-64 min-h-screen pb-20">
        {/* TopAppBar */}
        <header className="w-full sticky top-0 z-10 flex items-center justify-between px-12 py-8 bg-background/80 backdrop-blur-md">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.02em] text-on-surface">Tổng quan tài chính</h1>
            <p className="text-on-surface-variant text-sm mt-1">Chào mừng trở lại, Thanh Du. Tài sản của bạn đang tăng trưởng.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-low rounded-full px-4 py-2 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <Search className="w-5 h-5 text-on-surface-variant mr-2" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline p-0 w-48" 
                placeholder="Tìm kiếm giao dịch..." 
                type="text" 
              />
            </div>
            <button className="hover:bg-surface-container-low rounded-full p-2 text-on-surface-variant transition-colors border border-transparent hover:border-outline-variant/20">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </header>

        <section className="px-12 space-y-10">
          {/* Filter Actions */}
          <div className="flex justify-end">
            <div className="inline-flex bg-surface-container-low p-1 rounded-xl">
              <button className="px-6 py-2 text-sm font-medium rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">Hôm nay</button>
              <button className="px-6 py-2 text-sm font-medium rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">Tuần</button>
              <button className="px-6 py-2 text-sm font-bold bg-white text-primary shadow-sm rounded-lg">Tháng</button>
            </div>
          </div>

          {/* Bento Grid: Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Banknote className="w-10 h-10 text-primary p-2 bg-primary-fixed rounded-xl" />
                <span className="text-xs font-bold text-tertiary bg-tertiary-fixed px-2 py-1 rounded-md">-12% so với tháng trước</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Tổng chi tiêu</p>
              <h3 className="text-2xl font-black mt-1 text-on-surface">100,500,000 ₫</h3>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Wallet className="w-10 h-10 text-secondary p-2 bg-secondary-fixed rounded-xl" />
                <span className="text-xs font-bold text-primary bg-primary-fixed px-2 py-1 rounded-md">82% Đã dùng</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Ngân sách còn lại</p>
              <h3 className="text-2xl font-black mt-1 text-on-surface">31,000,000 ₫</h3>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-10 h-10 text-tertiary p-2 bg-tertiary-fixed rounded-xl" />
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">Còn 24 ngày</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Tháng này</p>
              <h3 className="text-2xl font-black mt-1 text-on-surface">171,000,000 ₫</h3>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)] border border-transparent hover:shadow-[0_8px_24px_rgba(0,90,182,0.08)] transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-10 h-10 text-primary p-2 bg-primary-fixed rounded-xl" />
                <span className="text-xs font-bold text-secondary bg-secondary-fixed px-2 py-1 rounded-md">+5.4%</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Tiết kiệm</p>
              <h3 className="text-2xl font-black mt-1 text-on-surface">311,250,000 ₫</h3>
            </div>
          </div>

          {/* Dashboard Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Spending Trends Chart Area */}
            <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-on-surface">Xu hướng chi tiêu</h4>
                  <p className="text-sm text-on-surface-variant">Tần suất giao dịch trong tuần</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    <span className="text-sm font-medium text-on-surface-variant">Chi phí</span>
                  </div>
                </div>
              </div>
              <AreaChart />
            </div>

            {/* Recent Transactions */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-lg font-bold text-on-surface">Hoạt động gần đây</h4>
                <button className="text-primary text-sm font-bold hover:underline">Xem tất cả</button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Apple Store</p>
                      <p className="text-xs text-on-surface-variant">Điện tử • 2h trước</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface">-4,900,000 ₫</span>
                </div>

                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">The Green Fork</p>
                      <p className="text-xs text-on-surface-variant">Ăn uống • 5h trước</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface">-1,000,000 ₫</span>
                </div>

                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Điện lực EVN</p>
                      <p className="text-xs text-on-surface-variant">Hóa đơn • Hôm qua</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface">-3,900,000 ₫</span>
                </div>

                <div className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">California Fitness</p>
                      <p className="text-xs text-on-surface-variant">Sức khỏe • 2 ngày trước</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface">-5,500,000 ₫</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default Dashboard;
