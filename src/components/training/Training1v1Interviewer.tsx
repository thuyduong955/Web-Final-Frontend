import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Home, Clock, Calendar, Video, CheckCircle, X, Users, Settings, Plus, Trash2 } from 'lucide-react';

interface TimeSlot {
    id: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string;
    endTime: string;
}

interface BookedSession {
    id: string;
    intervieweeId: string;
    intervieweeName: string;
    intervieweeEmail: string;
    intervieweeAvatar?: string;
    date: string;
    time: string;
    note?: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    topic?: string;
}

const DAYS_OF_WEEK = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Mock data for available time slots
const INITIAL_TIME_SLOTS: TimeSlot[] = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
    { id: '2', dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
    { id: '3', dayOfWeek: 2, startTime: '10:00', endTime: '12:00' },
    { id: '4', dayOfWeek: 3, startTime: '09:00', endTime: '11:00' },
    { id: '5', dayOfWeek: 4, startTime: '14:00', endTime: '17:00' },
    { id: '6', dayOfWeek: 5, startTime: '09:00', endTime: '12:00' },
];

// Mock data for booked sessions
const INITIAL_BOOKED_SESSIONS: BookedSession[] = [
    {
        id: 'b1',
        intervieweeId: 'u1',
        intervieweeName: 'Trần Văn Minh',
        intervieweeEmail: 'minh.tran@email.com',
        date: '2025-12-10',
        time: '09:00',
        note: 'Muốn tập trung vào System Design',
        status: 'confirmed',
        topic: 'System Design',
    },
    {
        id: 'b2',
        intervieweeId: 'u2',
        intervieweeName: 'Nguyễn Thị Lan',
        intervieweeEmail: 'lan.nguyen@email.com',
        date: '2025-12-10',
        time: '14:00',
        status: 'pending',
        topic: 'Frontend React',
    },
    {
        id: 'b3',
        intervieweeId: 'u3',
        intervieweeName: 'Lê Hoàng Nam',
        intervieweeEmail: 'nam.le@email.com',
        date: '2025-12-12',
        time: '10:00',
        note: 'Backend Java Spring Boot',
        status: 'confirmed',
        topic: 'Backend Development',
    },
    {
        id: 'b4',
        intervieweeId: 'u4',
        intervieweeName: 'Phạm Thị Hoa',
        intervieweeEmail: 'hoa.pham@email.com',
        date: '2025-12-05',
        time: '09:00',
        status: 'completed',
        topic: 'Algorithms',
    },
];

