import React, { useState } from 'react';
import { Wallet, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle, error: authError } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate email login
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {
      console.error("Login failed", error);
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex items-center justify-center p-0 overflow-x-hidden">
      <div className="flex w-full min-h-screen">
        {/* Left Section: Editorial Illustration */}
        <section className="hidden lg:flex lg:w-3/5 bg-surface relative flex-col justify-center px-24 overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="p-2.5 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Wallet className="text-on-primary w-8 h-8" />
              </div>
              <span className="text-3xl font-extrabold tracking-tighter text-primary">Smart Finance Tracker</span>
            </div>
            
            <h1 className="text-6xl font-display font-extrabold tracking-tight text-on-surface mb-6 leading-[1.1]">
              Làm chủ <br/>
              <span className="text-primary-container">tài chính của bạn.</span>
            </h1>
            
            <p className="text-on-surface-variant text-xl max-w-lg mb-12 leading-relaxed">
              Hệ thống thông minh giúp bạn theo dõi chi tiêu một cách chính xác. Quản lý dòng tiền với giao diện hiện đại và trực quan.
            </p>
            
            <div className="grid grid-cols-2 gap-8 max-w-md">
              <div className="space-y-2">
                <span className="text-3xl font-bold text-on-surface">99.9%</span>
                <p className="text-sm text-on-surface-variant font-medium">Độ chính xác dữ liệu</p>
              </div>
              <div className="space-y-2">
                <span className="text-3xl font-bold text-on-surface">12k+</span>
                <p className="text-sm text-on-surface-variant font-medium">Người dùng tích cực</p>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Texture */}
          <div className="absolute top-0 right-0 w-full h-full opacity-40 pointer-events-none">
            <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-primary-fixed-dim/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface to-transparent"></div>
          </div>
        </section>

        {/* Right Section: Login Form */}
        <main className="w-full lg:w-2/5 flex items-center justify-center bg-surface-container-lowest lg:bg-background px-6 py-12 relative">
          {/* Mobile Brand Header */}
          <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
            <Wallet className="text-primary w-6 h-6" />
            <span className="text-xl font-extrabold tracking-tighter text-primary">Smart Finance Tracker</span>
          </div>

          <div className="w-full max-w-md">
            <div className="bg-surface-container-lowest lg:shadow-[0_8px_24px_rgba(25,28,30,0.06)] p-8 lg:p-12 rounded-2xl">
              <header className="mb-10">
                <h2 className="text-3xl font-bold font-display tracking-tight text-on-surface mb-2">Chào mừng trở lại</h2>
                <p className="text-on-surface-variant font-medium">Vui lòng nhập thông tin để tiếp tục.</p>
              </header>

              {/* Google Sign In */}
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/15 text-on-surface font-semibold rounded-xl transition-all active:scale-95 group mb-8 disabled:opacity-70"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
                  </svg>
                )}
                {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
              </button>

              {authError && (
                <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm text-center">
                  {authError}
                </div>
              )}

              <div className="relative flex items-center mb-8">
                <div className="flex-grow border-t border-outline-variant/20"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-outline uppercase tracking-widest">Hoặc email</span>
                <div className="flex-grow border-t border-outline-variant/20"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant px-1" htmlFor="email">Địa chỉ Email</label>
                  <div className="relative group">
                    <input 
                      className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                      id="email" 
                      name="email" 
                      placeholder="name@company.com" 
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-sm font-bold text-on-surface-variant" htmlFor="password">Mật khẩu</label>
                    <a className="text-sm font-bold text-primary hover:underline transition-all" href="#">Quên mật khẩu?</a>
                  </div>
                  <div className="relative group">
                    <input 
                      className="w-full px-4 py-3.5 bg-surface-container-low border-0 rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all" 
                      id="password" 
                      name="password" 
                      placeholder="••••••••" 
                      type="password"
                    />
                  </div>
                </div>

                <button 
                  className="w-full bg-gradient-to-br from-[#005ab6] to-[#1672df] text-on-primary font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
                  type="submit"
                >
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <footer className="mt-10 text-center">
                <p className="text-on-surface-variant font-medium">
                  Chưa có tài khoản? 
                  <a className="text-primary font-bold hover:underline transition-all ml-1" href="#">Đăng ký</a>
                </p>
              </footer>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-outline font-medium">
              <a className="hover:text-on-surface transition-colors" href="#">Chính sách bảo mật</a>
              <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
              <a className="hover:text-on-surface transition-colors" href="#">Điều khoản sử dụng</a>
              <span className="w-1 h-1 bg-outline-variant/30 rounded-full"></span>
              <a className="hover:text-on-surface transition-colors" href="#">Trợ giúp</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
