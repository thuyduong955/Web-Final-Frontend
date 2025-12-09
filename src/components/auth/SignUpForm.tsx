import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/auth-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Eye, EyeOff, UserPlus, User, Briefcase, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignUpFormProps {
  onToggleMode: () => void;
}

interface InterviewerProfileData {
  title: string;
  company: string;
  experience: string;
  skills: string;
  bio: string;
  linkedinUrl: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleMode }) => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'INTERVIEWEE' as UserRole,
  });

  // Interviewer profile fields (only used when role is INTERVIEWER)
  const [interviewerData, setInterviewerData] = useState<InterviewerProfileData>({
    title: '',
    company: '',
    experience: '',
    skills: '',
    bio: '',
    linkedinUrl: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validation states
  const emailInvalid = formData.email.length > 0 && !/^[^@]+@[^@]+\.[^@]+$/.test(formData.email);
  const passwordWeak = formData.password.length > 0 && formData.password.length < 6;
  const passwordMismatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const isInterviewer = formData.role === 'INTERVIEWER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    // Validate interviewer fields if role is INTERVIEWER
    if (isInterviewer) {
      if (!interviewerData.title.trim()) {
        setError('Vui lòng nhập chức danh');
        setLoading(false);
        return;
      }
      if (!interviewerData.company.trim()) {
        setError('Vui lòng nhập tên công ty');
        setLoading(false);
        return;
      }
      if (!interviewerData.experience || parseInt(interviewerData.experience) < 0) {
        setError('Vui lòng nhập số năm kinh nghiệm hợp lệ');
        setLoading(false);
        return;
      }
      if (!interviewerData.skills.trim()) {
        setError('Vui lòng nhập ít nhất một kỹ năng');
        setLoading(false);
        return;
      }
      if (!interviewerData.bio.trim() || interviewerData.bio.length < 50) {
        setError('Giới thiệu bản thân phải có ít nhất 50 ký tự');
        setLoading(false);
        return;
      }
    }

    // Prepare registration data
    const registrationData: any = {
      full_name: formData.full_name,
      role: formData.role,
    };

    // Add interviewer profile data if applicable
    if (isInterviewer) {
      registrationData.interviewerProfile = {
        title: interviewerData.title,
        company: interviewerData.company,
        experience: parseInt(interviewerData.experience),
        skills: interviewerData.skills.split(',').map(s => s.trim()).filter(Boolean),
        bio: interviewerData.bio,
        linkedinUrl: interviewerData.linkedinUrl || undefined,
      };
    }

    const { error } = await signUp(formData.email, formData.password, registrationData);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleInterviewerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInterviewerData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl border-slate-200/60">
        <CardHeader className="space-y-4 flex flex-col items-center text-center pb-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Đăng ký thành công!
          </CardTitle>
          <CardDescription className="text-slate-600 max-w-xs">
            Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Button
            onClick={onToggleMode}
            className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-brand-cyan/20"
          >
            Quay lại đăng nhập
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-xl border-slate-200/60">
      <CardHeader className="space-y-1 text-center pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800">Tạo tài khoản</CardTitle>
        <CardDescription className="text-slate-500">
          Nhập thông tin của bạn để bắt đầu hành trình
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="w-1 h-1 rounded-full bg-red-600 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-slate-700 ml-1">
              Họ và tên
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading}
              className="bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-lg h-10 transition-all"
            />
          </div>

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
                "bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-lg h-10 transition-all",
                emailInvalid && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              )}
              aria-invalid={emailInvalid}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Bạn là ai?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('INTERVIEWEE')}
                disabled={loading}
                className={cn(
                  "relative p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-slate-50",
                  formData.role === 'INTERVIEWEE'
                    ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan shadow-sm"
                    : "border-slate-100 text-slate-500 hover:border-slate-200"
                )}
              >
                <User className={cn("w-5 h-5", formData.role === 'INTERVIEWEE' ? "text-brand-cyan" : "text-slate-400")} />
                <span className="text-sm font-semibold">Ứng viên</span>
                {formData.role === 'INTERVIEWEE' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-brand-cyan rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('INTERVIEWER')}
                disabled={loading}
                className={cn(
                  "relative p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all duration-200 hover:bg-slate-50",
                  formData.role === 'INTERVIEWER'
                    ? "border-brand-cyan bg-brand-cyan/5 text-brand-cyan shadow-sm"
                    : "border-slate-100 text-slate-500 hover:border-slate-200"
                )}
              >
                <Briefcase className={cn("w-5 h-5", formData.role === 'INTERVIEWER' ? "text-brand-cyan" : "text-slate-400")} />
                <span className="text-sm font-semibold">Mentor</span>
                {formData.role === 'INTERVIEWER' && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-brand-cyan rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Interviewer Profile Fields */}
          {isInterviewer && (
            <div className="space-y-4 p-4 bg-cyan-50/50 rounded-lg border border-cyan-100 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-semibold text-cyan-700">Thông tin Mentor (bắt buộc)</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Chức danh *</label>
                  <Input
                    name="title"
                    placeholder="Senior Developer"
                    value={interviewerData.title}
                    onChange={handleInterviewerChange}
                    disabled={loading}
                    className="bg-white border-slate-200 rounded-lg h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Công ty *</label>
                  <Input
                    name="company"
                    placeholder="Google, FPT..."
                    value={interviewerData.company}
                    onChange={handleInterviewerChange}
                    disabled={loading}
                    className="bg-white border-slate-200 rounded-lg h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Số năm kinh nghiệm *</label>
                  <Input
                    name="experience"
                    type="number"
                    min="0"
                    placeholder="5"
                    value={interviewerData.experience}
                    onChange={handleInterviewerChange}
                    disabled={loading}
                    className="bg-white border-slate-200 rounded-lg h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">LinkedIn URL</label>
                  <Input
                    name="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={interviewerData.linkedinUrl}
                    onChange={handleInterviewerChange}
                    disabled={loading}
                    className="bg-white border-slate-200 rounded-lg h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Kỹ năng (phân cách bởi dấu phẩy) *</label>
                <Input
                  name="skills"
                  placeholder="React, Node.js, System Design"
                  value={interviewerData.skills}
                  onChange={handleInterviewerChange}
                  disabled={loading}
                  className="bg-white border-slate-200 rounded-lg h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Giới thiệu bản thân * <span className="text-slate-400">(tối thiểu 50 ký tự)</span>
                </label>
                <Textarea
                  name="bio"
                  placeholder="Chia sẻ về kinh nghiệm phỏng vấn, chuyên môn của bạn..."
                  value={interviewerData.bio}
                  onChange={handleInterviewerChange}
                  disabled={loading}
                  rows={3}
                  className="bg-white border-slate-200 rounded-lg text-sm resize-none"
                />
                <p className="text-xs text-slate-400 text-right">
                  {interviewerData.bio.length}/50 ký tự
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className={cn(
                  "bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-lg h-10 pr-10 transition-all",
                  passwordWeak && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                )}
                aria-invalid={passwordWeak}
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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 ml-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className={cn(
                  "bg-slate-50/50 border-slate-200 focus:border-brand-cyan focus:ring-brand-cyan/20 rounded-lg h-10 pr-10 transition-all",
                  passwordMismatch && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                )}
                aria-invalid={passwordMismatch}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white font-semibold h-11 rounded-lg shadow-lg shadow-brand-cyan/20 transition-all mt-2"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <span>Đăng ký tài khoản</span>
              </div>
            )}
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
          Đã có tài khoản? Đăng nhập ngay
        </Button>
      </CardFooter>
    </Card>
  );
};