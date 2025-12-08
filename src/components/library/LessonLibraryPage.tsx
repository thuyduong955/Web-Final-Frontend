"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { InterviewAiCard, InterviewAiCardProps } from '@/components/interview/InterviewAiCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Loader2, X, Play, Video, Star, Clock, BookOpen, Users } from 'lucide-react';
import { QuestionBucketForm } from '@/components/library/QuestionBucketForm';

interface LessonReview {
    id: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    date: string;
}

// Mock reviews data
const MOCK_REVIEWS: Record<string, LessonReview[]> = {
    'mock-1': [
        { id: 'r1', userName: 'Nguyễn Văn A', rating: 5, comment: 'Bài học rất chi tiết và hữu ích. Tôi đã apply thành công vào Google nhờ bộ câu hỏi này!', date: '2025-12-01' },
        { id: 'r2', userName: 'Trần Thị B', rating: 5, comment: 'Các câu hỏi System Design rất sát với thực tế phỏng vấn.', date: '2025-11-28' },
        { id: 'r3', userName: 'Lê Hoàng C', rating: 4, comment: 'Nội dung tốt, chỉ thiếu một số câu hỏi về performance optimization.', date: '2025-11-25' },
        { id: 'r4', userName: 'Phạm Minh D', rating: 5, comment: 'Excellent! Đã giúp tôi tự tin hơn rất nhiều trong buổi phỏng vấn.', date: '2025-11-20' },
    ],
    'mock-2': [
        { id: 'r5', userName: 'Hoàng Thị E', rating: 5, comment: 'Cực kỳ hữu ích cho việc chuẩn bị phỏng vấn Chevening!', date: '2025-12-02' },
        { id: 'r6', userName: 'Vũ Văn F', rating: 4, comment: 'Câu hỏi đa dạng, bao quát nhiều khía cạnh.', date: '2025-11-30' },
        { id: 'r7', userName: 'Đặng Thị G', rating: 5, comment: 'Nhờ bài học này mà mình đã được học bổng!', date: '2025-11-15' },
    ],
    'mock-3': [
        { id: 'r8', userName: 'Bùi Văn H', rating: 4, comment: 'Các tips đàm phán rất thực tế và dễ áp dụng.', date: '2025-12-03' },
        { id: 'r9', userName: 'Ngô Thị I', rating: 5, comment: 'Đã tăng được 20% lương nhờ kỹ năng học được!', date: '2025-11-22' },
        { id: 'r10', userName: 'Đinh Văn K', rating: 5, comment: 'Rất chi tiết và có nhiều ví dụ thực tế.', date: '2025-11-18' },
    ],
};

const FILTER_CHIPS = [
    { id: 'jobs', label: 'Phỏng vấn xin việc' },
    { id: 'scholarship', label: 'Học bổng / Du học' },
    { id: 'startup', label: 'Pitching / Startup' },
    { id: 'softskills', label: 'Kỹ năng mềm' },
];

const ARTICLES = [
    {
        id: 'article-hero-questions',
        title: 'Top 10 câu hỏi phỏng vấn xin việc phổ biến nhất 2025',
        description: 'Chuẩn bị trước những câu hỏi thường gặp giúp bạn tự tin hơn khi bước vào vòng phỏng vấn.',
        imageUrl:
            'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-scholarship',
        title: 'Cách luyện tập phỏng vấn học bổng hiệu quả',
        description: 'Tìm hiểu chiến lược để thuyết phục ban giám khảo trong buổi phỏng vấn học bổng.',
        imageUrl:
            'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-star-method',
        title: 'Hướng dẫn STAR Method để trả lời phỏng vấn tình huống',
        description: 'Công thức S.T.A.R giúp bạn kể chuyện mạch lạc và thuyết phục.',
        imageUrl:
            'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
    {
        id: 'article-body-language',
        title: 'Ngôn ngữ cơ thể trong phỏng vấn: Nên và không nên',
        description: 'Ánh mắt, tư thế và nụ cười có thể quyết định 50% thành công của bạn.',
        imageUrl:
            'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=700&q=80',
        rating: 4.3,
    },
];

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-current stroke-[1.8] fill-none">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
    </svg>
);

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#0f172a] dark:stroke-slate-400 stroke-[1.6] fill-none">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5 21 21" />
    </svg>
);

const FilterIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 stroke-[#62d1ee] stroke-[1.8] fill-none">
        <path d="M4 5h16" />
        <path d="M7 12h10" />
        <path d="M10 19h4" />
    </svg>
);

const ArticleCard = ({ title, description, imageUrl, rating }: { title: string; description: string; imageUrl: string; rating: number }) => (
    <article className="flex flex-col bg-white dark:bg-slate-800 border border-[#10182814] dark:border-slate-700 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_25px_55px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_25px_55px_rgba(0,0,0,0.4)]">
        <div className="relative pt-[55%] bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }}>
            <span className="absolute top-4 left-4 bg-[#101828bf] dark:bg-slate-900/80 text-white text-xs px-3 py-1 rounded-full">Bài viết</span>
        </div>
        <div className="flex flex-col flex-1 p-5 pb-2 gap-2">
            <h3 className="text-[1.1rem] font-semibold m-0 text-[#0f172a] dark:text-white">{title}</h3>
            <p className="text-[#475467] dark:text-slate-400 leading-relaxed m-0">{description}</p>
        </div>
        <div className="flex items-center justify-between gap-4 p-6 pt-3 border-t border-[#10182814] dark:border-slate-700 mt-auto">
            <div className="inline-flex items-center gap-1.5 text-[0.9rem] text-[#62d1ee]">
                <span className="tracking-wide text-[0.95rem]" aria-hidden="true">
                    ★★★★☆
                </span>
                <span className="text-[#0f172a] dark:text-white text-[0.9rem]">{rating.toFixed(1)}</span>
            </div>
            <button type="button" className="inline-flex items-center justify-center min-w-[110px] px-3.5 py-1 border border-[#62d1ee] text-[#0f172a] dark:text-white rounded-full bg-[#62d1ee26] dark:bg-cyan-500/20 font-semibold text-[0.9rem] cursor-pointer hover:bg-[#62d1ee40] dark:hover:bg-cyan-500/30 transition-colors" aria-label="Đọc bài viết">
                Đọc ngay
            </button>
        </div>
    </article>
);

