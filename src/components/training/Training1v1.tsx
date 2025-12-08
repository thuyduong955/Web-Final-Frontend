import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VideoCallInterface } from '@/components/training/VideoCallInterface';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
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
import { Home, Star, Clock, Calendar, Video, CheckCircle, X, Users, ListChecks, MessageSquare } from 'lucide-react';
import { useScheduledSessions, ScheduledSession } from '@/contexts/ScheduledSessionsContext';

interface Interviewer {
    id: string;
    name: string;
    avatar: string;
    role: string;
    company: string;
    rating: number;
    totalReviews: number;
    availableTime: string;
    specialties: string[];
    experience: string;
}

const INTERVIEWERS: Interviewer[] = [
    {
        id: '1',
        name: 'Nguyễn Văn An',
        avatar: '',
        role: 'Senior Software Engineer',
        company: 'Google',
        rating: 4.9,
        totalReviews: 128,
        availableTime: '9:00 - 12:00, 14:00 - 18:00',
        specialties: ['Frontend', 'React', 'System Design'],
        experience: '8 năm kinh nghiệm',
    },
    {
        id: '2',
        name: 'Trần Thị Bình',
        avatar: '',
        role: 'Engineering Manager',
        company: 'Microsoft',
        rating: 4.8,
        totalReviews: 95,
        availableTime: '10:00 - 12:00, 15:00 - 17:00',
        specialties: ['Backend', 'Java', 'Leadership'],
        experience: '10 năm kinh nghiệm',
    },
    {
        id: '3',
        name: 'Lê Minh Cường',
        avatar: '',
        role: 'Tech Lead',
        company: 'VNG Corporation',
        rating: 4.7,
        totalReviews: 76,
        availableTime: '8:00 - 11:00, 13:00 - 16:00',
        specialties: ['Full-stack', 'Node.js', 'AWS'],
        experience: '6 năm kinh nghiệm',
    },
    {
        id: '4',
        name: 'Phạm Hoàng Dũng',
        avatar: '',
        role: 'Principal Engineer',
        company: 'Shopee',
        rating: 4.9,
        totalReviews: 152,
        availableTime: '9:00 - 11:00, 14:00 - 17:00',
        specialties: ['Algorithms', 'Data Structures', 'System Design'],
        experience: '12 năm kinh nghiệm',
    },
    {
        id: '5',
        name: 'Hoàng Thị Mai',
        avatar: '',
        role: 'Senior Product Manager',
        company: 'Grab',
        rating: 4.6,
        totalReviews: 64,
        availableTime: '10:00 - 12:00, 14:00 - 16:00',
        specialties: ['Product Sense', 'Strategy', 'Communication'],
        experience: '7 năm kinh nghiệm',
    },
];

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-4 h-4 ${
                        star <= Math.floor(rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : star - 0.5 <= rating
                            ? 'text-yellow-400 fill-yellow-400/50'
                            : 'text-gray-300 dark:text-gray-600'
                    }`}
                />
            ))}
        </div>
    );
};

// Interactive star rating for reviews
const InteractiveStarRating = ({ 
    rating, 
    onRatingChange,
    size = 'md'
}: { 
    rating: number; 
    onRatingChange: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
}) => {
    const [hoverRating, setHoverRating] = useState(0);
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-10 h-10',
    };
    
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star
                        className={`${sizeClasses[size]} transition-colors ${
                            star <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
};

export const Training1v1: React.FC = () => {
    const [activeCall, setActiveCall] = useState<{ roomId: string; partnerId: string } | null>(null);
    const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');
    const [activeTab, setActiveTab] = useState<'interviewers' | 'scheduled' | 'reviews'>('interviewers');
    
    // Review states
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [sessionToReview, setSessionToReview] = useState<ScheduledSession | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [showReviewPrompt, setShowReviewPrompt] = useState(false);
    
    const { sessions: scheduledSessions, addSession, cancelSession, addReview, getUnreviewedCompletedSessions } = useScheduledSessions();
    const router = useRouter();

    const handleOpenReview = (session: ScheduledSession) => {
        setSessionToReview(session);
        setReviewRating(0);
        setReviewComment('');
        setShowReviewDialog(true);
        setShowReviewPrompt(false);
    };

    const handleSubmitReview = () => {
        if (sessionToReview && reviewRating > 0) {
            addReview(sessionToReview.id, {
                rating: reviewRating,
                comment: reviewComment,
            });
            setShowReviewDialog(false);
            setSessionToReview(null);
            setReviewRating(0);
            setReviewComment('');
        }
    };

    const handleSkipReview = () => {
        setShowReviewPrompt(false);
        // Check if there are more unreviewed sessions
        const unreviewedSessions = getUnreviewedCompletedSessions();
        if (unreviewedSessions.length > 1) {
            setSessionToReview(unreviewedSessions[1]);
        } else {
            setSessionToReview(null);
        }
    };

    const handleOpenSchedule = (interviewer: Interviewer) => {
        setSelectedInterviewer(interviewer);
        setSelectedDate('');
        setSelectedTime('');
        setNote('');
        setShowScheduleDialog(true);
    };

    const handleConfirmSchedule = () => {
        if (!selectedDate || !selectedTime) {
            return;
        }
        setShowScheduleDialog(false);
        setShowConfirmDialog(true);
    };

    const handleFinalConfirm = () => {
        setShowConfirmDialog(false);
        // Add new session to the context
        if (selectedInterviewer && selectedDate && selectedTime) {
            addSession({
                interviewerId: selectedInterviewer.id,
                interviewerName: selectedInterviewer.name,
                interviewerRole: selectedInterviewer.role,
                interviewerCompany: selectedInterviewer.company,
                date: selectedDate,
                time: selectedTime,
                note: note || undefined,
                status: 'upcoming',
            });
        }
        setSelectedInterviewer(null);
        // Switch to scheduled tab to show the new session
        setActiveTab('scheduled');
    };

    const handleCancelSession = (sessionId: string) => {
        cancelSession(sessionId);
    };

    const handleJoinCall = (session: ScheduledSession) => {
        router.push(`/interview/video-call?id=${session.id}&interviewer=${encodeURIComponent(session.interviewerName)}`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleEndCall = () => {
        setActiveCall(null);
        setSelectedInterviewer(null);
    };

    // Parse available time string to get time slots
    // Format: "9:00 - 12:00, 14:00 - 18:00"
    const parseAvailableTime = (availableTime: string): string[] => {
        const slots: string[] = [];
        const ranges = availableTime.split(',').map(r => r.trim());
        
        for (const range of ranges) {
            const [start, end] = range.split('-').map(t => t.trim());
            if (!start || !end) continue;
            
            const startHour = parseInt(start.split(':')[0]);
            const startMin = parseInt(start.split(':')[1] || '0');
            const endHour = parseInt(end.split(':')[0]);
            const endMin = parseInt(end.split(':')[1] || '0');
            
            let currentHour = startHour;
            let currentMin = startMin;
            
            while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
                const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
                slots.push(timeStr);
                
                currentMin += 30;
                if (currentMin >= 60) {
                    currentMin = 0;
                    currentHour += 1;
                }
            }
        }
        
        return slots;
    };

    // Get available time slots for selected interviewer
    const availableTimeSlots = selectedInterviewer 
        ? parseAvailableTime(selectedInterviewer.availableTime) 
        : [];

    return (
        <div className="p-8 h-full">
            {activeCall ? (
                <VideoCallInterface
                    roomId={activeCall.roomId}
                    partnerId={activeCall.partnerId}
                    onEndCall={handleEndCall}
                />
            ) : (
                <div className="max-w-6xl mx-auto">
                    <header className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Luyện tập 1v1</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Chọn một interviewer để bắt đầu buổi phỏng vấn thử hoặc xem các buổi đã đặt lịch.
                        </p>
                    </header>

                    {/* Tab Buttons */}
                    <div className="flex gap-4 mb-8">
                        <Button
                            variant={activeTab === 'interviewers' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('interviewers')}
                            className={`flex items-center gap-2 px-6 py-3 ${
                                activeTab === 'interviewers' 
                                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                                    : ''
                            }`}
                        >
                            <Users className="w-5 h-5" />
                            Danh sách Interviewer
                        </Button>
                        <Button
                            variant={activeTab === 'scheduled' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('scheduled')}
                            className={`flex items-center gap-2 px-6 py-3 ${
                                activeTab === 'scheduled' 
                                    ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
                                    : ''
                            }`}
                        >
                            <ListChecks className="w-5 h-5" />
                            Lịch đã đặt
                            {scheduledSessions.filter(s => s.status === 'upcoming').length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                                    {scheduledSessions.filter(s => s.status === 'upcoming').length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant={activeTab === 'reviews' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('reviews')}
                            className={`flex items-center gap-2 px-6 py-3 ${
                                activeTab === 'reviews' 
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                    : ''
                            }`}
                        >
                            <Star className="w-5 h-5" />
                            Đánh giá
                            {getUnreviewedCompletedSessions().length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                    {getUnreviewedCompletedSessions().length}
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'interviewers' ? (
                        /* Interviewer List */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {INTERVIEWERS.map((interviewer) => (
                            <Card
                                key={interviewer.id}
                                className="p-5 hover:shadow-lg transition-all duration-200 hover:border-cyan-300 dark:hover:border-cyan-600"
                            >
                                {/* Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <Avatar className="w-14 h-14 border-2 border-cyan-100 dark:border-cyan-800">
                                        {interviewer.avatar && <AvatarImage src={interviewer.avatar} />}
                                        <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold text-lg">
                                            {interviewer.name.split(' ').pop()?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                                            {interviewer.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                            {interviewer.role}
                                        </p>
                                        <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">
                                            {interviewer.company}
                                        </p>
                                    </div>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <StarRating rating={interviewer.rating} />
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {interviewer.rating}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        ({interviewer.totalReviews} đánh giá)
                                    </span>
                                </div>

                                {/* Experience */}
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                    {interviewer.experience}
                                </p>

                                {/* Specialties */}
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {interviewer.specialties.map((specialty) => (
                                        <span
                                            key={specialty}
                                            className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full"
                                        >
                                            {specialty}
                                        </span>
                                    ))}
                                </div>

                                {/* Available Time */}
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                    <Clock className="w-4 h-4 text-green-500" />
                                    <span>Thời gian nhận phỏng vấn:</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-4">
                                    <Calendar className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                    <span>{interviewer.availableTime}</span>
                                </div>

                                {/* Action Button */}
                                <Button
                                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                                    onClick={() => handleOpenSchedule(interviewer)}
                                >
                                    <Calendar className="w-4 h-4 mr-2 text-white" />
                                    Đặt lịch phỏng vấn
                                </Button>
                            </Card>
                        ))}
                    </div>
                    ) : activeTab === 'scheduled' ? (
                        /* Scheduled Sessions List */
                        <div className="space-y-6">
                            {/* Upcoming Sessions */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-500" />
                                    Buổi phỏng vấn sắp tới
                                </h2>
                                {scheduledSessions.filter(s => s.status === 'upcoming').length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduledSessions
                                            .filter(s => s.status === 'upcoming')
                                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                            .map((session) => (
                                                <Card key={session.id} className="p-5 border-l-4 border-l-cyan-500">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                                                {session.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                                {session.interviewerName}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {session.interviewerRole} - {session.interviewerCompany}
                                                            </p>
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
                                        <p className="text-slate-500 dark:text-slate-400 mb-4">
                                            Bạn chưa có buổi phỏng vấn nào sắp tới
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveTab('interviewers')}
                                        >
                                            Đặt lịch ngay
                                        </Button>
                                    </Card>
                                )}
                            </div>

                            {/* Completed Sessions */}
                            {scheduledSessions.filter(s => s.status === 'completed').length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Đã hoàn thành
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduledSessions
                                            .filter(s => s.status === 'completed')
                                            .map((session) => (
                                                <Card key={session.id} className="p-5 border-l-4 border-l-green-500">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 font-bold">
                                                                {session.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                                {session.interviewerName}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {session.interviewerRole} - {session.interviewerCompany}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {formatDate(session.date)}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                    <Clock className="w-4 h-4" />
                                                                    {session.time}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Review Section */}
                                                            {session.review ? (
                                                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <StarRating rating={session.review.rating} />
                                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                            {session.review.rating}/5
                                                                        </span>
                                                                    </div>
                                                                    {session.review.comment && (
                                                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                                                            &ldquo;{session.review.comment}&rdquo;
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mt-3 text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/20"
                                                                    onClick={() => handleOpenReview(session)}
                                                                >
                                                                    <Star className="w-4 h-4 mr-2" />
                                                                    Đánh giá buổi phỏng vấn
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Cancelled Sessions */}
                            {scheduledSessions.filter(s => s.status === 'cancelled').length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <X className="w-5 h-5 text-red-500" />
                                        Đã hủy
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduledSessions
                                            .filter(s => s.status === 'cancelled')
                                            .map((session) => (
                                                <Card key={session.id} className="p-5 border-l-4 border-l-red-400 opacity-60">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-slate-400 font-bold">
                                                                {session.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-500 dark:text-slate-400 line-through">
                                                                {session.interviewerName}
                                                            </h3>
                                                            <p className="text-sm text-slate-400 dark:text-slate-500">
                                                                {session.interviewerRole} - {session.interviewerCompany}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {formatDate(session.date)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {session.time}
                                                                </span>
                                                            </div>
                                                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full">
                                                                Đã hủy
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Expired Sessions */}
                            {scheduledSessions.filter(s => s.status === 'expired').length > 0 && (
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        Đã hết hạn
                                        <span className="px-2 py-0.5 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                            {scheduledSessions.filter(s => s.status === 'expired').length}
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduledSessions
                                            .filter(s => s.status === 'expired')
                                            .map((session) => (
                                                <Card key={session.id} className="p-5 border-l-4 border-l-orange-400 opacity-70">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 font-bold">
                                                                {session.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                                                                {session.interviewerName}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {session.interviewerRole} - {session.interviewerCompany}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {formatDate(session.date)}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {session.time}
                                                                </span>
                                                            </div>
                                                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                                                Đã hết hạn - Không tham gia
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'reviews' ? (
                        /* Reviews Tab */
                        <div className="space-y-8">
                            {/* Pending Reviews */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-yellow-500" />
                                    Chờ đánh giá
                                    {getUnreviewedCompletedSessions().length > 0 && (
                                        <span className="px-2 py-0.5 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full">
                                            {getUnreviewedCompletedSessions().length}
                                        </span>
                                    )}
                                </h2>
                                {getUnreviewedCompletedSessions().length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getUnreviewedCompletedSessions().map((session) => (
                                            <Card key={session.id} className="p-5 border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="w-12 h-12">
                                                        <AvatarFallback className="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 font-bold">
                                                            {session.interviewerName.split(' ').pop()?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                                            {session.interviewerName}
                                                        </h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                                            {session.interviewerRole} - {session.interviewerCompany}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(session.date)}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                <Clock className="w-4 h-4" />
                                                                {session.time}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white"
                                                            onClick={() => handleOpenReview(session)}
                                                        >
                                                            <Star className="w-4 h-4 mr-2" />
                                                            Đánh giá ngay
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Card className="p-8 text-center bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                        <p className="text-green-700 dark:text-green-400 font-medium">
                                            Bạn đã đánh giá tất cả các buổi phỏng vấn!
                                        </p>
                                    </Card>
                                )}
                            </div>

                            {/* Reviewed Sessions */}
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    Đã đánh giá
                                </h2>
                                {scheduledSessions.filter(s => s.status === 'completed' && s.review).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {scheduledSessions
                                            .filter(s => s.status === 'completed' && s.review)
                                            .sort((a, b) => {
                                                const dateA = new Date(a.review?.createdAt || 0);
                                                const dateB = new Date(b.review?.createdAt || 0);
                                                return dateB.getTime() - dateA.getTime();
                                            })
                                            .map((session) => (
                                                <Card key={session.id} className="p-5 border-l-4 border-l-green-500">
                                                    <div className="flex items-start gap-4">
                                                        <Avatar className="w-12 h-12">
                                                            <AvatarFallback className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 font-bold">
                                                                {session.interviewerName.split(' ').pop()?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                                {session.interviewerName}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                {session.interviewerRole} - {session.interviewerCompany}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {formatDate(session.date)}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Review Display */}
                                                            {session.review && (
                                                                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <StarRating rating={session.review.rating} />
                                                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                            {session.review.rating}/5
                                                                        </span>
                                                                    </div>
                                                                    {session.review.comment && (
                                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                            &ldquo;{session.review.comment}&rdquo;
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                                        Đánh giá lúc: {new Date(session.review.createdAt).toLocaleDateString('vi-VN', { 
                                                                            year: 'numeric', 
                                                                            month: 'long', 
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                    </div>
                                ) : (
                                    <Card className="p-8 text-center">
                                        <Star className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400">
                                            Chưa có đánh giá nào
                                        </p>
                                    </Card>
                                )}
                            </div>

                            {/* Review Stats */}
                            {scheduledSessions.filter(s => s.review).length > 0 && (
                                <Card className="p-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Thống kê đánh giá</h3>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                                                {scheduledSessions.filter(s => s.review).length}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Tổng đánh giá</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                                {(scheduledSessions
                                                    .filter(s => s.review)
                                                    .reduce((acc, s) => acc + (s.review?.rating || 0), 0) / 
                                                    scheduledSessions.filter(s => s.review).length
                                                ).toFixed(1)}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Điểm trung bình</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                {scheduledSessions.filter(s => s.review && s.review.rating >= 4).length}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Đánh giá tốt (4-5⭐)</p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {/* Schedule Dialog */}
            <AlertDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                    {selectedInterviewer?.name.split(' ').pop()?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-lg font-semibold">Đặt lịch với {selectedInterviewer?.name}</p>
                                <p className="text-sm font-normal text-slate-500 dark:text-slate-400">
                                    {selectedInterviewer?.role} tại {selectedInterviewer?.company}
                                </p>
                            </div>
                        </AlertDialogTitle>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Chọn ngày
                                </label>
                                <DateInput
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Chọn giờ
                                </label>
                                {availableTimeSlots.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                        {availableTimeSlots.map((time) => (
                                            <button
                                                key={time}
                                                type="button"
                                                onClick={() => setSelectedTime(time)}
                                                className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all duration-200 ${
                                                    selectedTime === time
                                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Không có khung giờ khả dụng
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Ghi chú (không bắt buộc)
                                </label>
                                <Input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="VD: Muốn tập trung vào System Design..."
                                    className="w-full"
                                />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm">
                                <p className="text-slate-600 dark:text-slate-300">
                                    <span className="font-medium">Thời gian nhận phỏng vấn:</span> {selectedInterviewer?.availableTime}
                                </p>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowScheduleDialog(false)}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSchedule}
                            disabled={!selectedDate || !selectedTime}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
                        >
                            Tiếp tục
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-6 h-6" />
                            Xác nhận đặt lịch
                        </AlertDialogTitle>
                        <div className="space-y-4 pt-4">
                            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                            {selectedInterviewer?.name.split(' ').pop()?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">{selectedInterviewer?.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedInterviewer?.role}</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-600 pt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Calendar className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                                        <span className="font-medium">Ngày:</span>
                                        <span>{selectedDate ? new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Clock className="w-4 h-4 text-cyan-500" />
                                        <span className="font-medium">Giờ:</span>
                                        <span>{selectedTime}</span>
                                    </div>
                                    {note && (
                                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                            <span className="font-medium">Ghi chú:</span>
                                            <span>{note}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Bạn sẽ nhận được email xác nhận và nhắc nhở trước buổi phỏng vấn.
                            </p>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowConfirmDialog(false);
                            setShowScheduleDialog(true);
                        }}>
                            Quay lại
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleFinalConfirm}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Xác nhận đặt lịch
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Review Prompt Dialog */}
            <AlertDialog open={showReviewPrompt} onOpenChange={setShowReviewPrompt}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <Star className="w-6 h-6 fill-yellow-400" />
                            Đánh giá buổi phỏng vấn
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có một buổi phỏng vấn chưa được đánh giá. Hãy chia sẻ trải nghiệm của bạn!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {sessionToReview && (
                        <div className="py-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                        {sessionToReview.interviewerName.split(' ').pop()?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {sessionToReview.interviewerName}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {sessionToReview.interviewerRole} - {formatDate(sessionToReview.date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleSkipReview}>
                            Để sau
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => sessionToReview && handleOpenReview(sessionToReview)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        >
                            <Star className="w-4 h-4 mr-2" />
                            Đánh giá ngay
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Review Dialog */}
            <AlertDialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-cyan-500" />
                            Đánh giá Interviewer
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    {sessionToReview && (
                        <div className="space-y-6 py-4">
                            {/* Interviewer Info */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <Avatar className="w-14 h-14">
                                    <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold text-lg">
                                        {sessionToReview.interviewerName.split(' ').pop()?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                        {sessionToReview.interviewerName}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {sessionToReview.interviewerRole}
                                    </p>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        {sessionToReview.interviewerCompany}
                                    </p>
                                </div>
                            </div>

                            {/* Star Rating */}
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Bạn đánh giá buổi phỏng vấn như thế nào?
                                </p>
                                <div className="flex justify-center">
                                    <InteractiveStarRating
                                        rating={reviewRating}
                                        onRatingChange={setReviewRating}
                                        size="lg"
                                    />
                                </div>
                                {reviewRating > 0 && (
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {reviewRating === 1 && 'Rất không hài lòng'}
                                        {reviewRating === 2 && 'Không hài lòng'}
                                        {reviewRating === 3 && 'Bình thường'}
                                        {reviewRating === 4 && 'Hài lòng'}
                                        {reviewRating === 5 && 'Rất hài lòng'}
                                    </p>
                                )}
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nhận xét của bạn (không bắt buộc)
                                </label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Chia sẻ trải nghiệm của bạn về buổi phỏng vấn..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                />
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowReviewDialog(false);
                            setReviewRating(0);
                            setReviewComment('');
                        }}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSubmitReview}
                            disabled={reviewRating === 0}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Gửi đánh giá
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
