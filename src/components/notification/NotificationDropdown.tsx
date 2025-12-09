"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Bell, Check, Loader2, Calendar, MessageSquare, Star, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: {
        bookingId?: string;
        contentId?: string;
        userId?: string;
    };
}

interface NotificationsResponse {
    data: Notification[];
    pagination: {
        page: number;
        total: number;
        unreadCount: number;
    };
}

const ICON_MAP: Record<string, React.ReactNode> = {
    BOOKING_REQUEST: <Calendar className="w-4 h-4 text-blue-500" />,
    BOOKING_CONFIRMED: <Check className="w-4 h-4 text-green-500" />,
    BOOKING_CANCELLED: <AlertCircle className="w-4 h-4 text-red-500" />,
    BOOKING_REMINDER: <Calendar className="w-4 h-4 text-yellow-500" />,
    NEW_REVIEW: <Star className="w-4 h-4 text-yellow-500" />,
    NEW_MESSAGE: <MessageSquare className="w-4 h-4 text-cyan-500" />,
    PROFILE_APPROVED: <User className="w-4 h-4 text-green-500" />,
    CONTENT_APPROVED: <Check className="w-4 h-4 text-green-500" />,
    SYSTEM: <Bell className="w-4 h-4 text-slate-500" />,
};

export function NotificationDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get<NotificationsResponse>('/notifications', {
                params: { limit: 10 },
            });
            setNotifications(data.data);
            setUnreadCount(data.pagination.unreadCount);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await api.post('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
        setLoading(false);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        setIsOpen(false);

        // Navigate based on notification type
        if (notification.data?.bookingId) {
            router.push('/training1v1');
        } else if (notification.data?.contentId) {
            router.push(`/library/${notification.data.contentId}`);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                disabled={loading}
                                className="text-sm text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Đọc tất cả'
                                )}
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                                <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left ${!notification.isRead ? 'bg-cyan-50/50 dark:bg-cyan-900/10' : ''
                                        }`}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {ICON_MAP[notification.type] || ICON_MAP.SYSTEM}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm ${!notification.isRead ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {notification.title}
                                            </p>
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {formatTime(notification.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/notifications');
                                }}
                                className="w-full text-sm text-center text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                            >
                                Xem tất cả thông báo
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationDropdown;
