"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserProfilePopup } from '@/components/user/UserProfilePopup';
import {
    Star, Clock, Calendar, Video, CheckCircle, X, Users, ListChecks,
    Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface InterviewerProfile {
    title: string | null;
    company: string | null;
    bio: string | null;
    skills: string[];
    experience: number;
    hourlyRate: number;
    rating: number;
    totalReviews: number;
    totalSessions: number;
}

interface Interviewer {
    id: string;
    name: string;
    avatar: string | null;
    interviewerProfile: InterviewerProfile | null;
}

interface Booking {
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    meetingLink: string | null;
    note: string | null;
    cancelReason: string | null;
    mentor: {
        id: string;
        name: string;
        avatar: string | null;
        interviewerProfile?: InterviewerProfile | null;
    };
    review?: {
        id: string;
        rating: number;
        comment?: string;
    } | null;
}

// ═══════════════════════════════════════════════════════════════
// STAR RATING COMPONENTS
// ═══════════════════════════════════════════════════════════════
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.floor(rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                    }`}
            />
        ))}
    </div>
);

const InteractiveStarRating = ({
    rating,
    onRatingChange,
}: {
    rating: number;
    onRatingChange: (rating: number) => void;
}) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="focus:outline-none"
                >
                    <Star
                        className={`w-8 h-8 transition-colors ${star <= (hover || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════
// DEFAULT TIME SLOTS
// ═══════════════════════════════════════════════════════════════
const DEFAULT_TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const Training1v1: React.FC = () => {
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState<'interviewers' | 'scheduled' | 'reviews'>('interviewers');

    // Interviewers state
    const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
    const [loadingInterviewers, setLoadingInterviewers] = useState(true);

    // Bookings state
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // UI state
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Booking dialog state
    const [showBookingDialog, setShowBookingDialog] = useState(false);
    const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [bookingNote, setBookingNote] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    // Review dialog state
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // ═══════════════════════════════════════════════════════════════
    // FETCH INTERVIEWERS
    // ═══════════════════════════════════════════════════════════════
    const fetchInterviewers = useCallback(async () => {
        setLoadingInterviewers(true);
        setError(null);
        try {
            const { data } = await api.get<{ data: Interviewer[] }>('/users/interviewers', {
                params: { limit: 20, sortBy: 'rating' }
            });
            setInterviewers(data.data || []);
        } catch (err) {
            console.error('Error fetching interviewers:', err);
            setError('Không thể tải danh sách interviewer');
        }
        setLoadingInterviewers(false);
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // FETCH BOOKINGS
    // ═══════════════════════════════════════════════════════════════
    const fetchBookings = useCallback(async () => {
        setLoadingBookings(true);
        try {
            const { data } = await api.get<Booking[]>('/bookings');
            setBookings(data || []);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        }
        setLoadingBookings(false);
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // INITIAL LOAD
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        fetchInterviewers();
        fetchBookings();
    }, [fetchInterviewers, fetchBookings]);

    // ═══════════════════════════════════════════════════════════════
    // BOOKING HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const handleOpenBooking = (interviewer: Interviewer) => {
        setSelectedInterviewer(interviewer);
        setSelectedDate('');
        setSelectedTime('');
        setBookingNote('');
        setShowBookingDialog(true);
    };

    const handleCreateBooking = async () => {
        if (!selectedInterviewer || !selectedDate || !selectedTime) return;

        setBookingLoading(true);
        try {
            const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

            await api.post('/bookings', {
                mentorId: selectedInterviewer.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                duration: 60,
                note: bookingNote || undefined,
            });

            setShowBookingDialog(false);
            setSelectedInterviewer(null);
            await fetchBookings();
            setActiveTab('scheduled');
        } catch (err: any) {
            console.error('Error creating booking:', err);
            alert(err.response?.data?.message || 'Không thể đặt lịch');
        }
        setBookingLoading(false);
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Bạn có chắc muốn hủy lịch hẹn này?')) return;

        setActionLoading(bookingId);
        try {
            await api.post(`/bookings/${bookingId}/cancel`, { cancelReason: 'Hủy bởi người dùng' });
            await fetchBookings();
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert('Không thể hủy lịch hẹn');
        }
        setActionLoading(null);
    };

    const handleJoinCall = (booking: Booking) => {
        if (booking.meetingLink) {
            if (booking.meetingLink.includes('/training1v1/call')) {
                router.push(`${booking.meetingLink}&role=interviewee`);
            } else {
                window.open(booking.meetingLink, '_blank');
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // REVIEW HANDLERS
    // ═══════════════════════════════════════════════════════════════
    const handleOpenReview = (booking: Booking) => {
        setBookingToReview(booking);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewDialog(true);
    };

    const handleSubmitReview = async () => {
        if (!bookingToReview || reviewRating === 0) return;

        setReviewLoading(true);
        try {
            await api.post('/reviews', {
                bookingId: bookingToReview.id,
                targetUserId: bookingToReview.mentor.id,
                rating: reviewRating,
                comment: reviewComment || undefined,
            });

            setShowReviewDialog(false);
            setBookingToReview(null);
            await fetchBookings();
        } catch (err) {
            console.error('Error submitting review:', err);
            alert('Không thể gửi đánh giá');
        }
        setReviewLoading(false);
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

    const getNext7Days = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push({
                value: date.toISOString().split('T')[0],
                label: date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
            });
        }
        return days;
    };

    // Filter bookings
    const pendingBookings = bookings.filter(b => b.status === 'PENDING');
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const unreviewedBookings = completedBookings.filter(b => !b.review);

    // ═══════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="p-6 lg:p-8 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Luyện tập 1v1</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Đặt lịch phỏng vấn thử với các interviewer chuyên nghiệp
                    </p>
                </header>

                {/* Tab Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <Button
                        variant={activeTab === 'interviewers' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('interviewers')}
                        className={activeTab === 'interviewers' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Interviewer
                    </Button>
                    <Button
                        variant={activeTab === 'scheduled' ? 'default' : 'outline'}
                        onClick={() => { setActiveTab('scheduled'); fetchBookings(); }}
                        className={activeTab === 'scheduled' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
                    >
                        <ListChecks className="w-4 h-4 mr-2" />
                        Lịch đã đặt
                        {(pendingBookings.length + confirmedBookings.length) > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                {pendingBookings.length + confirmedBookings.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === 'reviews' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('reviews')}
                        className={activeTab === 'reviews' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                    >
                        <Star className="w-4 h-4 mr-2" />
                        Đánh giá
                        {unreviewedBookings.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {unreviewedBookings.length}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Error State */}
                {error && (
                    <Card className="p-8 text-center mb-6">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchInterviewers}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Thử lại
                        </Button>
                    </Card>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: INTERVIEWERS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'interviewers' && !error && (
                    <>
                        {loadingInterviewers ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            </div>
                        ) : interviewers.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Chưa có interviewer nào</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {interviewers.map((interviewer) => (
                                    <Card key={interviewer.id} className="p-5 hover:shadow-lg transition-shadow">
                                        {/* Header with UserProfilePopup */}
                                        <div className="flex items-start gap-4 mb-4">
                                            <UserProfilePopup
                                                userId={interviewer.id}
                                                userName={interviewer.name}
                                                userAvatar={interviewer.avatar}
                                                userTitle={interviewer.interviewerProfile?.title || undefined}
                                            />
                                        </div>

                                        {/* Rating */}
                                        {interviewer.interviewerProfile && (
                                            <div className="flex items-center gap-2 mb-3">
                                                <StarRating rating={interviewer.interviewerProfile.rating || 0} />
                                                <span className="text-sm font-medium">
                                                    {(interviewer.interviewerProfile.rating || 0).toFixed(1)}
                                                </span>
                                                <span className="text-sm text-slate-500">
                                                    ({interviewer.interviewerProfile.totalReviews || 0} đánh giá)
                                                </span>
                                            </div>
                                        )}

                                        {/* Experience */}
                                        {interviewer.interviewerProfile?.experience && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                {interviewer.interviewerProfile.experience} năm kinh nghiệm
                                            </p>
                                        )}

                                        {/* Skills */}
                                        {interviewer.interviewerProfile?.skills && interviewer.interviewerProfile.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {interviewer.interviewerProfile.skills.slice(0, 4).map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded-full"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Hourly Rate */}
                                        {interviewer.interviewerProfile?.hourlyRate && (
                                            <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-4">
                                                {interviewer.interviewerProfile.hourlyRate.toLocaleString('vi-VN')}đ / giờ
                                            </p>
                                        )}

                                        {/* Action Button */}
                                        <Button
                                            className="w-full bg-cyan-500 hover:bg-cyan-600"
                                            onClick={() => handleOpenBooking(interviewer)}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Đặt lịch
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: SCHEDULED */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'scheduled' && (
                    <div className="space-y-8">
                        {loadingBookings ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                            </div>
                        ) : (
                            <>
                                {/* Pending Bookings */}
                                {pendingBookings.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-yellow-500" />
                                            Chờ xác nhận ({pendingBookings.length})
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {pendingBookings.map((booking) => {
                                                const { date, time } = formatDateTime(booking.startTime);
                                                return (
                                                    <Card key={booking.id} className="p-5 border-l-4 border-l-yellow-500">
                                                        <div className="flex items-start gap-4">
                                                            <UserProfilePopup
                                                                userId={booking.mentor.id}
                                                                userName={booking.mentor.name}
                                                                userAvatar={booking.mentor.avatar}
                                                                userTitle={booking.mentor.interviewerProfile?.title || undefined}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {date}
                                                                    <Clock className="w-4 h-4 ml-2" />
                                                                    {time}
                                                                </div>
                                                                <span className="inline-block px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                                                    Chờ interviewer xác nhận
                                                                </span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-3 text-red-500 border-red-200"
                                                                    onClick={() => handleCancelBooking(booking.id)}
                                                                    disabled={actionLoading === booking.id}
                                                                >
                                                                    {actionLoading === booking.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <X className="w-4 h-4 mr-1" /> Hủy
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Confirmed Bookings */}
                                {confirmedBookings.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            Sắp tới ({confirmedBookings.length})
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {confirmedBookings.map((booking) => {
                                                const { date, time } = formatDateTime(booking.startTime);
                                                const canJoin = canJoinCall(booking);
                                                return (
                                                    <Card key={booking.id} className="p-5 border-l-4 border-l-green-500">
                                                        <div className="flex items-start gap-4">
                                                            <UserProfilePopup
                                                                userId={booking.mentor.id}
                                                                userName={booking.mentor.name}
                                                                userAvatar={booking.mentor.avatar}
                                                                userTitle={booking.mentor.interviewerProfile?.title || undefined}
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {date}
                                                                    <Clock className="w-4 h-4 ml-2" />
                                                                    {time}
                                                                </div>
                                                                {booking.note && (
                                                                    <p className="text-sm text-slate-500 italic mb-2">"{booking.note}"</p>
                                                                )}
                                                                <div className="flex gap-2 mt-3">
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
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {pendingBookings.length === 0 && confirmedBookings.length === 0 && (
                                    <Card className="p-8 text-center">
                                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 mb-4">Bạn chưa có lịch hẹn nào</p>
                                        <Button variant="outline" onClick={() => setActiveTab('interviewers')}>
                                            Đặt lịch ngay
                                        </Button>
                                    </Card>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* TAB: REVIEWS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {activeTab === 'reviews' && (
                    <div className="space-y-8">
                        {/* Pending Reviews */}
                        {unreviewedBookings.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                    Chờ đánh giá ({unreviewedBookings.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {unreviewedBookings.map((booking) => {
                                        const { date, time } = formatDateTime(booking.startTime);
                                        return (
                                            <Card key={booking.id} className="p-5 border-l-4 border-l-yellow-500">
                                                <div className="flex items-start gap-4">
                                                    <UserProfilePopup
                                                        userId={booking.mentor.id}
                                                        userName={booking.mentor.name}
                                                        userAvatar={booking.mentor.avatar}
                                                        userTitle={booking.mentor.interviewerProfile?.title || undefined}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                                            <Calendar className="w-4 h-4" />
                                                            {date}
                                                            <Clock className="w-4 h-4 ml-2" />
                                                            {time}
                                                        </div>
                                                        <Button
                                                            className="bg-yellow-500 hover:bg-yellow-600"
                                                            onClick={() => handleOpenReview(booking)}
                                                        >
                                                            <Star className="w-4 h-4 mr-2" />
                                                            Đánh giá ngay
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Reviewed */}
                        {completedBookings.filter(b => b.review).length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    Đã đánh giá
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {completedBookings.filter(b => b.review).map((booking) => {
                                        const { date } = formatDateTime(booking.startTime);
                                        return (
                                            <Card key={booking.id} className="p-5 border-l-4 border-l-green-500">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="w-10 h-10">
                                                        {booking.mentor.avatar && <AvatarImage src={booking.mentor.avatar} />}
                                                        <AvatarFallback className="bg-green-100 text-green-600">
                                                            {booking.mentor.name?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="font-medium">{booking.mentor.name}</p>
                                                        <p className="text-sm text-slate-500 mb-2">{date}</p>
                                                        <div className="flex items-center gap-2">
                                                            <StarRating rating={booking.review?.rating || 0} />
                                                            <span className="text-sm font-medium">{booking.review?.rating}/5</span>
                                                        </div>
                                                        {booking.review?.comment && (
                                                            <p className="text-sm text-slate-600 mt-2 italic">"{booking.review.comment}"</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Empty */}
                        {completedBookings.length === 0 && (
                            <Card className="p-8 text-center">
                                <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Chưa có buổi phỏng vấn nào được hoàn thành</p>
                            </Card>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* BOOKING DIALOG */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Đặt lịch phỏng vấn</DialogTitle>
                        </DialogHeader>

                        {selectedInterviewer && (
                            <div className="space-y-4">
                                {/* Interviewer Info */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Avatar className="w-12 h-12">
                                        {selectedInterviewer.avatar && <AvatarImage src={selectedInterviewer.avatar} />}
                                        <AvatarFallback className="bg-cyan-100 text-cyan-600">
                                            {selectedInterviewer.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedInterviewer.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {selectedInterviewer.interviewerProfile?.title}
                                        </p>
                                    </div>
                                </div>

                                {/* Date Selection */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Chọn ngày</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {getNext7Days().map((day) => (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => setSelectedDate(day.value)}
                                                className={`p-2 text-xs rounded-lg border transition-colors ${selectedDate === day.value
                                                    ? 'bg-cyan-500 text-white border-cyan-500'
                                                    : 'border-slate-200 hover:border-cyan-300'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                {selectedDate && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Chọn giờ</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {DEFAULT_TIME_SLOTS.map((time) => (
                                                <button
                                                    key={time}
                                                    type="button"
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`p-2 text-sm rounded-lg border transition-colors ${selectedTime === time
                                                        ? 'bg-cyan-500 text-white border-cyan-500'
                                                        : 'border-slate-200 hover:border-cyan-300'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Note */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ghi chú (tùy chọn)</label>
                                    <Textarea
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                        placeholder="Ví dụ: Tôi muốn luyện tập phỏng vấn frontend..."
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowBookingDialog(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                                        onClick={handleCreateBooking}
                                        disabled={!selectedDate || !selectedTime || bookingLoading}
                                    >
                                        {bookingLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Xác nhận đặt lịch'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* REVIEW DIALOG */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Đánh giá buổi phỏng vấn</DialogTitle>
                        </DialogHeader>

                        {bookingToReview && (
                            <div className="space-y-6">
                                {/* Interviewer Info */}
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Avatar className="w-12 h-12">
                                        {bookingToReview.mentor.avatar && <AvatarImage src={bookingToReview.mentor.avatar} />}
                                        <AvatarFallback className="bg-cyan-100 text-cyan-600">
                                            {bookingToReview.mentor.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{bookingToReview.mentor.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {formatDateTime(bookingToReview.startTime).date}
                                        </p>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="text-center">
                                    <p className="text-sm font-medium mb-3">Bạn đánh giá buổi phỏng vấn như thế nào?</p>
                                    <div className="flex justify-center">
                                        <InteractiveStarRating rating={reviewRating} onRatingChange={setReviewRating} />
                                    </div>
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nhận xét (tùy chọn)</label>
                                    <Textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Chia sẻ trải nghiệm của bạn..."
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowReviewDialog(false)}
                                    >
                                        Bỏ qua
                                    </Button>
                                    <Button
                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                                        onClick={handleSubmitReview}
                                        disabled={reviewRating === 0 || reviewLoading}
                                    >
                                        {reviewLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Gửi đánh giá'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};
