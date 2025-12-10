"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { UserProfilePopup } from '@/components/user/UserProfilePopup';
import {
    Clock, Calendar, Video, CheckCircle, X, Users, ListChecks,
    Loader2, AlertCircle, RefreshCw, Check, Settings, Plus, Trash2, Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed' | 'settings'>('pending');

    // Availability state
    interface TimeSlot {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }
    const [availability, setAvailability] = useState<TimeSlot[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const DAYS_OF_WEEK = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    // Bookings state
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Notification dialog state
    const [notification, setNotification] = useState<{ show: boolean; title: string; description: string; type: 'success' | 'error' }>({
        show: false, title: '', description: '', type: 'success'
    });

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

    const fetchProfile = useCallback(async () => {
        setLoadingProfile(true);
        try {
            const { data } = await api.get('/auth/profile');
            if (data.interviewerProfile?.availability) {
                setAvailability(data.interviewerProfile.availability);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
        setLoadingProfile(false);
    }, []);

    const handleSaveAvailability = async () => {
        setSavingProfile(true);
        try {
            await api.put('/users/interviewer-profile', { availability });
            setNotification({
                show: true,
                title: 'Thành công',
                description: 'Đã lưu thời gian rảnh của bạn!',
                type: 'success'
            });
        } catch (err) {
            console.error('Error saving availability:', err);
            setNotification({
                show: true,
                title: 'Lỗi',
                description: 'Không thể lưu thời gian rảnh. Vui lòng thử lại.',
                type: 'error'
            });
        }
        setSavingProfile(false);
    };

    const handleAddTimeSlot = (dayOfWeek: number) => {
        setAvailability([...availability, { dayOfWeek, startTime: '09:00', endTime: '12:00' }]);
    };

    const handleRemoveTimeSlot = (index: number) => {
        setAvailability(availability.filter((_, i) => i !== index));
    };

    const handleUpdateTimeSlot = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const updated = [...availability];
        updated[index][field] = value;
        setAvailability(updated);
    };

    useEffect(() => {
        fetchBookings();
        fetchProfile();
    }, [fetchBookings, fetchProfile]);

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
                        variant={activeTab === 'settings' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('settings')}
                        className={activeTab === 'settings' ? 'bg-slate-700 hover:bg-slate-800' : ''}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Cài đặt
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

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: SETTINGS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {!loading && !error && activeTab === 'settings' && (
                    <div className="space-y-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-semibold">Thời gian rảnh</h2>
                                    <p className="text-sm text-slate-500">Thiết lập thời gian bạn có thể nhận phỏng vấn</p>
                                </div>
                                <Button
                                    onClick={handleSaveAvailability}
                                    disabled={savingProfile}
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    {savingProfile ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Lưu
                                        </>
                                    )}
                                </Button>
                            </div>

                            {loadingProfile ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                                        const daySlots = availability
                                            .map((slot, index) => ({ ...slot, originalIndex: index }))
                                            .filter(slot => slot.dayOfWeek === dayIndex);
                                        return (
                                            <div key={dayIndex} className="border-b border-slate-100 dark:border-slate-700 pb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm">{day}</span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAddTimeSlot(dayIndex)}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Thêm
                                                    </Button>
                                                </div>
                                                {daySlots.length === 0 ? (
                                                    <p className="text-xs text-slate-400 italic">Không có lịch rảnh</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-3">
                                                        {daySlots.map((slot) => (
                                                            <div key={slot.originalIndex} className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-600 shadow-sm">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                                                                    <input
                                                                        type="time"
                                                                        value={slot.startTime}
                                                                        onChange={(e) => handleUpdateTimeSlot(slot.originalIndex, 'startTime', e.target.value)}
                                                                        className="w-[90px] px-2 py-1 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <span className="text-slate-400 font-medium">→</span>
                                                                <input
                                                                    type="time"
                                                                    value={slot.endTime}
                                                                    onChange={(e) => handleUpdateTimeSlot(slot.originalIndex, 'endTime', e.target.value)}
                                                                    className="w-[90px] px-2 py-1 text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                                                                />
                                                                <button
                                                                    onClick={() => handleRemoveTimeSlot(slot.originalIndex)}
                                                                    className="ml-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                    title="Xóa khung giờ"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>

            {/* Notification Dialog */}
            <AlertDialog open={notification.show} onOpenChange={(open) => setNotification({ ...notification, show: open })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={notification.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                            {notification.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {notification.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setNotification({ ...notification, show: false })}
                            className={notification.type === 'error' ? 'bg-red-500 hover:bg-red-600' : 'bg-cyan-500 hover:bg-cyan-600'}
                        >
                            Đóng
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
