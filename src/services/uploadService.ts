import api from './api';

interface PresignedUrlResponse {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    maxSize: number;
    contentType: string;
}

/**
 * Upload service for R2 storage
 * Handles avatar, content thumbnails, videos, files, and CVs
 */
export const uploadService = {
    // ═══════════════════════════════════════════════════════════════
    // AVATAR
    // ═══════════════════════════════════════════════════════════════
    async uploadAvatar(file: File): Promise<string> {
        // Get presigned URL from backend
        const { data } = await api.post<PresignedUrlResponse>('/upload/avatar', {
            fileType: file.type,
        });

        // Validate file size
        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        // Upload directly to R2
        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        return data.publicUrl;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT THUMBNAIL
    // ═══════════════════════════════════════════════════════════════
    async uploadContentThumbnail(contentId: string, file: File): Promise<string> {
        const { data } = await api.post<PresignedUrlResponse>(`/upload/content/${contentId}/thumbnail`, {
            fileType: file.type,
        });

        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT VIDEO
    // ═══════════════════════════════════════════════════════════════
    async uploadContentVideo(
        contentId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        const { data } = await api.post<PresignedUrlResponse>(`/upload/content/${contentId}/video`, {
            fileType: file.type,
        });

        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        // Use XMLHttpRequest for progress tracking
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data.publicUrl);
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('PUT', data.uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
        });
    },

    // ═══════════════════════════════════════════════════════════════
    // CONTENT FILE (attachments)
    // ═══════════════════════════════════════════════════════════════
    async uploadContentFile(contentId: string, file: File): Promise<string> {
        const { data } = await api.post<PresignedUrlResponse>(`/upload/content/${contentId}/file`, {
            fileName: file.name,
            fileType: file.type,
        });

        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
    },

    // ═══════════════════════════════════════════════════════════════
    // CV/RESUME
    // ═══════════════════════════════════════════════════════════════
    async uploadCV(file: File): Promise<string> {
        if (file.type !== 'application/pdf') {
            throw new Error('CV must be a PDF file');
        }

        const { data } = await api.post<PresignedUrlResponse>('/upload/cv', {
            fileType: file.type,
        });

        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
    },

    // ═══════════════════════════════════════════════════════════════
    // GENERIC FILE UPLOAD
    // ═══════════════════════════════════════════════════════════════
    async uploadFile(file: File): Promise<string> {
        const { data } = await api.post<PresignedUrlResponse>('/upload/presign', {
            fileName: file.name,
            fileType: file.type,
        });

        if (file.size > data.maxSize) {
            throw new Error(`File size exceeds ${data.maxSize / 1024 / 1024}MB limit`);
        }

        await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
        });

        return data.publicUrl;
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
