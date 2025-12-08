"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Điểm đánh giá từ AI cho buổi phỏng vấn (Interviewer đánh giá Interviewee)
export interface InterviewScore {
    id: string;
    sessionId: string;
    intervieweeId: string;
    intervieweeName: string;
    interviewerId: string;
    interviewerName: string;
    date: string;
    topic: string;
    score: number; // 0-10
    feedback: string;
    suggestions: string[];
    createdAt: string;
}

// Đánh giá của Interviewee cho Interviewer (đã có trong ScheduledSessionsContext là review)
// Nhưng để thống kê cho Interviewer, ta cần một cấu trúc khác

export interface InterviewerReview {
    id: string;
    interviewerId: string;
    interviewerName: string;
    intervieweeId: string;
    intervieweeName: string;
    date: string;
    rating: number; // 1-5
    comment: string;
    createdAt: string;
}

interface InterviewScoresContextType {
    // Điểm từ Interviewer (AI) cho Interviewee
    interviewScores: InterviewScore[];
    addInterviewScore: (score: Omit<InterviewScore, 'id' | 'createdAt'>) => void;
    getScoresByInterviewee: (intervieweeId: string) => InterviewScore[];
    getAverageScore: (intervieweeId: string) => number;
    
    // Đánh giá từ Interviewee cho Interviewer
    interviewerReviews: InterviewerReview[];
    addInterviewerReview: (review: Omit<InterviewerReview, 'id' | 'createdAt'>) => void;
    getReviewsByInterviewer: (interviewerId: string) => InterviewerReview[];
    getAverageRating: (interviewerId: string) => number;
}

// Mock data cho demo
const MOCK_INTERVIEW_SCORES: InterviewScore[] = [
    {
        id: 'is1',
        sessionId: 's1',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '1',
        interviewerName: 'Nguyễn Văn An',
        date: '2025-12-01',
        topic: 'Frontend Development',
        score: 7.5,
        feedback: 'Ứng viên có kiến thức tốt về React và JavaScript.',
        suggestions: ['Cần cải thiện kỹ năng System Design', 'Nên học thêm về TypeScript'],
        createdAt: '2025-12-01T10:00:00Z',
    },
    {
        id: 'is2',
        sessionId: 's2',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '2',
        interviewerName: 'Trần Thị Bình',
        date: '2025-12-02',
        topic: 'Backend Development',
        score: 8.2,
        feedback: 'Kiến thức backend vững chắc, biết cách xử lý các bài toán phức tạp.',
        suggestions: ['Nên tìm hiểu thêm về microservices'],
        createdAt: '2025-12-02T14:00:00Z',
    },
    {
        id: 'is3',
        sessionId: 's3',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '3',
        interviewerName: 'Lê Minh Cường',
        date: '2025-12-03',
        topic: 'System Design',
        score: 6.8,
        feedback: 'Cần cải thiện kỹ năng thiết kế hệ thống.',
        suggestions: ['Học về distributed systems', 'Tìm hiểu về caching strategies'],
        createdAt: '2025-12-03T09:00:00Z',
    },
    {
        id: 'is4',
        sessionId: 's4',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '1',
        interviewerName: 'Nguyễn Văn An',
        date: '2025-12-04',
        topic: 'Algorithms',
        score: 8.5,
        feedback: 'Giải thuật tốt, tư duy logic rõ ràng.',
        suggestions: ['Tiếp tục luyện tập'],
        createdAt: '2025-12-04T15:00:00Z',
    },
    {
        id: 'is5',
        sessionId: 's5',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '4',
        interviewerName: 'Phạm Hoàng Dũng',
        date: '2025-12-05',
        topic: 'Data Structures',
        score: 7.8,
        feedback: 'Nắm vững các cấu trúc dữ liệu cơ bản.',
        suggestions: ['Cần tìm hiểu thêm về advanced data structures'],
        createdAt: '2025-12-05T11:00:00Z',
    },
    {
        id: 'is6',
        sessionId: 's6',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        interviewerId: '2',
        interviewerName: 'Trần Thị Bình',
        date: '2025-12-06',
        topic: 'Behavioral Interview',
        score: 9.0,
        feedback: 'Kỹ năng giao tiếp xuất sắc, trả lời câu hỏi rõ ràng.',
        suggestions: [],
        createdAt: '2025-12-06T10:00:00Z',
    },
];

