"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserProfilePopup } from '@/components/user/UserProfilePopup';
import {
    Clock, Calendar, Video, CheckCircle, X, Users, ListChecks,
    Loader2, AlertCircle, RefreshCw, Check
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface Booking {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    meetingLink: string | null;
    note: string | null;
    cancelReason: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
    };
    review?: {
        id: string;
        rating: number;
        comment?: string;
    } | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const Training1v1Interviewer: React.FC = () => {
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed'>('pending');

    // Bookings state
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ═══════════════════════════════════════════════════════════════
    // FETCH BOOKINGS
    // ═══════════════════════════════════════════════════════════════
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get<Booking[]>('/bookings');
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError('Không thể tải danh sách lịch hẹn');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // ═══════════════════════════════════════════════════════════════
    // BOOKING ACTIONS
    // ═══════════════════════════════════════════════════════════════
    const handleConfirmBooking = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await api.post(`/bookings/${bookingId}/confirm`);
            await fetchBookings();
        } catch (err) {
            console.error('Error confirming booking:', err);
            alert('Không thể xác nhận lịch hẹn');
        }
        setActionLoading(null);
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return;

        setActionLoading(bookingId);
        try {
            await api.post(`/bookings/${bookingId}/cancel`, { cancelReason: 'Hủy bởi interviewer' });
            await fetchBookings();
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert('Không thể hủy lịch hẹn');
        }
        setActionLoading(null);
    };

    const handleCompleteBooking = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            await api.post(`/bookings/${bookingId}/complete`);
            await fetchBookings();
        } catch (err) {
            console.error('Error completing booking:', err);
            alert('Không thể hoàn thành lịch hẹn');
        }
        setActionLoading(null);
    };

    const handleJoinCall = (booking: Booking) => {
        if (booking.meetingLink) {
            if (booking.meetingLink.includes('/training1v1/call')) {
                router.push(`${booking.meetingLink}&role=interviewer`);
            } else {
                window.open(booking.meetingLink, '_blank');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
            time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const canJoinCall = (booking: Booking) => {
        if (booking.status !== 'CONFIRMED' || !booking.meetingLink) return false;
        const now = new Date();
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const joinStart = new Date(start.getTime() - 10 * 60 * 1000);
        const joinEnd = new Date(end.getTime() + 30 * 60 * 1000);
        return now >= joinStart && now <= joinEnd;
    };

    const isPast = (booking: Booking) => {
        return new Date(booking.endTime) < new Date();
    };

    // Filter bookings
    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6 lg:p-8 min-h-screen">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quản lý lịch phỏng vấn</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Xác nhận và quản lý các buổi phỏng vấn được đặt với bạn
                    </p>
                </header>

                {/* Tab Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button
                        variant={activeTab === 'pending' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('pending')}
                        className={activeTab === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Chờ xác nhận
                        {pendingBookings.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {pendingBookings.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'upcoming' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('upcoming')}
                        className={activeTab === 'upcoming' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Sắp tới
                        {confirmedBookings.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                {confirmedBookings.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'completed' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('completed')}
                        className={activeTab === 'completed' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Đã hoàn thành
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchBookings}
                        className="ml-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <Card className="p-8 text-center mb-6">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchBookings}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Thử lại
                        </Button>
                    </Card>
                )}

                {/* Loading State */}
                {loading && !error && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: PENDING */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {!loading && !error && activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingBookings.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Không có lịch hẹn nào đang chờ xác nhận</p>
                            </Card>
                        ) : (
                            pendingBookings.map((booking) => {
                                const { date, time } = formatDateTime(booking.startTime);
                                return (
                                    <Card key={booking.id} className="p-5 border-l-4 border-l-yellow-500">
                                        <div className="flex items-start gap-4">
                                            <UserProfilePopup
                                                userId={booking.user.id}
                                                userName={booking.user.name}
                                                userAvatar={booking.user.avatar}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="flex items-center gap-1 text-sm text-slate-600">
                                                        <Calendar className="w-4 h-4" />
                                                        {date}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-sm text-slate-600">
                                                        <Clock className="w-4 h-4" />
                                                        {time}
                                                    </span>
                                                </div>
                                                {booking.note && (
                                                    <p className="text-sm text-slate-500 italic mb-3">"{booking.note}"</p>
                                                )}
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600"
                                                        onClick={() => handleConfirmBooking(booking.id)}
                                                        disabled={actionLoading === booking.id}
                                                    >
                                                        {actionLoading === booking.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check className="w-4 h-4 mr-1" />
                                                                Xác nhận
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 border-red-200"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        disabled={actionLoading === booking.id}
                                                    >
                                                        <X className="w-4 h-4 mr-1" />
                                                        Từ chối
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: UPCOMING */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {!loading && !error && activeTab === 'upcoming' && (
                    <div className="space-y-4">
                        {confirmedBookings.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Không có buổi phỏng vấn nào sắp tới</p>
                            </Card>
                        ) : (
                            confirmedBookings.map((booking) => {
                                const { date, time } = formatDateTime(booking.startTime);
                                const canJoin = canJoinCall(booking);
                                const past = isPast(booking);
                                return (
                                    <Card key={booking.id} className="p-5 border-l-4 border-l-cyan-500">
                                        <div className="flex items-start gap-4">
                                            <UserProfilePopup
                                                userId={booking.user.id}
                                                userName={booking.user.name}
                                                userAvatar={booking.user.avatar}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="flex items-center gap-1 text-sm text-cyan-600">
                                                        <Calendar className="w-4 h-4" />
                                                        {date}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-sm text-slate-600">
                                                        <Clock className="w-4 h-4" />
                                                        {time}
                                                    </span>
                                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                                        Đã xác nhận
                                                    </span>
                                                </div>
                                                {booking.note && (
                                                    <p className="text-sm text-slate-500 italic mb-3">"{booking.note}"</p>
                                                )}
                                                <div className="flex gap-2">
                                                    {canJoin && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-500 hover:bg-green-600"
                                                            onClick={() => handleJoinCall(booking)}
                                                        >
                                                            <Video className="w-4 h-4 mr-1" />
                                                            Vào phỏng vấn
                                                        </Button>
                                                    )}
                                                    {past && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-500 hover:bg-blue-600"
                                                            onClick={() => handleCompleteBooking(booking.id)}
                                                            disabled={actionLoading === booking.id}
                                                        >
                                                            {actionLoading === booking.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                    Đánh dấu hoàn thành
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-500 border-red-200"
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        disabled={actionLoading === booking.id}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: COMPLETED */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {!loading && !error && activeTab === 'completed' && (
                    <div className="space-y-4">
                        {completedBookings.length === 0 ? (
                            <Card className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Chưa có buổi phỏng vấn nào hoàn thành</p>
                            </Card>
                        ) : (
                            completedBookings.map((booking) => {
                                const { date, time } = formatDateTime(booking.startTime);
                                return (
                                    <Card key={booking.id} className="p-5 border-l-4 border-l-green-500">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-10 h-10">
                                                {booking.user.avatar && <AvatarImage src={booking.user.avatar} />}
                                                <AvatarFallback className="bg-green-100 text-green-600">
                                                    {booking.user.name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{booking.user.name}</p>
                                                <p className="text-sm text-slate-500">{booking.user.email}</p>
                                                <div className="flex items-center gap-3 mt-2 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {time}
                                                    </span>
                                                </div>
                                                {booking.review && (
                                                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                                                        <span className="text-yellow-600">
                                                            Đánh giá: {booking.review.rating}/5 ⭐
                                                        </span>
                                                        {booking.review.comment && (
                                                            <p className="text-slate-600 mt-1 italic">"{booking.review.comment}"</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
