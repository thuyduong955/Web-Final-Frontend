"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Video, Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/services/api';
import MainLayout from '@/components/layout/MainLayout';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface CalendarBooking {
    id: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    meetingLink?: string | null;
    note?: string;
    interviewerName: string;
    interviewerRole?: string;
    interviewerCompany?: string;
    interviewerAvatar?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MOCK DATA FOR DEMO
// ═══════════════════════════════════════════════════════════════
const MOCK_BOOKINGS: CalendarBooking[] = [
    {
        id: 'mock-1',
        date: new Date().toISOString().split('T')[0], // Today
        time: '10:00 - 11:00',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'CONFIRMED',
        meetingLink: '/training1v1/call?room=demo-1',
        interviewerName: 'Nguyễn Văn A',
        interviewerRole: 'Senior Frontend Developer',
        interviewerCompany: 'Google',
    },
    {
        id: 'mock-2',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '14:00 - 15:00',
        startTime: new Date(Date.now() + 86400000 + 14 * 3600000).toISOString(),
        endTime: new Date(Date.now() + 86400000 + 15 * 3600000).toISOString(),
        status: 'PENDING',
        interviewerName: 'Trần Thị B',
        interviewerRole: 'Tech Lead',
        interviewerCompany: 'FPT Software',
    },
];

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CalendarPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [bookings, setBookings] = useState<CalendarBooking[]>([]);
    const [loading, setLoading] = useState(true);

    // ═══════════════════════════════════════════════════════════════
    // FETCH BOOKINGS FROM API
    // ═══════════════════════════════════════════════════════════════
    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/bookings');

            // Map API response to CalendarBooking format
            const apiBookings: CalendarBooking[] = (data || []).map((booking: any) => {
                const startDate = new Date(booking.startTime);
                const endDate = new Date(booking.endTime);

                return {
                    id: booking.id,
                    date: startDate.toISOString().split('T')[0],
                    time: `${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
                    startTime: booking.startTime,
                    endTime: booking.endTime,
                    status: booking.status,
                    meetingLink: booking.meetingLink,
                    note: booking.note,
                    interviewerName: booking.mentor?.name || 'Không rõ',
                    interviewerRole: booking.mentor?.interviewerProfile?.title,
                    interviewerCompany: booking.mentor?.interviewerProfile?.company,
                    interviewerAvatar: booking.mentor?.avatar,
                };
            });

            // Combine API bookings with mock data for demo
            setBookings([...apiBookings, ...MOCK_BOOKINGS]);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            // Fallback to mock data
            setBookings(MOCK_BOOKINGS);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // ═══════════════════════════════════════════════════════════════
    // CALENDAR LOGIC
    // ═══════════════════════════════════════════════════════════════
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDay = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    // Generate calendar days
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push(i);
    }

    // Check if a date has interviews (only CONFIRMED or COMPLETED)
    const hasInterviews = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return bookings.some(b => b.date === dateStr && (b.status === 'CONFIRMED' || b.status === 'COMPLETED'));
    };

    // Check if a date has completed interviews
    const hasCompletedInterviews = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return bookings.some(b => b.date === dateStr && b.status === 'COMPLETED');
    };

    // Get selected date interviews (only CONFIRMED and COMPLETED)
    const selectedDateBookings = useMemo(() => {
        if (!selectedDate) return [];
        return bookings.filter(b => b.date === selectedDate && (b.status === 'CONFIRMED' || b.status === 'COMPLETED'));
    }, [selectedDate, bookings]);

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════
    const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const handleJoinCall = (booking: CalendarBooking) => {
        if (booking.meetingLink) {
            if (booking.meetingLink.includes('/training1v1/call')) {
                router.push(booking.meetingLink);
            } else {
                window.open(booking.meetingLink, '_blank');
            }
        }
    };

    const canJoinCall = (booking: CalendarBooking) => {
        // Allow joining immediately if confirmed and has link (ignoring time constraints)
        return booking.status === 'CONFIRMED' && !!booking.meetingLink;
    };

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <MainLayout>
            <div className="min-h-screen p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lịch phỏng vấn</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Xem và quản lý các buổi phỏng vấn đã đặt lịch.
                    </p>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Calendar */}
                            <Card className="lg:col-span-2 p-6">
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-6">
                                    <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                        {MONTHS[month]} {year}
                                    </h2>
                                    <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-2 mb-2">
                                    {WEEKDAYS.map((day) => (
                                        <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-2">
                                    {calendarDays.map((day, index) => (
                                        <button
                                            key={index}
                                            onClick={() => day && handleDateClick(day)}
                                            disabled={!day}
                                            className={`relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                                ${!day ? 'invisible' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
                                                ${isToday(day!) ? 'ring-2 ring-cyan-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                                                ${selectedDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                                    ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                                    : 'text-slate-700 dark:text-slate-300'}
                                            `}
                                        >
                                            {day}
                                            {day && hasInterviews(day) && (
                                                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${hasCompletedInterviews(day) ? 'bg-green-500' : 'bg-cyan-500'
                                                    }`} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Legend */}
                                <div className="flex gap-6 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-cyan-500" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Sắp tới</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Đã hoàn thành</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Selected Date Details */}
                            <Card className="p-6 h-fit">
                                <div className="flex items-center gap-2 mb-4">
                                    <CalendarIcon className="w-5 h-5 text-cyan-500" />
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        {selectedDate ? formatDate(selectedDate) : 'Chọn một ngày'}
                                    </h3>
                                </div>

                                {selectedDate ? (
                                    selectedDateBookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedDateBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className={`p-4 rounded-lg border ${booking.status === 'COMPLETED'
                                                        ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                                        : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <Avatar className="w-10 h-10">
                                                            {booking.interviewerAvatar && <AvatarImage src={booking.interviewerAvatar} />}
                                                            <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                                                {booking.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                                                {booking.interviewerName}
                                                            </p>
                                                            {booking.interviewerRole && (
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                    {booking.interviewerRole}
                                                                </p>
                                                            )}
                                                            {booking.interviewerCompany && (
                                                                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                                                    {booking.interviewerCompany}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                                                        <Clock className="w-4 h-4 text-cyan-500" />
                                                        <span>{booking.time}</span>
                                                        {booking.status === 'COMPLETED' && (
                                                            <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                                                Đã hoàn thành
                                                            </span>
                                                        )}
                                                        {booking.status === 'CONFIRMED' && (
                                                            <span className="px-2 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full">
                                                                Sắp diễn ra
                                                            </span>
                                                        )}
                                                    </div>

                                                    {booking.note && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 italic">
                                                            "{booking.note}"
                                                        </p>
                                                    )}

                                                    {booking.status === 'CONFIRMED' && canJoinCall(booking) && (
                                                        <Button
                                                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                                                            onClick={() => handleJoinCall(booking)}
                                                        >
                                                            <Video className="w-4 h-4 mr-2" />
                                                            Vào phòng phỏng vấn
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400">
                                                Không có lịch phỏng vấn nào
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => router.push('/training1v1')}
                                            >
                                                Đặt lịch ngay
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-8">
                                        <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Chọn một ngày để xem chi tiết
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
