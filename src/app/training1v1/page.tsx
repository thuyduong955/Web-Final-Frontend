"use client";

import { Training1v1 } from "@/components/training/Training1v1";
import { Training1v1Interviewer } from "@/components/training/Training1v1Interviewer";
import { useDevRole } from "@/components/common/DevRoleSwitcher";
import MainLayout from '@/components/layout/MainLayout';

export default function Training1v1Page() {
    const role = useDevRole();

    // Check if user is an interviewer
    const isInterviewer = role === 'INTERVIEWER' || role === 'recruiter';

    if (isInterviewer) {
        return <MainLayout><Training1v1Interviewer /></MainLayout>;
    }

    return <MainLayout><Training1v1 /></MainLayout>;
}
