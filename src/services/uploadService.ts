import api from './api';

interface UploadResponse {
    url: string;
    key: string;
    filename?: string;
}

/**
 * Upload service for R2 storage
 * Uploads files to backend, which then uploads to R2
 */
export const uploadService = {
    // ═══════════════════════════════════════════════════════════════
    // AVATAR
    // ═══════════════════════════════════════════════════════════════
    async uploadAvatar(file: File): Promise<string> {
        this.validateImageFile(file, 5);

        const formData = new FormData();
        formData.append('file', file);

        // Don't set Content-Type manually - axios will set it with boundary
        const { data } = await api.post<UploadResponse>('/upload/avatar', formData);

        return data.url;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT THUMBNAIL
    // ═══════════════════════════════════════════════════════════════
    async uploadContentThumbnail(contentId: string, file: File): Promise<string> {
        this.validateImageFile(file, 2);

        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<UploadResponse>(`/upload/content/${contentId}/thumbnail`, formData);

        return data.url;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT VIDEO
    // ═══════════════════════════════════════════════════════════════
    async uploadContentVideo(
        contentId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        this.validateVideoFile(file, 500);

        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<UploadResponse>(`/upload/content/${contentId}/video`, formData, {
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    onProgress(progress);
                }
            },
        });

        return data.url;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT FILE (attachments)
    // ═══════════════════════════════════════════════════════════════
    async uploadContentFile(contentId: string, file: File): Promise<string> {
        if (file.size > 50 * 1024 * 1024) {
            throw new Error('File size must be less than 50MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<UploadResponse>(`/upload/content/${contentId}/file`, formData);

        return data.url;
    },

    // ═══════════════════════════════════════════════════════════════
    // CV/RESUME
    // ═══════════════════════════════════════════════════════════════
    async uploadCV(file: File): Promise<string> {
        if (file.type !== 'application/pdf') {
            throw new Error('CV must be a PDF file');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new Error('CV size must be less than 10MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<UploadResponse>('/upload/cv', formData);

        return data.url;
    },

    // ═══════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════
    validateImageFile(file: File, maxSizeMB = 5): void {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid image type. Allowed: JPG, PNG, WebP, GIF');
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`Image size must be less than ${maxSizeMB}MB`);
        }
    },

    validateVideoFile(file: File, maxSizeMB = 500): void {
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid video type. Allowed: MP4, WebM, MOV');
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            throw new Error(`Video size must be less than ${maxSizeMB}MB`);
        }
    },

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
        return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    },
};

export default uploadService;
