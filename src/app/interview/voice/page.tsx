"use client";

import InterviewVoice from "@/components/interview/InterviewVoice";

import { Suspense } from 'react';

export default function InterviewVoicePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InterviewVoice />
        </Suspense>
    );
}
