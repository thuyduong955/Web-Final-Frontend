import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailInvalid = formData.email.length > 0 && !/^[^@]+@[^@]+\.[^@]+$/.test(formData.email);
  const passwordEmpty = formData.password.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl border-slate-200/60">
      <CardHeader className="space-y-1 text-center pb-6">
        <CardTitle className="text-2xl font-bold text-slate-800">Chào mừng trở lại</CardTitle>
        <CardDescription className="text-slate-500">
          Đăng nhập để tiếp tục hành trình của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="w-1 h-1 rounded-full bg-red-600 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className={cn(
                "bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-xl h-11 transition-all",
                emailInvalid && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              )}
              aria-invalid={emailInvalid}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <button type="button" className="text-xs text-brand-cyan hover:underline font-medium">
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className={cn(
                  "bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-xl h-11 pr-10 transition-all",
                  passwordEmpty && error && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                )}
                aria-invalid={!!(passwordEmpty && error)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white font-semibold h-12 rounded-xl shadow-lg shadow-brand-cyan/20 transition-all mt-2"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang đăng nhập...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                <span>Đăng nhập</span>
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Hoặc</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 transition-all"
            disabled={loading}
            onClick={() => {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
              window.location.href = `${apiUrl}/auth/google`;
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center pb-6">
        <Button
          type="button"
          onClick={onToggleMode}
          variant="ghost"
          disabled={loading}
          className="text-slate-600 hover:text-brand-cyan hover:bg-brand-cyan/5"
        >
          Chưa có tài khoản? Đăng ký ngay
        </Button>
      </CardFooter>
    </Card>
  );
};