"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Loader2, Briefcase, Building, Award, DollarSign } from 'lucide-react';

interface InterviewerProfileCompletionModalProps {
    open: boolean;
    onComplete: () => void;
}

export const InterviewerProfileCompletionModal: React.FC<InterviewerProfileCompletionModalProps> = ({
    open,
    onComplete,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        experience: '',
        hourlyRate: '',
        bio: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.title.trim()) {
            setError('Vui lòng nhập chức danh');
            return;
        }
        if (!formData.company.trim()) {
            setError('Vui lòng nhập tên công ty');
            return;
        }
        if (!formData.experience || parseInt(formData.experience) < 0) {
            setError('Vui lòng nhập số năm kinh nghiệm hợp lệ');
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/interviewer-profile', {
                title: formData.title,
                company: formData.company,
                experience: parseInt(formData.experience),
                hourlyRate: parseInt(formData.hourlyRate) || 0,
                bio: formData.bio,
            });
            onComplete();
        } catch (err: any) {
            console.error('Failed to save interviewer profile:', err);
            setError(err.response?.data?.message || 'Không thể lưu thông tin. Vui lòng thử lại.');
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="max-w-lg [&>button]:hidden">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-cyan-500" />
                        Hoàn tất thông tin Interviewer
                    </DialogTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Vui lòng điền đầy đủ thông tin để bắt đầu nhận lịch hẹn phỏng vấn
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Chức danh <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                            placeholder="VD: Senior Software Engineer"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Công ty <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={formData.company}
                            onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                            placeholder="VD: Google, FPT Software"
                        />
                    </div>

                    {/* Experience & Hourly Rate */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Kinh nghiệm (năm) <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.experience}
                                onChange={(e) => setFormData(p => ({ ...p, experience: e.target.value }))}
                                placeholder="5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Phí / giờ (VNĐ)
                            </label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.hourlyRate}
                                onChange={(e) => setFormData(p => ({ ...p, hourlyRate: e.target.value }))}
                                placeholder="500000"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Giới thiệu bản thân
                        </label>
                        <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                            placeholder="Mô tả ngắn về kinh nghiệm và chuyên môn của bạn..."
                            rows={3}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            'Hoàn tất đăng ký'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
