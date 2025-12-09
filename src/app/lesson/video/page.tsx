"use client";

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    SkipBack,
    SkipForward,
    Star,
    Clock,
    Users,
    ChevronDown,
    ChevronUp,
    FileText,
    Download
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

// Mock data - sẽ được thay bằng API call
const MOCK_CONTENT = {
    id: 'qs-1',
    title: 'Phỏng vấn Frontend Developer (ReactJS)',
    description: `Bộ câu hỏi phỏng vấn phổ biến cho vị trí Frontend Developer với ReactJS.

Nội dung bao gồm:
• Các câu hỏi về React hooks và lifecycle
• System Design cho ứng dụng frontend
• Performance optimization
• Best practices và design patterns`,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    fileUrl: '/sample-questions.pdf', // File đính kèm
    duration: 45, // minutes
    difficulty: 'MEDIUM',
    category: 'Frontend',
    tags: ['React', 'JavaScript', 'Interview'],
    viewCount: 15420,
    rating: 4.5,
    reviewCount: 128,
    author: {
        id: 'u-1',
        name: 'Nguyễn Văn Mentor',
        avatar: '',
        title: 'Senior Software Engineer',
        company: 'Google'
    },
    chapters: [
        { time: 0, title: 'Giới thiệu' },
        { time: 150, title: 'React Hooks cơ bản' },
        { time: 615, title: 'useState và useEffect' },
        { time: 1080, title: 'Custom Hooks' },
        { time: 1530, title: 'Performance Optimization' },
        { time: 2100, title: 'System Design' },
        { time: 2520, title: 'Tips phỏng vấn' },
    ]
};

interface ChapterItem {
    time: number;
    title: string;
}

function LessonVideoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Get content ID and video URL from query params
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const videoUrlParam = searchParams.get('videoUrl'); // Real R2 video URL

    // Content state - will be populated from API or use mock as fallback
    const [content, setContent] = useState(MOCK_CONTENT);
    const [isLoading, setIsLoading] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showDescription, setShowDescription] = useState(false);

    // Review form state
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Fetch content by ID when available or use params
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                if (lessonId) {
                    // Try to fetch from API
                    const { default: api } = await import('@/services/api');
                    try {
                        const { data } = await api.get(`/library/${lessonId}`);
                        if (data) {
                            setContent({
                                ...MOCK_CONTENT,
                                id: data.id,
                                title: data.title || topic || MOCK_CONTENT.title,
                                description: data.description || MOCK_CONTENT.description,
                                videoUrl: videoUrlParam || data.videoUrl || MOCK_CONTENT.videoUrl,
                                fileUrl: data.fileUrls?.[0] || MOCK_CONTENT.fileUrl,
                                duration: data.duration || MOCK_CONTENT.duration,
                                rating: data.averageRating || MOCK_CONTENT.rating,
                                reviewCount: data.totalReviews || MOCK_CONTENT.reviewCount,
                                viewCount: data.views || MOCK_CONTENT.viewCount,
                            });
                            return;
                        }
                    } catch {
                        console.log('API fetch failed, using params');
                    }
                }

                // Use params for title and video URL if API fails
                setContent(prev => ({
                    ...prev,
                    title: topic ? decodeURIComponent(topic) : prev.title,
                    id: lessonId || prev.id,
                    videoUrl: videoUrlParam || prev.videoUrl,
                }));
            } catch (error) {
                console.error('Failed to fetch content:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [lessonId, topic, videoUrlParam]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);
        const handleEnded = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('ended', handleEnded);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const seekToChapter = (time: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = time;
        setCurrentTime(time);
        if (!isPlaying) {
            video.play();
            setIsPlaying(true);
        }
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            video.requestFullscreen();
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSubmitReview = async () => {
        if (userRating === 0) return;

        setIsSubmittingReview(true);
        // TODO: Call API to submit review
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmittingReview(false);
        alert('Cảm ơn bạn đã đánh giá!');
    };

    const renderStars = (rating: number, interactive = false) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => interactive && setUserRating(star)}
                        disabled={!interactive}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                        <Star
                            className={`w-5 h-5 ${star <= (interactive ? userRating : rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {content.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {content.viewCount.toLocaleString()} lượt xem
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {content.duration} phút
                                </span>
                                <span className="flex items-center gap-1">
                                    {renderStars(content.rating)}
                                    <span className="ml-1">{content.rating}</span>
                                    <span className="text-slate-400">({content.reviewCount})</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Video Player */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video group mb-6">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-contain"
                            src={content.videoUrl}
                            onClick={togglePlay}
                        />

                        {/* Controls Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isPlaying && (
                                <button
                                    onClick={togglePlay}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                                    </div>
                                </button>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <input
                                    type="range"
                                    min={0}
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1 mb-3 appearance-none bg-white/30 rounded-full cursor-pointer"
                                />

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button onClick={togglePlay} className="text-white hover:text-cyan-400">
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                                        </button>
                                        <button onClick={() => skip(-10)} className="text-white hover:text-cyan-400">
                                            <SkipBack className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => skip(10)} className="text-white hover:text-cyan-400">
                                            <SkipForward className="w-5 h-5" />
                                        </button>
                                        <button onClick={toggleMute} className="text-white hover:text-cyan-400">
                                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                        <span className="text-white text-sm">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>
                                    <button onClick={toggleFullscreen} className="text-white hover:text-cyan-400">
                                        <Maximize className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Author */}
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 font-bold">
                                        {content.author.name.split(' ').pop()?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {content.author.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {content.author.title} @ {content.author.company}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Mô tả</h3>
                                <div className={`text-slate-600 dark:text-slate-300 whitespace-pre-line ${!showDescription ? 'line-clamp-3' : ''}`}>
                                    {content.description}
                                </div>
                                <button
                                    onClick={() => setShowDescription(!showDescription)}
                                    className="mt-2 text-sm font-medium text-cyan-500 hover:text-cyan-600 flex items-center gap-1"
                                >
                                    {showDescription ? <>Thu gọn <ChevronUp className="w-4 h-4" /></> : <>Xem thêm <ChevronDown className="w-4 h-4" /></>}
                                </button>
                            </div>

                            {/* Download File */}
                            {content.fileUrl && (
                                <a
                                    href={content.fileUrl}
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    download
                                >
                                    <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 dark:text-white">Tài liệu đính kèm</p>
                                        <p className="text-sm text-slate-500">Tải xuống bộ câu hỏi (PDF)</p>
                                    </div>
                                    <Download className="w-5 h-5 text-slate-400" />
                                </a>
                            )}

                            {/* Rating & Review */}
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Đánh giá của bạn</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    {renderStars(userRating, true)}
                                    {userRating > 0 && (
                                        <span className="text-sm text-slate-500">
                                            {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][userRating]}
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    placeholder="Chia sẻ cảm nhận của bạn về nội dung này..."
                                    value={userReview}
                                    onChange={(e) => setUserReview(e.target.value)}
                                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent resize-none focus:ring-2 focus:ring-cyan-500 outline-none"
                                    rows={3}
                                />
                                <Button
                                    onClick={handleSubmitReview}
                                    disabled={userRating === 0 || isSubmittingReview}
                                    className="mt-3 bg-cyan-500 hover:bg-cyan-600"
                                >
                                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                </Button>
                            </div>
                        </div>

                        {/* Right Column - Chapters */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 h-fit">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Nội dung bài học</h3>
                            <div className="space-y-2">
                                {content.chapters.map((chapter, index) => (
                                    <button
                                        key={index}
                                        onClick={() => seekToChapter(chapter.time)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${currentTime >= chapter.time && (index === content.chapters.length - 1 || currentTime < content.chapters[index + 1].time)
                                            ? 'bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <span className="text-cyan-500 font-mono text-sm w-12 shrink-0">
                                            {formatTime(chapter.time)}
                                        </span>
                                        <span className="text-slate-700 dark:text-slate-300 text-sm">
                                            {chapter.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default function LessonVideoPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MainLayout>
        }>
            <LessonVideoContent />
        </Suspense>
    );
}
