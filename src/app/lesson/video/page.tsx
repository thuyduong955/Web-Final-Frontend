"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    ThumbsUp,
    ThumbsDown,
    Share2,
    BookmarkPlus,
    MessageSquare,
    Star,
    Clock,
    Users,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface VideoComment {
    id: string;
    userName: string;
    userAvatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    replies?: VideoComment[];
}

// Mock video data
const MOCK_VIDEO_DATA = {
    title: 'Phỏng vấn Frontend Developer (ReactJS)',
    description: `Trong video này, chúng ta sẽ đi qua các câu hỏi phỏng vấn phổ biến nhất cho vị trí Frontend Developer, đặc biệt là với ReactJS.

Nội dung video bao gồm:
• Các câu hỏi về React hooks và lifecycle
• System Design cho ứng dụng frontend
• Câu hỏi về performance optimization
• Best practices và design patterns
• Tips để trả lời tự tin và chuyên nghiệp

Video này phù hợp cho các bạn đang chuẩn bị phỏng vấn vào các công ty công nghệ lớn.`,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // Demo video
    duration: '45:30',
    views: 15420,
    likes: 1230,
    dislikes: 23,
    uploadDate: '2025-11-15',
    instructor: {
        name: 'Nguyễn Văn Mentor',
        avatar: '',
        subscribers: 12500,
        description: 'Senior Software Engineer với 10+ năm kinh nghiệm tại các công ty công nghệ hàng đầu.'
    },
    chapters: [
        { time: '0:00', title: 'Giới thiệu' },
        { time: '2:30', title: 'React Hooks cơ bản' },
        { time: '10:15', title: 'useState và useEffect deep dive' },
        { time: '18:00', title: 'Custom Hooks' },
        { time: '25:30', title: 'Performance Optimization' },
        { time: '35:00', title: 'System Design' },
        { time: '42:00', title: 'Tips phỏng vấn' },
    ]
};

const MOCK_COMMENTS: VideoComment[] = [
    {
        id: 'c1',
        userName: 'Trần Văn A',
        content: 'Video rất hay và chi tiết! Mình đã apply thành công nhờ những tips trong video này. Cảm ơn anh rất nhiều!',
        timestamp: '2 ngày trước',
        likes: 45,
    },
    {
        id: 'c2',
        userName: 'Lê Thị B',
        content: 'Phần System Design giải thích rất dễ hiểu. Anh có thể làm thêm video về microservices không ạ?',
        timestamp: '1 tuần trước',
        likes: 32,
    },
    {
        id: 'c3',
        userName: 'Phạm Hoàng C',
        content: 'Chất lượng video tuyệt vời, nội dung súc tích và đầy đủ.',
        timestamp: '2 tuần trước',
        likes: 28,
    },
    {
        id: 'c4',
        userName: 'Ngô Thị D',
        content: 'Đã subscribe và bật chuông! Mong anh ra thêm nhiều video hữu ích như này.',
        timestamp: '3 tuần trước',
        likes: 19,
    },
];

const RELATED_VIDEOS = [
    {
        id: 'rv1',
        title: 'Backend Developer Interview - Node.js & Express',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=170&fit=crop',
        duration: '38:20',
        views: 8500,
        instructor: 'Tech Interview Pro',
    },
    {
        id: 'rv2',
        title: 'Behavioral Interview Questions - STAR Method',
        thumbnail: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=170&fit=crop',
        duration: '25:45',
        views: 12300,
        instructor: 'Career Coach',
    },
    {
        id: 'rv3',
        title: 'Data Structures & Algorithms for Interviews',
        thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=300&h=170&fit=crop',
        duration: '1:02:30',
        views: 25600,
        instructor: 'Coding Master',
    },
];