export function LessonLibraryPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('');
    const [search, setSearch] = useState('');
    const [lessons, setLessons] = useState<InterviewAiCardProps[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<InterviewAiCardProps | null>(null);

    const MOCK_LESSONS: InterviewAiCardProps[] = [
        {
            id: 'mock-1',
            title: 'Phỏng vấn Frontend Developer (ReactJS)',
            description: 'Bộ câu hỏi phỏng vấn cho vị trí Senior Frontend Developer với ReactJS, TypeScript và System Design.',
            difficulty: 'Nâng cao',
            duration: '45 phút',
            tags: ['React', 'Frontend', 'System Design'],
            category: 'jobs',
            questions: [],
            rating: 4.8,
            reviewCount: 120,
            views: 1500,
        },
        {
            id: 'mock-2',
            title: 'Phỏng vấn học bổng Chevening',
            description: 'Các câu hỏi thường gặp khi phỏng vấn học bổng chính phủ Anh Chevening.',
            difficulty: 'Nâng cao',
            duration: '60 phút',
            tags: ['Scholarship', 'Chevening', 'UK'],
            category: 'scholarship',
            questions: [],
            rating: 4.9,
            reviewCount: 85,
            views: 2300,
        },
        {
            id: 'mock-3',
            title: 'Kỹ năng đàm phán lương',
            description: 'Luyện tập các tình huống đàm phán lương và phúc lợi với nhà tuyển dụng.',
            difficulty: 'Trung cấp',
            duration: '30 phút',
            tags: ['Soft Skills', 'Negotiation', 'Salary'],
            category: 'softskills',
            questions: [],
            rating: 4.5,
            reviewCount: 210,
            views: 5000,
        }
    ];

    const fetchLessons = async () => {
        setLoading(true);
        // TODO: Fetch lessons from NestJS API
        // For now, use mock data
        setLessons(MOCK_LESSONS);
        setLoading(false);
    };

    useEffect(() => {
        fetchLessons();
    }, []);

    const filteredLessons = useMemo(() => {
        return lessons.filter((lesson) => {
            const matchesSearch = lesson.title.toLowerCase().includes(search.trim().toLowerCase());
            const matchesFilter = !activeFilter || lesson.category === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [search, activeFilter, lessons]);

    const handleOpenLesson = (lesson: InterviewAiCardProps) => {
        setSelectedLesson(lesson);
    };

    const handleStartLesson = () => {
        if (selectedLesson) {
            router.push(`/interview/${selectedLesson.id}`);
        }
    };

    const handleWatchVideo = () => {
        if (selectedLesson) {
            router.push(`/lesson/video?topic=${encodeURIComponent(selectedLesson.title)}&lessonId=${selectedLesson.id}`);
        }
    };

    const getReviewsForLesson = (lessonId: string): LessonReview[] => {
        return MOCK_REVIEWS[lessonId] || [];
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
        ));
    };

    const handleCreateSuccess = () => {
        setShowCreateForm(false);
        fetchLessons();
    };

    if (showCreateForm) {
        return (
            <div className="w-[min(1200px,92vw)] mx-auto py-10">
                <QuestionBucketForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setShowCreateForm(false)}
                />
            </div>
        );
    }

    return (
        <section className="w-[min(1200px,92vw)] mx-auto py-10 pb-16 flex flex-col gap-10">
            <header className="flex flex-col gap-6">
                <div className="flex gap-4 items-center max-sm:flex-col">
                    <div className="flex-1 flex items-center gap-3 px-6 h-12 rounded-full border border-[#dde3ea] dark:border-slate-600 bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] w-full">
                        <SearchIcon />
                        <input
                            type="search"
                            placeholder="Tìm tài liệu / bài viết / bộ câu hỏi nhanh"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Tìm kiếm nội dung"
                            className="border-none outline-none flex-1 text-base text-[#0f172a] dark:text-white placeholder-[#b1b5c3] dark:placeholder-slate-500 bg-transparent"
                        />
                    </div>
                    <button type="button" className="w-12 h-12 rounded-full border border-[#dde3ea] dark:border-slate-600 bg-white dark:bg-slate-800 grid place-items-center cursor-pointer shadow-[0_4px_20px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] max-sm:w-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" aria-label="Bộ lọc nâng cao">
                        <FilterIcon />
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4" role="tablist" aria-label="Bộ lọc nội dung">
                        {FILTER_CHIPS.map((chip) => (
                            <button
                                key={chip.id}
                                type="button"
                                className={`border rounded-full px-7 py-2.5 font-semibold cursor-pointer transition-all duration-150 ${activeFilter === chip.id
                                    ? 'border-[#62d1ee] text-[#101828] dark:text-white bg-[#62d1ee26] dark:bg-cyan-500/20'
                                    : 'border-[#cfd6e4] dark:border-slate-600 bg-white dark:bg-slate-800 text-[#475467] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                onClick={() => setActiveFilter((prev) => (prev === chip.id ? '' : chip.id))}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>

                    {/* Recruiter Action */}
                    {(profile?.role === 'recruiter' || profile?.role === 'admin') && (
                        <Button
                            onClick={() => setShowCreateForm(true)}
                            className="rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shadow-lg shadow-cyan-100 dark:shadow-cyan-900/30"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo bộ câu hỏi
                        </Button>
                    )}
                </div>
            </header>

            <section className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-2xl text-[#101828] dark:text-white font-bold">Bộ câu hỏi</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-cyan" />
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-7">
                        {filteredLessons.map((lesson) => (
                            <InterviewAiCard
                                key={lesson.id}
                                {...lesson}
                                onOpen={() => handleOpenLesson(lesson)}
                            />
                        ))}

                        {filteredLessons.length === 0 && (
                            <div className="col-span-full border border-dashed border-[#62d1ee99] rounded-3xl p-8 text-center text-[#475467]">
                                <p>Không tìm thấy bài học phù hợp. Thử bộ lọc khác nhé!</p>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-6 mt-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="m-0 text-2xl text-[#101828] dark:text-white font-bold">Bài viết</h2>
                    <button type="button" className="inline-flex items-center gap-1.5 text-[#62d1ee] font-semibold bg-none border-none cursor-pointer p-0 hover:underline">
                        <span>Xem thêm</span>
                        <ArrowIcon />
                    </button>
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8 items-stretch">
                    {ARTICLES.map((article) => (
                        <ArticleCard key={article.id} {...article} />
                    ))}
                </div>
            </section>

            {/* Lesson Detail Modal */}
            {selectedLesson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                        {/* Left Side - Lesson Info */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors md:hidden"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {selectedLesson.tags?.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {selectedLesson.title}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    {selectedLesson.duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {selectedLesson.duration}
                                        </span>
                                    )}
                                    {selectedLesson.difficulty && (
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            {selectedLesson.difficulty}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {selectedLesson.views?.toLocaleString()} lượt xem
                                    </span>
                                </div>
                            </div>

                            {/* Rating Summary */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="text-4xl font-bold text-cyan-500">
                                    {selectedLesson.rating?.toFixed(1)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 mb-1">
                                        {renderStars(selectedLesson.rating || 0)}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {selectedLesson.reviewCount} đánh giá
                                    </p>
                                </div>
                            </div>

                            {/* Introduction */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                                    Giới thiệu bài học
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {selectedLesson.description}
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-3">
                                    Bài học này sẽ giúp bạn nắm vững các kỹ năng cần thiết và chuẩn bị tốt nhất cho buổi phỏng vấn. 
                                    Với các câu hỏi được thiết kế sát với thực tế, bạn sẽ tự tin hơn khi đối mặt với nhà tuyển dụng.
                                </p>
                                <ul className="mt-4 space-y-2 text-slate-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                        Câu hỏi được cập nhật theo xu hướng mới nhất
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                        Có gợi ý câu trả lời mẫu
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                        Feedback từ AI sau khi hoàn thành
                                    </li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    onClick={handleStartLesson}
                                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-6 text-lg"
                                >
                                    <Play className="w-5 h-5 mr-2" />
                                    Bắt đầu bài học
                                </Button>
                                <Button
                                    onClick={handleWatchVideo}
                                    variant="outline"
                                    className="flex-1 border-cyan-500 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 py-6 text-lg"
                                >
                                    <Video className="w-5 h-5 mr-2" />
                                    Xem video bài giảng
                                </Button>
                            </div>
                        </div>

                        {/* Right Side - Reviews */}
                        <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-900 p-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 overflow-y-auto max-h-[40vh] md:max-h-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Đánh giá từ học viên
                                </h3>
                                <button
                                    onClick={() => setSelectedLesson(null)}
                                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden md:block"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {getReviewsForLesson(selectedLesson.id).map((review) => (
                                    <Card key={review.id} className="p-4 bg-white dark:bg-slate-800">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300 font-bold text-sm">
                                                    {review.userName.split(' ').pop()?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                                                        {review.userName}
                                                    </p>
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(review.date).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5 mb-2">
                                                    {renderStars(review.rating)}
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {review.comment}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {getReviewsForLesson(selectedLesson.id).length === 0 && (
                                    <div className="text-center py-8 text-slate-400">
                                        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>Chưa có đánh giá nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default LessonLibraryPage;
