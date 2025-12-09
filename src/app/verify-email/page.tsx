'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        async function verifyEmail() {
            if (!token) {
                setStatus('error');
                setMessage('Token không hợp lệ');
                return;
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
                const res = await fetch(`${apiUrl}/auth/verify-email?token=${token}`);
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email đã được xác thực thành công!');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Không thể xác thực email. Token có thể đã hết hạn.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
            }
        }

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Xác thực Email</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-8">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-cyan-500 animate-spin" />
                            <p className="text-slate-600">Đang xác thực email của bạn...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <p className="text-slate-700 text-center">{message}</p>
                            <Button onClick={() => router.push('/login')} className="mt-4">
                                Đăng nhập ngay
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="h-16 w-16 text-red-500" />
                            <p className="text-slate-700 text-center">{message}</p>
                            <Button variant="outline" onClick={() => router.push('/register')} className="mt-4">
                                Đăng ký lại
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}