export default function LessonVideoPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const topic = searchParams.get('topic') || MOCK_VIDEO_DATA.title;
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showDescription, setShowDescription] = useState(false);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => setDuration(video.duration);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
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

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
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

    const handleLike = () => {
        if (disliked) setDisliked(false);
        setLiked(!liked);
    };

    const handleDislike = () => {
        if (liked) setLiked(false);
        setDisliked(!disliked);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                        {topic}
                    </h1>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Video Player */}
                        <div className="relative bg-black rounded-xl overflow-hidden aspect-video group">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-contain"
                                src={MOCK_VIDEO_DATA.videoUrl}
                                onClick={togglePlay}
                            />

                            {/* Video Controls Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Center Play Button */}
                                {!isPlaying && (
                                    <button
                                        onClick={togglePlay}
                                        className="absolute inset-0 flex items-center justify-center"
                                    >
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                            <Play className="w-10 h-10 text-white fill-white ml-1" />
                                        </div>
                                    </button>
                                )}

                                {/* Bottom Controls */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    {/* Progress Bar */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-1 mb-3 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                                    />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                                            </button>
                                            <button onClick={() => skip(-10)} className="text-white hover:text-cyan-400 transition-colors">
                                                <SkipBack className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => skip(10)} className="text-white hover:text-cyan-400 transition-colors">
                                                <SkipForward className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center gap-2 group/volume">
                                                <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition-colors">
                                                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={1}
                                                    step={0.1}
                                                    value={isMuted ? 0 : volume}
                                                    onChange={handleVolumeChange}
                                                    className="w-0 group-hover/volume:w-20 transition-all duration-200 h-1 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                                />
                                            </div>

                                            <span className="text-white text-sm">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <button onClick={toggleFullscreen} className="text-white hover:text-cyan-400 transition-colors">
                                            <Maximize className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Video Info */}
                        <div className="mt-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                {MOCK_VIDEO_DATA.title}
                            </h2>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                                <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {MOCK_VIDEO_DATA.views.toLocaleString()} lượt xem
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {new Date(MOCK_VIDEO_DATA.uploadDate).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <Button
                                    variant={liked ? "default" : "outline"}
                                    size="sm"
                                    onClick={handleLike}
                                    className={liked ? "bg-cyan-500 hover:bg-cyan-600" : ""}
                                >
                                    <ThumbsUp className={`w-4 h-4 mr-1 ${liked ? 'fill-white' : ''}`} />
                                    {MOCK_VIDEO_DATA.likes + (liked ? 1 : 0)}
                                </Button>
                                <Button
                                    variant={disliked ? "default" : "outline"}
                                    size="sm"
                                    onClick={handleDislike}
                                    className={disliked ? "bg-slate-500 hover:bg-slate-600" : ""}
                                >
                                    <ThumbsDown className={`w-4 h-4 mr-1 ${disliked ? 'fill-white' : ''}`} />
                                    {MOCK_VIDEO_DATA.dislikes + (disliked ? 1 : 0)}
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Share2 className="w-4 h-4 mr-1" />
                                    Chia sẻ
                                </Button>
                                <Button
                                    variant={saved ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSaved(!saved)}
                                    className={saved ? "bg-amber-500 hover:bg-amber-600" : ""}
                                >
                                    <BookmarkPlus className={`w-4 h-4 mr-1 ${saved ? 'fill-white' : ''}`} />
                                    {saved ? 'Đã lưu' : 'Lưu'}
                                </Button>
                            </div>

                            {/* Instructor Info */}
                            <div className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-700">
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold">
                                        {MOCK_VIDEO_DATA.instructor.name.split(' ').pop()?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {MOCK_VIDEO_DATA.instructor.name}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {MOCK_VIDEO_DATA.instructor.subscribers.toLocaleString()} người đăng ký
                                    </p>
                                </div>
                                <Button className="bg-cyan-500 hover:bg-cyan-600">
                                    Đăng ký
                                </Button>
                            </div>

                            {/* Description */}
                            <div className="py-4 bg-slate-100 dark:bg-slate-800 rounded-xl mt-4 px-4">
                                <div className={`text-slate-700 dark:text-slate-300 whitespace-pre-line ${!showDescription ? 'line-clamp-3' : ''}`}>
                                    {MOCK_VIDEO_DATA.description}
                                </div>
                                <button
                                    onClick={() => setShowDescription(!showDescription)}
                                    className="mt-2 text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1 hover:text-cyan-500"
                                >
                                    {showDescription ? (
                                        <>Thu gọn <ChevronUp className="w-4 h-4" /></>
                                    ) : (
                                        <>Xem thêm <ChevronDown className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>

                            {/* Chapters */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Nội dung bài học
                                </h3>
                                <div className="space-y-2">
                                    {MOCK_VIDEO_DATA.chapters.map((chapter, index) => (
                                        <button
                                            key={index}
                                            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-slate-700 transition-colors text-left border border-slate-200 dark:border-slate-700"
                                        >
                                            <span className="text-cyan-500 font-mono text-sm w-12">
                                                {chapter.time}
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {chapter.title}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comments Section */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    {MOCK_COMMENTS.length} bình luận
                                </h3>

                                {/* Add Comment */}
                                <div className="flex gap-3 mb-6">
                                    <Avatar className="w-10 h-10 shrink-0">
                                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                                            U
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Viết bình luận..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="w-full px-4 py-2 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-cyan-500 outline-none text-slate-900 dark:text-white"
                                        />
                                        {commentText && (
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button variant="ghost" size="sm" onClick={() => setCommentText('')}>
                                                    Hủy
                                                </Button>
                                                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                                                    Bình luận
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {MOCK_COMMENTS.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="w-10 h-10 shrink-0">
                                                <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 text-sm">
                                                    {comment.userName.split(' ').pop()?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-slate-900 dark:text-white text-sm">
                                                        {comment.userName}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {comment.timestamp}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">
                                                    {comment.content}
                                                </p>
                                                <div className="flex items-center gap-4">
                                                    <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        {comment.likes}
                                                    </button>
                                                    <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm">
                                                        <ThumbsDown className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium">
                                                        Phản hồi
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Related Videos */}
                    <div className="w-full lg:w-80 shrink-0">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Video liên quan
                        </h3>
                        <div className="space-y-4">
                            {RELATED_VIDEOS.map((video) => (
                                <Card
                                    key={video.id}
                                    className="flex gap-3 p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                            {video.duration}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 mb-1">
                                            {video.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {video.instructor}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {video.views.toLocaleString()} lượt xem
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
