"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, XCircle, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import Link from 'next/link';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setStatus('error');
            setMessage('Token không hợp lệ');
            return;
        }

        if (newPassword.length < 6) {
            setStatus('error');
            setMessage('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus('error');
            setMessage('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        setStatus('idle');

        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setStatus('success');
            setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Có lỗi xảy ra. Token có thể đã hết hạn.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Link không hợp lệ</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                    </p>
                    <Link href="/forgot-password">
                        <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white">
                            Yêu cầu link mới
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thành công!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                    <Link href="/login">
                        <Button className="bg-brand-cyan hover:bg-brand-cyan/90 text-white w-full">
                            Đăng nhập ngay
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-brand-cyan" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đặt lại mật khẩu</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Nhập mật khẩu mới cho tài khoản của bạn
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Mật khẩu mới
                            </label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Ít nhất 6 ký tự"
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Xác nhận mật khẩu mới
                            </label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
                                {message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </Button>
                    </form>

                    {/* Back link */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-cyan transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
