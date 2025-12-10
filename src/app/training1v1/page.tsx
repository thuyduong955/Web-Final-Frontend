"use client";

import { useState, useEffect } from "react";
import { Training1v1 } from "@/components/training/Training1v1";
import { Training1v1Interviewer } from "@/components/training/Training1v1Interviewer";
import { useDevRole } from "@/components/common/DevRoleSwitcher";
import MainLayout from '@/components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

export default function Training1v1Page() {
    const role = useDevRole();
    const [mounted, setMounted] = useState(false);

    // Wait for client-side mount to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Show loading until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                </div>
            </MainLayout>
        );
    }

    // Check if user is an interviewer
    const isInterviewer = role === 'INTERVIEWER' || role === 'recruiter';

    if (isInterviewer) {
        return <MainLayout><Training1v1Interviewer /></MainLayout>;
    }

    return <MainLayout><Training1v1 /></MainLayout>;
}
