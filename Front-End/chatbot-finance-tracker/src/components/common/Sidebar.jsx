import React from 'react';
import { Wallet, LayoutDashboard, Receipt, BarChart3, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard' },
    { icon: Receipt, label: 'Giao dịch', path: '/transactions' },
    { icon: BarChart3, label: 'Báo cáo', path: '/reports' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col py-10 bg-slate-50 dark:bg-slate-900 border-r-0 z-20">
      <div className="text-xl font-black text-[#005ab6] dark:text-[#2F80ED] px-6 mb-12 flex items-center gap-2">
        <Wallet className="w-8 h-8 fill-current" />
        <span>SMART TRACKER</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 mx-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-[#005ab6] dark:text-[#2F80ED] font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              alt="User Profile" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover flex-shrink-0" 
              src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || 'User'}&background=005ab6&color=fff`} 
            />
            <div className="truncate">
              <p className="text-sm font-bold text-on-surface truncate">{currentUser?.displayName || 'Người dùng'}</p>
              <p className="text-xs text-on-surface-variant truncate">Thành viên</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-lg transition-colors ml-2 flex-shrink-0"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
