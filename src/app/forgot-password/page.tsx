"use client";

import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Vui lòng nhập email');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { email });
            setIsEmailSent(true);
        } catch (error: any) {
            // Still show success to prevent email enumeration
            setIsEmailSent(true);
        } finally {
            setIsLoading(false);
        }
    };

    if (isEmailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Kiểm tra email của bạn</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Nếu tài khoản tồn tại với email <strong className="text-slate-700 dark:text-slate-300">{email}</strong>,
                        chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu.
                    </p>
                    <p className="text-sm text-slate-400 mb-6">
                        Link sẽ hết hạn sau 1 giờ. Nếu không thấy email, hãy kiểm tra thư mục spam.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => setIsEmailSent(false)}
                            variant="outline"
                            className="w-full"
                        >
                            Gửi lại email
                        </Button>
                        <Link href="/login" className="w-full">
                            <Button className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white">
                                Quay lại đăng nhập
                            </Button>
                        </Link>
                    </div>
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
                            <Mail className="w-8 h-8 text-brand-cyan" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Quên mật khẩu?</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                        >
                            {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
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