export const Training1v1Interviewer: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'schedule' | 'bookings'>('bookings');
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(INITIAL_TIME_SLOTS);
    const [bookedSessions, setBookedSessions] = useState<BookedSession[]>(INITIAL_BOOKED_SESSIONS);
    const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
    const [newSlot, setNewSlot] = useState<{ dayOfWeek: number; startTime: string; endTime: string }>({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
    });

    const handleAddTimeSlot = () => {
        const newTimeSlot: TimeSlot = {
            id: `slot-${Date.now()}`,
            ...newSlot,
        };
        setTimeSlots(prev => [...prev, newTimeSlot]);
        setShowAddSlotDialog(false);
        setNewSlot({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
    };

    const handleDeleteTimeSlot = (slotId: string) => {
        setTimeSlots(prev => prev.filter(s => s.id !== slotId));
    };

    const handleConfirmSession = (sessionId: string) => {
        setBookedSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, status: 'confirmed' as const } : s)
        );
    };

    const handleCancelSession = (sessionId: string) => {
        setBookedSessions(prev =>
            prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' as const } : s)
        );
    };

    const handleJoinCall = (session: BookedSession) => {
        router.push(`/interview/video-call?id=${session.id}&interviewer=${encodeURIComponent(session.intervieweeName)}`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Group time slots by day
    const slotsByDay = DAYS_OF_WEEK.map((day, index) => ({
        day,
        dayIndex: index,
        slots: timeSlots.filter(s => s.dayOfWeek === index),
    }));

    return (
        <div className="p-8 h-full">
            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Quản lý Phỏng vấn 1v1</h1>
                            <p className="text-cyan-600 dark:text-cyan-400 font-medium mt-1">Interviewer Dashboard</p>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Quản lý lịch rảnh và xem danh sách các interviewee đã đăng ký.
                    </p>
                </header>

                {/* Tab Buttons */}
                <div className="flex gap-4 mb-8">
                    <Button
                        variant={activeTab === 'bookings' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('bookings')}
                        className={`flex items-center gap-2 px-6 py-3 ${
                            activeTab === 'bookings'
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                : ''
                        }`}
                    >
                        <Users className="w-5 h-5" />
                        Danh sách đăng ký
                        {bookedSessions.filter(s => s.status === 'pending').length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {bookedSessions.filter(s => s.status === 'pending').length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'schedule' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-6 py-3 ${
                            activeTab === 'schedule'
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                : ''
                        }`}
                    >
                        <Settings className="w-5 h-5" />
                        Cài đặt lịch rảnh
                    </Button>
                </div>

                {/* Tab Content */}
                {activeTab === 'bookings' ? (
                    /* Booked Sessions List */
                    <div className="space-y-6">
                        {/* Pending Sessions */}
                        {bookedSessions.filter(s => s.status === 'pending').length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                    Chờ xác nhận
                                    <span className="px-2 py-0.5 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
                                        {bookedSessions.filter(s => s.status === 'pending').length}
                                    </span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bookedSessions
                                        .filter(s => s.status === 'pending')
                                        .map((session) => (
                                            <Card key={session.id} className="p-5 border-l-4 border-l-yellow-500">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={session.intervieweeAvatar} />
                                                        <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 font-bold">
                                                            {session.intervieweeName.split(' ').pop()?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                                            {session.intervieweeName}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {session.intervieweeEmail}
                                                        </p>
                                                        {session.topic && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                                                                {session.topic}
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(session.date)}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                                <Clock className="w-4 h-4" />
                                                                {session.time}
                                                            </span>
                                                        </div>
                                                        {session.note && (
                                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                                                "{session.note}"
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2 mt-4">
                                                            <Button
                                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                                                onClick={() => handleConfirmSession(session.id)}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                                Xác nhận
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                                                                onClick={() => handleCancelSession(session.id)}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Confirmed Sessions */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-cyan-500" />
                                Buổi phỏng vấn sắp tới
                            </h2>
                            {bookedSessions.filter(s => s.status === 'confirmed').length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bookedSessions
                                        .filter(s => s.status === 'confirmed')
                                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map((session) => (
                                            <Card key={session.id} className="p-5 border-l-4 border-l-cyan-500">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarImage src={session.intervieweeAvatar} />
                                                        <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                                            {session.intervieweeName.split(' ').pop()?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                                            {session.intervieweeName}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {session.intervieweeEmail}
                                                        </p>
                                                        {session.topic && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 rounded-full">
                                                                {session.topic}
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(session.date)}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                                                <Clock className="w-4 h-4" />
                                                                {session.time}
                                                            </span>
                                                        </div>
                                                        {session.note && (
                                                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                                                "{session.note}"
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2 mt-4">
                                                            <Button
                                                                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                                                                onClick={() => handleJoinCall(session)}
                                                            >
                                                                <Video className="w-4 h-4 mr-2" />
                                                                Vào phỏng vấn
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                                                                onClick={() => handleCancelSession(session.id)}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            ) : (
                                <Card className="p-8 text-center">
                                    <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Chưa có buổi phỏng vấn nào được xác nhận
                                    </p>
                                </Card>
                            )}
                        </div>

                        {/* Completed Sessions */}
                        {bookedSessions.filter(s => s.status === 'completed').length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    Đã hoàn thành
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {bookedSessions
                                        .filter(s => s.status === 'completed')
                                        .map((session) => (
                                            <Card key={session.id} className="p-4 border-l-4 border-l-green-500 opacity-80">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 font-bold text-sm">
                                                            {session.intervieweeName.split(' ').pop()?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-slate-900 dark:text-white truncate">
                                                            {session.intervieweeName}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            {formatDate(session.date)} - {session.time}
                                                        </p>
                                                    </div>
                                                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full whitespace-nowrap">
                                                        Hoàn thành
                                                    </span>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Schedule Settings */
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                Lịch rảnh của bạn
                            </h2>
                            <Button
                                className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                onClick={() => setShowAddSlotDialog(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm khung giờ
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {slotsByDay.map(({ day, dayIndex, slots }) => (
                                <Card key={dayIndex} className={`p-4 ${slots.length === 0 ? 'opacity-50' : ''}`}>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-cyan-500" />
                                        {day}
                                    </h3>
                                    {slots.length > 0 ? (
                                        <div className="space-y-2">
                                            {slots.map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center justify-between p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg"
                                                >
                                                    <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                                                        {slot.startTime} - {slot.endTime}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteTimeSlot(slot.id)}
                                                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 dark:text-slate-500">
                                            Không có lịch
                                        </p>
                                    )}
                                </Card>
                            ))}
                        </div>

                        <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                <strong>Lưu ý:</strong> Interviewee có thể đặt lịch trong các khung giờ bạn đã thiết lập. 
                                Hãy đảm bảo cập nhật lịch rảnh thường xuyên để tránh xung đột.
                            </p>
                        </Card>
                    </div>
                )}
            </div>

            {/* Add Time Slot Dialog */}
            <AlertDialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-500" />
                            Thêm khung giờ rảnh
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Ngày trong tuần
                            </label>
                            <select
                                value={newSlot.dayOfWeek}
                                onChange={(e) => setNewSlot(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                {DAYS_OF_WEEK.map((day, index) => (
                                    <option key={index} value={index}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Giờ bắt đầu
                                </label>
                                <Input
                                    type="time"
                                    value={newSlot.startTime}
                                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Giờ kết thúc
                                </label>
                                <Input
                                    type="time"
                                    value={newSlot.endTime}
                                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleAddTimeSlot}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
