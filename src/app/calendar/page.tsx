"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ChevronLeft, ChevronRight, Video, Clock, User, Calendar as CalendarIcon, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useScheduledSessions, ScheduledSession } from '@/contexts/ScheduledSessionsContext';
import MainLayout from '@/components/layout/MainLayout';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export default function CalendarPage() {
    const router = useRouter();
    const { sessions, getSessionsForDate, getUpcomingSessions } = useScheduledSessions();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Get calendar data
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

    // Check if a date has interviews
    const hasInterviews = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return sessions.some(session => session.date === dateStr && session.status !== 'cancelled');
    };

    // Check if a date has completed interviews
    const hasCompletedInterviews = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return sessions.some(session => session.date === dateStr && session.status === 'completed');
    };

    // Get selected date interviews
    const selectedDateInterviews = selectedDate ? getSessionsForDate(selectedDate) : [];

    // Navigate months
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Handle date click
    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Check if date is today
    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    // Join video call
    const handleJoinCall = (interview: ScheduledSession) => {
        router.push(`/interview/video-call?id=${interview.id}&interviewer=${encodeURIComponent(interview.interviewerName)}`);
    };

    return (
        <MainLayout>
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Lịch luyện tập</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Xem và quản lý các buổi phỏng vấn đã đặt lịch.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <Card className="lg:col-span-2 p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {MONTHS[month]} {year}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((day, index) => {
                                if (day === null) {
                                    return <div key={`empty-${index}`} className="aspect-square" />;
                                }

                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const hasEvents = hasInterviews(day);
                                const hasCompleted = hasCompletedInterviews(day);
                                const isSelected = selectedDate === dateStr;
                                const isTodayDate = isToday(day);

                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDateClick(day)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                            isSelected
                                                ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                                                : isTodayDate
                                                ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`}>
                                            {day}
                                        </span>
                                        {hasEvents && (
                                            <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                                isSelected ? 'bg-white' : hasCompleted ? 'bg-green-500' : 'bg-cyan-500'
                                            }`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <div className="w-3 h-3 rounded-full bg-cyan-100 dark:bg-cyan-900/30" />
                                <span>Hôm nay</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                                <span>Có lịch phỏng vấn</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Đã hoàn thành</span>
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
                            selectedDateInterviews.filter(i => i.status !== 'cancelled').length > 0 ? (
                                <div className="space-y-4">
                                    {selectedDateInterviews.filter(i => i.status !== 'cancelled').map((interview) => (
                                        <div
                                            key={interview.id}
                                            className={`p-4 rounded-xl border ${
                                                interview.status === 'completed'
                                                    ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                                    : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                                        {interview.interviewerName.split(' ').pop()?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                                        {interview.interviewerName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {interview.interviewerRole}
                                                    </p>
                                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                                        {interview.interviewerCompany}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                                                <Clock className="w-4 h-4 text-cyan-500" />
                                                <span>{interview.time}</span>
                                                {interview.status === 'completed' && (
                                                    <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                                        Đã hoàn thành
                                                    </span>
                                                )}
                                            </div>

                                            {interview.note && (
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 italic">
                                                    "{interview.note}"
                                                </p>
                                            )}

                                            {interview.status === 'upcoming' && (
                                                <Button
                                                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                                                    onClick={() => handleJoinCall(interview)}
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
                                        Đặt lịch mới
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-500 dark:text-slate-400">
                                    Chọn một ngày trên lịch để xem chi tiết
                                </p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Upcoming Interviews Summary */}
                <Card className="mt-6 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Lịch phỏng vấn sắp tới
                    </h3>
                    {getUpcomingSessions().length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getUpcomingSessions()
                                .slice(0, 3)
                                .map((interview) => (
                                    <div
                                        key={interview.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setSelectedDate(interview.date);
                                            const [yearStr, monthStr] = interview.date.split('-');
                                            setCurrentDate(new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1));
                                        }}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex flex-col items-center justify-center">
                                            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                                {new Date(interview.date).toLocaleDateString('vi-VN', { month: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                                {new Date(interview.date).getDate()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                                {interview.interviewerName}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {interview.time} • {interview.interviewerCompany}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 mb-4">
                                Chưa có lịch phỏng vấn nào sắp tới
                            </p>
                            <Button
                                onClick={() => router.push('/training1v1')}
                                className="bg-cyan-500 hover:bg-cyan-600"
                            >
                                Đặt lịch ngay
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
        </MainLayout>
    );
}