const MOCK_INTERVIEWER_REVIEWS: InterviewerReview[] = [
    {
        id: 'ir1',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user1',
        intervieweeName: 'Nguyễn Văn A',
        date: '2025-12-01',
        rating: 5,
        comment: 'Interviewer rất nhiệt tình và hướng dẫn tận tâm.',
        createdAt: '2025-12-01T11:00:00Z',
    },
    {
        id: 'ir2',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user2',
        intervieweeName: 'Trần Văn B',
        date: '2025-12-02',
        rating: 4,
        comment: 'Câu hỏi phù hợp, có feedback chi tiết.',
        createdAt: '2025-12-02T15:00:00Z',
    },
    {
        id: 'ir3',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user3',
        intervieweeName: 'Lê Văn C',
        date: '2025-12-03',
        rating: 5,
        comment: 'Buổi phỏng vấn rất hữu ích!',
        createdAt: '2025-12-03T10:00:00Z',
    },
    {
        id: 'ir4',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user4',
        intervieweeName: 'Phạm Văn D',
        date: '2025-12-04',
        rating: 4,
        comment: 'Tốt, nhưng có thể cải thiện phần feedback.',
        createdAt: '2025-12-04T16:00:00Z',
    },
    {
        id: 'ir5',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user5',
        intervieweeName: 'Hoàng Văn E',
        date: '2025-12-05',
        rating: 5,
        comment: 'Rất chuyên nghiệp!',
        createdAt: '2025-12-05T12:00:00Z',
    },
    {
        id: 'ir6',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user6',
        intervieweeName: 'Vũ Văn F',
        date: '2025-12-06',
        rating: 3,
        comment: 'Buổi phỏng vấn ổn.',
        createdAt: '2025-12-06T11:00:00Z',
    },
    {
        id: 'ir7',
        interviewerId: 'interviewer1',
        interviewerName: 'Current Interviewer',
        intervieweeId: 'user7',
        intervieweeName: 'Đặng Văn G',
        date: '2025-12-07',
        rating: 5,
        comment: 'Tuyệt vời!',
        createdAt: '2025-12-07T14:00:00Z',
    },
];

const InterviewScoresContext = createContext<InterviewScoresContextType | undefined>(undefined);

export function InterviewScoresProvider({ children }: { children: ReactNode }) {
    const [interviewScores, setInterviewScores] = useState<InterviewScore[]>(MOCK_INTERVIEW_SCORES);
    const [interviewerReviews, setInterviewerReviews] = useState<InterviewerReview[]>(MOCK_INTERVIEWER_REVIEWS);

    const addInterviewScore = useCallback((scoreData: Omit<InterviewScore, 'id' | 'createdAt'>) => {
        const newScore: InterviewScore = {
            ...scoreData,
            id: `is${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setInterviewScores(prev => [...prev, newScore]);
    }, []);

    const getScoresByInterviewee = useCallback((intervieweeId: string): InterviewScore[] => {
        return interviewScores
            .filter(score => score.intervieweeId === intervieweeId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [interviewScores]);

    const getAverageScore = useCallback((intervieweeId: string): number => {
        const scores = interviewScores.filter(score => score.intervieweeId === intervieweeId);
        if (scores.length === 0) return 0;
        return scores.reduce((acc, score) => acc + score.score, 0) / scores.length;
    }, [interviewScores]);

    const addInterviewerReview = useCallback((reviewData: Omit<InterviewerReview, 'id' | 'createdAt'>) => {
        const newReview: InterviewerReview = {
            ...reviewData,
            id: `ir${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setInterviewerReviews(prev => [...prev, newReview]);
    }, []);

    const getReviewsByInterviewer = useCallback((interviewerId: string): InterviewerReview[] => {
        return interviewerReviews
            .filter(review => review.interviewerId === interviewerId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [interviewerReviews]);

    const getAverageRating = useCallback((interviewerId: string): number => {
        const reviews = interviewerReviews.filter(review => review.interviewerId === interviewerId);
        if (reviews.length === 0) return 0;
        return reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    }, [interviewerReviews]);

    return (
        <InterviewScoresContext.Provider
            value={{
                interviewScores,
                addInterviewScore,
                getScoresByInterviewee,
                getAverageScore,
                interviewerReviews,
                addInterviewerReview,
                getReviewsByInterviewer,
                getAverageRating,
            }}
        >
            {children}
        </InterviewScoresContext.Provider>
    );
}

export function useInterviewScores() {
    const context = useContext(InterviewScoresContext);
    if (context === undefined) {
        throw new Error('useInterviewScores must be used within an InterviewScoresProvider');
    }
    return context;
}
