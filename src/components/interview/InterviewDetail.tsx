"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, ArrowLeft, Loader2 } from 'lucide-react';

interface ContentData {
    id: string;
    title: string;
    description?: string;
    fileUrls?: string[];
    videoUrl?: string;
}

export default function InterviewDetail({ id }: { id?: string }) {
    const router = useRouter();
    const params = useParams();
    const lessonId = id || (params?.id as string);

    const [content, setContent] = useState<ContentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            if (!lessonId) {
                setLoading(false);
                setError('ID không hợp lệ');
                return;
            }

            try {
                const { default: api } = await import('@/services/api');
                const { data } = await api.get(`/library/${lessonId}`);

                if (data) {
                    setContent({
                        id: data.id,
                        title: data.title,
                        description: data.description,
                        fileUrls: data.fileUrls,
                        videoUrl: data.videoUrl,
                    });
                } else {
                    setError('Không tìm thấy nội dung');
                }
            } catch (err) {
                console.error('Error fetching content:', err);
                setError('Không thể tải nội dung');
            }
            setLoading(false);
        };

        fetchContent();
    }, [lessonId]);

    const handleBack = () => router.back();

    const handleDownload = (url: string, index: number) => {
        window.open(url, '_blank');
    };

    const getFileName = (url: string, index: number) => {
        try {
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            // Remove query params if any
            return decodeURIComponent(fileName.split('?')[0]) || `File ${index + 1}`;
        } catch {
            return `File ${index + 1}`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tải...</span>
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{error || 'Không tìm thấy nội dung'}</p>
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" onClick={handleBack} className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {content.title}
                    </h1>
                    {content.description && (
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            {content.description}
                        </p>
                    )}
                </div>

                {/* Files */}
                {content.fileUrls && content.fileUrls.length > 0 ? (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Tài liệu đính kèm
                        </h2>
                        {content.fileUrls.map((url, index) => (
                            <Card
                                key={index}
                                className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                onClick={() => handleDownload(url, index)}
                            >
                                <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                        {getFileName(url, index)}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Click để xem hoặc tải xuống
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    Tải về
                                </Button>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="p-8 text-center">
                        <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Không có tài liệu đính kèm
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
