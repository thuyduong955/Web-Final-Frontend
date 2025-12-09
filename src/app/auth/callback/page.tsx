"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(errorParam);
            setStatus('error');
            return;
        }

        if (token && userParam) {
            try {
                const user = JSON.parse(userParam);

                // Store token and user in localStorage (use 'access_token' to match AuthContext)
                localStorage.setItem('access_token', token);
                localStorage.setItem('user', JSON.stringify(user));

                setStatus('success');

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    router.push('/');
                }, 1500);
            } catch (e) {
                setError('Invalid authentication data');
                setStatus('error');
            }
        } else {
            setError('Missing authentication data');
            setStatus('error');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-brand-cyan mx-auto animate-spin" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-4">
                            Đang xác thực...
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Vui lòng đợi trong giây lát
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-4">
                            Đăng nhập thành công!
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Đang chuyển hướng đến trang chủ...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mt-4">
                            Đăng nhập thất bại
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            {error || 'Có lỗi xảy ra khi xác thực'}
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="mt-4 px-6 py-2 bg-brand-cyan text-white rounded-lg hover:bg-brand-cyan/90 transition-colors"
                        >
                            Quay lại đăng nhập
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
