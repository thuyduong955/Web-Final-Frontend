import InterviewDetail from "@/components/interview/InterviewDetail";

import { Suspense } from 'react';

export default async function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InterviewDetail id={id} />
        </Suspense>
    );
}
