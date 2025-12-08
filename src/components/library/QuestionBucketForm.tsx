import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, ChevronDown, FileText, X } from 'lucide-react';
import { NotificationDialog } from '@/components/ui/notification-dialog';

interface QuestionBucketFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

// Generate URL-friendly slug from title
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 100) + '-' + Date.now().toString(36);
};

// Difficulty enum matching Prisma schema
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
    { value: 'EASY', label: 'Dễ' },
    { value: 'MEDIUM', label: 'Trung bình' },
    { value: 'HARD', label: 'Nâng cao' },
];

const CATEGORY_OPTIONS = [
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'System Design', label: 'System Design' },
    { value: 'Data Structures', label: 'Cấu trúc dữ liệu' },
    { value: 'Behavioral', label: 'Kỹ năng mềm' },
    { value: 'Other', label: 'Khác' },
];

export const QuestionBucketForm: React.FC<QuestionBucketFormProps> = ({ onSuccess, onCancel }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'MEDIUM' as Difficulty,
        duration: 30, // minutes
        category: 'Frontend',
        tags: '',
        videoUrl: '', // Optional video link
    });
    const [file, setFile] = useState<File | null>(null);
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            // Validate file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setNotification({
                    isOpen: true,
                    title: 'Tệp quá lớn',
                    description: 'Vui lòng chọn tệp nhỏ hơn 10MB.',
                    type: 'error'
                });
                return;
            }
            setFile(selectedFile);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setNotification({
                isOpen: true,
                title: 'Chưa đăng nhập',
                description: 'Vui lòng đăng nhập để tạo bộ câu hỏi.',
                type: 'error'
            });
            return;
        }

        if (!formData.title.trim()) {
            setNotification({
                isOpen: true,
                title: 'Thiếu tiêu đề',
                description: 'Vui lòng nhập tiêu đề cho bộ câu hỏi.',
                type: 'error'
            });
            return;
        }

        setLoading(true);
        try {
            // Generate slug from title
            const slug = generateSlug(formData.title);

            // Prepare Content payload matching Prisma schema
            const contentPayload = {
                title: formData.title.trim(),
                slug,
                description: formData.description.trim() || null,
                type: 'QUESTION_SET', // Hardcoded for this form
                difficulty: formData.difficulty,
                category: formData.category,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                duration: formData.duration,
                videoUrl: formData.videoUrl.trim() || null,
                status: 'PENDING_REVIEW', // Submit for admin review
                // fileUrls will be populated after R2 upload
            };

            console.log('Content payload:', contentPayload);
            console.log('File to upload:', file);

            // TODO: Implement actual API call
            // 1. Upload file to R2 if present
            // 2. Submit content payload with fileUrls to NestJS API

            // Simulate success
            await new Promise(resolve => setTimeout(resolve, 1000));

            setNotification({
                isOpen: true,
                title: 'Đã gửi',
                description: 'Bộ câu hỏi đã được gửi để xét duyệt. Bạn sẽ nhận thông báo khi được phê duyệt.',
                type: 'success'
            });

            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (error: any) {
            console.error('Error creating content:', error);
            setNotification({
                isOpen: true,
                title: 'Lỗi',
                description: error.message || 'Không thể tạo bộ câu hỏi. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <NotificationDialog
                isOpen={notification.isOpen}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
                title={notification.title}
                description={notification.description}
                type={notification.type}
            />

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tạo bộ câu hỏi mới</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <Input
                        required
                        placeholder="Ví dụ: Phỏng vấn ReactJS Senior"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="rounded-lg"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Mô tả
                    </label>
                    <Textarea
                        placeholder="Mô tả ngắn về bộ câu hỏi này..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="rounded-lg resize-none"
                    />
                </div>

                {/* Difficulty & Category */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Độ khó
                        </label>
                        <div className="relative">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan appearance-none"
                                value={formData.difficulty}
                                onChange={e => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                            >
                                {DIFFICULTY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Danh mục
                        </label>
                        <div className="relative">
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan appearance-none"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Duration & Tags */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Thời lượng (phút)
                        </label>
                        <Input
                            type="number"
                            min="5"
                            max="180"
                            placeholder="30"
                            value={formData.duration}
                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                            className="rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Tags <span className="text-slate-400 text-xs">(phân cách bởi dấu phẩy)</span>
                        </label>
                        <Input
                            placeholder="React, Frontend, Hooks"
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            className="rounded-lg"
                        />
                    </div>
                </div>

                {/* Video URL (optional) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Video bài giảng <span className="text-slate-400 text-xs">(tùy chọn)</span>
                    </label>
                    <Input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.videoUrl}
                        onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="rounded-lg"
                    />
                </div>

                {/* File Upload */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tài liệu câu hỏi <span className="text-slate-400 text-xs">(PDF, Word - tối đa 10MB)</span>
                    </label>

                    {file ? (
                        <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                            <FileText className="w-8 h-8 text-cyan-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-brand-cyan transition-colors cursor-pointer relative">
                            <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center pointer-events-none">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Kéo thả hoặc nhấp để chọn tệp
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                        Hủy bỏ
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-brand-cyan hover:bg-brand-cyan/90">
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Gửi xét duyệt
                    </Button>
                </div>
            </form>
        </div>
    );
};
