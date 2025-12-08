"use client";

import { Training1v1 } from "@/components/training/Training1v1";
import { Training1v1Interviewer } from "@/components/training/Training1v1Interviewer";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from '@/components/layout/MainLayout';

export default function Training1v1Page() {
    const { profile } = useAuth();
    
    // Check if user is an interviewer
    const isInterviewer = profile?.role === 'INTERVIEWER' || profile?.role === 'recruiter';
    
    if (isInterviewer) {
        return <MainLayout><Training1v1Interviewer /></MainLayout>;
    }
    
    return <MainLayout><Training1v1 /></MainLayout>;
}
