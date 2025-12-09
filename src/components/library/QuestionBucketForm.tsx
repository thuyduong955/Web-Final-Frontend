import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, ChevronDown, FileText, X, Video, Image } from 'lucide-react';
import { NotificationDialog } from '@/components/ui/notification-dialog';
import api from '@/services/api';
import uploadService from '@/services/uploadService';

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
    const videoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'MEDIUM' as Difficulty,
        duration: 30,
        category: 'Frontend',
        tags: '',
    });

    // File states
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; description: string; type: 'success' | 'error' | 'info' }>({
        isOpen: false,
        title: '',
        description: '',
        type: 'info'
    });

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            try {
                uploadService.validateVideoFile(file);
                setVideoFile(file);
            } catch (error: any) {
                setNotification({
                    isOpen: true,
                    title: 'Video không hợp lệ',
                    description: error.message,
                    type: 'error'
                });
            }
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            try {
                uploadService.validateImageFile(file, 2);
                setThumbnailFile(file);
                // Create preview
                const reader = new FileReader();
                reader.onloadend = () => setThumbnailPreview(reader.result as string);
                reader.readAsDataURL(file);
            } catch (error: any) {
                setNotification({ isOpen: true, title: 'Ảnh không hợp lệ', description: error.message, type: 'error' });
            }
        }
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 50 * 1024 * 1024) {
                setNotification({ isOpen: true, title: 'Tệp quá lớn', description: 'Tệp phải nhỏ hơn 50MB', type: 'error' });
                return;
            }
            setAttachmentFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setNotification({ isOpen: true, title: 'Chưa đăng nhập', description: 'Vui lòng đăng nhập để tạo nội dung.', type: 'error' });
            return;
        }

        if (!formData.title.trim()) {
            setNotification({ isOpen: true, title: 'Thiếu tiêu đề', description: 'Vui lòng nhập tiêu đề.', type: 'error' });
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            // Step 1: Create content record first to get contentId
            setUploadStatus('Đang tạo nội dung...');
            const slug = generateSlug(formData.title);

            const contentPayload = {
                title: formData.title.trim(),
                slug,
                description: formData.description.trim() || null,
                type: videoFile ? 'VIDEO' : 'QUESTION_SET',
                difficulty: formData.difficulty,
                category: formData.category,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                duration: formData.duration,
                status: 'DRAFT', // Start as draft, upload files, then submit
            };

            const { data: content } = await api.post('/library', contentPayload);
            const contentId = content.id;
            setUploadProgress(10);

            // Step 2: Upload thumbnail if present
            let thumbnailUrl = null;
            if (thumbnailFile) {
                setUploadStatus('Đang tải ảnh bìa...');
                thumbnailUrl = await uploadService.uploadContentThumbnail(contentId, thumbnailFile);
                setUploadProgress(30);
            }

            // Step 3: Upload video if present (with progress)
            let videoUrl = null;
            if (videoFile) {
                setUploadStatus('Đang tải video...');
                videoUrl = await uploadService.uploadContentVideo(contentId, videoFile, (progress) => {
                    setUploadProgress(30 + (progress * 0.5)); // 30-80%
                });
                setUploadProgress(80);
            }

            // Step 4: Upload attachment if present
            let fileUrls: string[] = [];
            if (attachmentFile) {
                setUploadStatus('Đang tải tệp đính kèm...');
                const fileUrl = await uploadService.uploadContentFile(contentId, attachmentFile);
                fileUrls = [fileUrl];
                setUploadProgress(90);
            }

            // Step 5: Update content with file URLs and publish directly (for demo)
            setUploadStatus('Hoàn tất...');
            await api.put(`/library/${contentId}`, {
                thumbnailUrl,
                videoUrl,
                fileUrls,
                status: 'PUBLISHED', // Auto-publish for demo
            });
            setUploadProgress(100);

            setNotification({
                isOpen: true,
                title: 'Đã tạo thành công!',
                description: 'Nội dung đã được xuất bản.',
                type: 'success'
            });

            setTimeout(() => onSuccess(), 1500);

        } catch (error: any) {
            console.error('Error creating content:', error);
            setNotification({
                isOpen: true,
                title: 'Lỗi',
                description: error.message || 'Không thể tạo nội dung. Vui lòng thử lại.',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setUploadStatus('');
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

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Tạo nội dung mới</h2>

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
                        placeholder="Mô tả ngắn về nội dung này..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="rounded-lg"
                    />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Danh mục
                        </label>
                        <div className="relative">
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer"
                            >
                                {CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Độ khó
                        </label>
                        <div className="relative">
                            <select
                                value={formData.difficulty}
                                onChange={e => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white appearance-none cursor-pointer"
                            >
                                {DIFFICULTY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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

                {/* Thumbnail Upload */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Ảnh bìa <span className="text-slate-400 text-xs">(JPG, PNG - tối đa 2MB)</span>
                    </label>
                    <input
                        ref={thumbnailInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleThumbnailChange}
                        className="hidden"
                    />
                    {thumbnailPreview ? (
                        <div className="relative inline-block">
                            <img src={thumbnailPreview} alt="Thumbnail" className="h-24 rounded-lg object-cover" />
                            <button
                                type="button"
                                onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => thumbnailInputRef.current?.click()}>
                            <Image className="w-4 h-4 mr-2" />
                            Chọn ảnh bìa
                        </Button>
                    )}
                </div>

                {/* Video Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Video bài giảng <span className="text-slate-400 text-xs">(MP4, WebM - tối đa 500MB)</span>
                    </label>
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={handleVideoChange}
                        className="hidden"
                    />
                    {videoFile ? (
                        <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <Video className="w-8 h-8 text-purple-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{videoFile.name}</p>
                                <p className="text-xs text-slate-500">{uploadService.formatFileSize(videoFile.size)}</p>
                            </div>
                            <button type="button" onClick={() => setVideoFile(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()}>
                            <Video className="w-4 h-4 mr-2" />
                            Chọn video
                        </Button>
                    )}
                </div>

                {/* File Attachment */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tài liệu đính kèm <span className="text-slate-400 text-xs">(PDF, Word - tối đa 50MB)</span>
                    </label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleAttachmentChange}
                        className="hidden"
                    />
                    {attachmentFile ? (
                        <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                            <FileText className="w-8 h-8 text-cyan-600" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{attachmentFile.name}</p>
                                <p className="text-xs text-slate-500">{uploadService.formatFileSize(attachmentFile.size)}</p>
                            </div>
                            <button type="button" onClick={() => setAttachmentFile(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <FileText className="w-4 h-4 mr-2" />
                            Chọn tệp
                        </Button>
                    )}
                </div>

                {/* Upload Progress */}
                {loading && uploadProgress > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                            <span>{uploadStatus}</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-cyan transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                        Hủy bỏ
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-brand-cyan hover:bg-brand-cyan/90">
                        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {loading ? 'Đang tải lên...' : 'Gửi xét duyệt'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
