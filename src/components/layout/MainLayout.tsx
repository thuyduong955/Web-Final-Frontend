"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SidebarNav from "@/components/layout/SidebarNav";
import { InterviewerProfileCompletionModal } from "@/components/auth/InterviewerProfileCompletionModal";
import api from '@/services/api';
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    // Interviewer profile completion modal state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(false);

    // Check if interviewer needs to complete profile
    const checkInterviewerProfile = useCallback(async () => {
        if (profile?.role !== 'INTERVIEWER') return;

        setCheckingProfile(true);
        try {
            const { data } = await api.get('/auth/profile');
            // Show modal if INTERVIEWER role but no profile OR profile is incomplete
            if (!data.interviewerProfile || !data.interviewerProfile.title || !data.interviewerProfile.company) {
                setShowProfileModal(true);
            }
        } catch (err) {
            console.error('Failed to check interviewer profile:', err);
        }
        setCheckingProfile(false);
    }, [profile?.role]);

    useEffect(() => {
        // Redirect to login if not authenticated (after loading)
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!loading && user && profile) {
            checkInterviewerProfile();
        }
    }, [loading, user, profile, checkInterviewerProfile]);

    const handleProfileComplete = () => {
        setShowProfileModal(false);
        // Optionally refresh profile
        window.location.reload();
    };

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    // Don't render content if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <SidebarNav />
            <main className="flex-1 overflow-auto bg-muted/10">
                {children}
            </main>

            {/* Interviewer Profile Completion Modal */}
            <InterviewerProfileCompletionModal
                open={showProfileModal}
                onComplete={handleProfileComplete}
            />
        </div>
    );
}

export default MainLayout;

