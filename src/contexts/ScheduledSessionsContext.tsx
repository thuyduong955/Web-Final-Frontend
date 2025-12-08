"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export interface SessionReview {
    rating: number; // 1-5
    comment: string;
    createdAt: string;
}

export interface ScheduledSession {
    id: string;
    interviewerId: string;
    interviewerName: string;
    interviewerRole: string;
    interviewerCompany: string;
    interviewerAvatar?: string;
    date: string; // Format: YYYY-MM-DD
    time: string; // Format: HH:mm
    note?: string;
    status: 'upcoming' | 'completed' | 'cancelled' | 'expired';
    review?: SessionReview;
}

interface ScheduledSessionsContextType {
    sessions: ScheduledSession[];
    addSession: (session: Omit<ScheduledSession, 'id'>) => ScheduledSession;
    updateSession: (id: string, updates: Partial<ScheduledSession>) => void;
    cancelSession: (id: string) => void;
    completeSession: (id: string) => void;
    expireSession: (id: string) => void;
    addReview: (sessionId: string, review: Omit<SessionReview, 'createdAt'>) => void;
    getSessionById: (id: string) => ScheduledSession | undefined;
    getSessionsForDate: (date: string) => ScheduledSession[];
    getUpcomingSessions: () => ScheduledSession[];
    getCompletedSessions: () => ScheduledSession[];
    getExpiredSessions: () => ScheduledSession[];
    getUnreviewedCompletedSessions: () => ScheduledSession[];
}

// Initial mock data
const INITIAL_SESSIONS: ScheduledSession[] = [
    {
        id: 's1',
        interviewerId: '1',
        interviewerName: 'Nguyễn Văn An',
        interviewerRole: 'Senior Software Engineer',
        interviewerCompany: 'Google',
        date: '2025-12-10',
        time: '09:00',
        note: 'Tập trung vào System Design',
        status: 'upcoming',
    },
    {
        id: 's2',
        interviewerId: '2',
        interviewerName: 'Trần Thị Bình',
        interviewerRole: 'Engineering Manager',
        interviewerCompany: 'Microsoft',
        date: '2025-12-10',
        time: '14:00',
        note: 'Phỏng vấn Backend Java',
        status: 'upcoming',
    },
    {
        id: 's3',
        interviewerId: '3',
        interviewerName: 'Lê Minh Cường',
        interviewerRole: 'Tech Lead',
        interviewerCompany: 'VNG Corporation',
        date: '2025-12-05',
        time: '10:00',
        status: 'completed',
    },
    {
        id: 's4',
        interviewerId: '4',
        interviewerName: 'Phạm Hoàng Dũng',
        interviewerRole: 'Principal Engineer',
        interviewerCompany: 'Shopee',
        date: '2025-12-15',
        time: '15:00',
        note: 'Algorithms & Data Structures',
        status: 'upcoming',
    },
    {
        id: 's5',
        interviewerId: '5',
        interviewerName: 'Hoàng Thị Mai',
        interviewerRole: 'Senior Product Manager',
        interviewerCompany: 'Grab',
        date: '2025-12-08',
        time: '10:00',
        status: 'completed',
    },
];

const ScheduledSessionsContext = createContext<ScheduledSessionsContextType | undefined>(undefined);

export function ScheduledSessionsProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<ScheduledSession[]>(INITIAL_SESSIONS);

    const addSession = useCallback((sessionData: Omit<ScheduledSession, 'id'>): ScheduledSession => {
        const newSession: ScheduledSession = {
            ...sessionData,
            id: `s${Date.now()}`,
        };
        setSessions(prev => [...prev, newSession]);
        return newSession;
    }, []);

    const updateSession = useCallback((id: string, updates: Partial<ScheduledSession>) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === id ? { ...session, ...updates } : session
            )
        );
    }, []);

    const cancelSession = useCallback((id: string) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === id ? { ...session, status: 'cancelled' as const } : session
            )
        );
    }, []);

    const completeSession = useCallback((id: string) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === id ? { ...session, status: 'completed' as const } : session
            )
        );
    }, []);

    const expireSession = useCallback((id: string) => {
        setSessions(prev => 
            prev.map(session => 
                session.id === id ? { ...session, status: 'expired' as const } : session
            )
        );
    }, []);

    // Auto-check and expire past sessions
    useEffect(() => {
        const checkExpiredSessions = () => {
            const now = new Date();
            setSessions(prev => 
                prev.map(session => {
                    if (session.status === 'upcoming') {
                        const sessionDateTime = new Date(`${session.date}T${session.time}`);
                        // Add 1 hour buffer after session time
                        sessionDateTime.setHours(sessionDateTime.getHours() + 1);
                        if (now > sessionDateTime) {
                            return { ...session, status: 'expired' as const };
                        }
                    }
                    return session;
                })
            );
        };

        // Check immediately on mount
        checkExpiredSessions();

        // Check every minute
        const interval = setInterval(checkExpiredSessions, 60000);
        return () => clearInterval(interval);
    }, []);

    const addReview = useCallback((sessionId: string, review: Omit<SessionReview, 'createdAt'>) => {
        setSessions(prev =>
            prev.map(session =>
                session.id === sessionId
                    ? {
                        ...session,
                        review: {
                            ...review,
                            createdAt: new Date().toISOString(),
                        },
                    }
                    : session
            )
        );
    }, []);

    const getSessionById = useCallback((id: string): ScheduledSession | undefined => {
        return sessions.find(session => session.id === id);
    }, [sessions]);

    const getSessionsForDate = useCallback((date: string): ScheduledSession[] => {
        return sessions.filter(session => session.date === date);
    }, [sessions]);

    const getUpcomingSessions = useCallback((): ScheduledSession[] => {
        return sessions
            .filter(session => session.status === 'upcoming')
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });
    }, [sessions]);

    const getCompletedSessions = useCallback((): ScheduledSession[] => {
        return sessions
            .filter(session => session.status === 'completed')
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });
    }, [sessions]);

    const getExpiredSessions = useCallback((): ScheduledSession[] => {
        return sessions
            .filter(session => session.status === 'expired')
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateB.getTime() - dateA.getTime(); // Most recent first
            });
    }, [sessions]);

    const getUnreviewedCompletedSessions = useCallback((): ScheduledSession[] => {
        return sessions
            .filter(session => session.status === 'completed' && !session.review)
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateB.getTime() - dateA.getTime();
            });
    }, [sessions]);

    return (
        <ScheduledSessionsContext.Provider
            value={{
                sessions,
                addSession,
                updateSession,
                cancelSession,
                completeSession,
                expireSession,
                addReview,
                getSessionById,
                getSessionsForDate,
                getUpcomingSessions,
                getCompletedSessions,
                getExpiredSessions,
                getUnreviewedCompletedSessions,
            }}
        >
            {children}
        </ScheduledSessionsContext.Provider>
    );
}

export function useScheduledSessions() {
    const context = useContext(ScheduledSessionsContext);
    if (context === undefined) {
        throw new Error('useScheduledSessions must be used within a ScheduledSessionsProvider');
    }
    return context;
}
