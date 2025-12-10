"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/contexts/auth-types';

/**
 * DEV ONLY - Role Switcher Component
 * Allows quick switching between INTERVIEWEE and INTERVIEWER roles for testing.
 * Only visible in development mode.
 * 
 * Press Ctrl+Shift+R to toggle visibility.
 */
export function DevRoleSwitcher() {
    const { profile } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [mockRole, setMockRole] = useState<UserRole | null>(null);

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    // Keyboard shortcut: Ctrl+Shift+R
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                setIsVisible(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Store mock role in sessionStorage
    useEffect(() => {
        const stored = sessionStorage.getItem('DEV_MOCK_ROLE');
        if (stored) {
            setMockRole(stored as UserRole);
        }
    }, []);

    const handleRoleChange = (role: UserRole | null) => {
        setMockRole(role);
        if (role) {
            sessionStorage.setItem('DEV_MOCK_ROLE', role);
        } else {
            sessionStorage.removeItem('DEV_MOCK_ROLE');
        }
        // Force reload to apply role change
        window.location.reload();
    };

    if (!isVisible) {
        return (
            <div
                className="fixed bottom-4 right-4 z-[9999] bg-yellow-500 text-black text-xs px-2 py-1 rounded cursor-pointer opacity-50 hover:opacity-100"
                onClick={() => setIsVisible(true)}
                title="Ctrl+Shift+R to toggle"
            >
                DEV
            </div>
        );
    }

    const currentRole = mockRole || profile?.role || 'N/A';

    return (
        <div className="fixed bottom-4 right-4 z-[9999] bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-yellow-500 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
                <span className="text-yellow-500 font-bold text-sm">🛠️ DEV MODE</span>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            <div className="text-xs text-slate-400 mb-2">
                Current Role: <span className="text-cyan-400 font-mono">{currentRole}</span>
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => handleRoleChange('INTERVIEWEE')}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentRole === 'INTERVIEWEE' || currentRole === 'job_seeker'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    👤 INTERVIEWEE (Ứng viên)
                </button>
                <button
                    onClick={() => handleRoleChange('INTERVIEWER')}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentRole === 'INTERVIEWER' || currentRole === 'recruiter'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    🎓 INTERVIEWER (Người phỏng vấn)
                </button>
                <button
                    onClick={() => handleRoleChange(null)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-800 text-slate-400 hover:bg-slate-700"
                >
                    Reset to actual role
                </button>
            </div>

            <div className="mt-3 text-[10px] text-slate-500 text-center">
                Press Ctrl+Shift+R to hide
            </div>
        </div>
    );
}

/**
 * Hook to get the effective role (mock or real)
 */
export function useDevRole(): UserRole | undefined {
    const { profile } = useAuth();

    if (process.env.NODE_ENV !== 'development') {
        return profile?.role;
    }

    if (typeof window === 'undefined') {
        return profile?.role;
    }

    const mockRole = sessionStorage.getItem('DEV_MOCK_ROLE') as UserRole | null;
    return mockRole || profile?.role;
}
