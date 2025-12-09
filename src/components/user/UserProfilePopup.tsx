"use client";

import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, Briefcase, Clock, MapPin, Mail, Phone, Linkedin, FileText, Loader2, X } from 'lucide-react';

interface UserProfileData {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    bio: string | null;
    phone: string | null;
    location: string | null;
    role: string;
    interviewerProfile?: {
        title: string | null;
        company: string | null;
        bio: string | null;
        skills: string[];
        experience: number;
        hourlyRate: number;
        rating: number;
        totalReviews: number;
        totalSessions: number;
        linkedinUrl: string | null;
        cvUrl: string | null;
    } | null;
    reviewsReceived?: {
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        author: {
            name: string;
            avatar: string | null;
        };
    }[];
}

interface UserProfilePopupProps {
    userId: string;
    trigger?: React.ReactNode;
    // For simple trigger with name/avatar
    userName?: string;
    userAvatar?: string | null;
    userTitle?: string;
}

export function UserProfilePopup({
    userId,
    trigger,
    userName,
    userAvatar,
    userTitle
}: UserProfilePopupProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && !profile) {
            fetchProfile();
        }
    }, [open]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            // Try interviewer endpoint first, fallback to basic user info
            try {
                const { data } = await api.get<UserProfileData>(`/users/interviewers/${userId}`);
                setProfile(data);
            } catch {
                // If not an interviewer, try to get basic info from booking or use provided data
                setProfile({
                    id: userId,
                    name: userName || 'User',
                    email: '',
                    avatar: userAvatar || null,
                    bio: null,
                    phone: null,
                    location: null,
                    role: 'INTERVIEWEE',
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Không thể tải thông tin người dùng');
        }
        setLoading(false);
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`}
            />
        ));
    };

    // Default trigger: avatar + name
    const defaultTrigger = (
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0 overflow-hidden">
                {userAvatar ? (
                    <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                    userName?.charAt(0).toUpperCase() || '?'
                )}
            </div>
            <div className="text-left">
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {userName || 'User'}
                </p>
                {userTitle && (
                    <p className="text-xs text-slate-500">{userTitle}</p>
                )}
            </div>
        </button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thông tin người dùng</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchProfile}>
                            Thử lại
                        </Button>
                    </div>
                )}

                {!loading && !error && profile && (
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    profile.name?.charAt(0).toUpperCase() || '?'
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {profile.name || 'User'}
                                </h3>
                                {profile.interviewerProfile?.title && (
                                    <p className="text-slate-600 dark:text-slate-400">
                                        {profile.interviewerProfile.title}
                                    </p>
                                )}
                                {profile.interviewerProfile?.company && (
                                    <p className="text-cyan-600 dark:text-cyan-400 text-sm">
                                        @ {profile.interviewerProfile.company}
                                    </p>
                                )}

                                {/* Role badge */}
                                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${profile.role === 'INTERVIEWER'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    }`}>
                                    {profile.role === 'INTERVIEWER' ? 'Mentor/Interviewer' : 'Interviewee'}
                                </span>
                            </div>
                        </div>

                        {/* Stats for Interviewer */}
                        {profile.interviewerProfile && (
                            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        {renderStars(profile.interviewerProfile.rating || 0)}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {profile.interviewerProfile.rating?.toFixed(1) || '0.0'} ({profile.interviewerProfile.totalReviews || 0})
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {profile.interviewerProfile.experience || 0}
                                    </p>
                                    <p className="text-xs text-slate-500">Năm KN</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {profile.interviewerProfile.totalSessions || 0}
                                    </p>
                                    <p className="text-xs text-slate-500">Buổi</p>
                                </div>
                            </div>
                        )}

                        {/* Bio */}
                        {(profile.bio || profile.interviewerProfile?.bio) && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Giới thiệu
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {profile.interviewerProfile?.bio || profile.bio}
                                </p>
                            </div>
                        )}

                        {/* Skills */}
                        {profile.interviewerProfile?.skills && profile.interviewerProfile.skills.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Kỹ năng
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {profile.interviewerProfile.skills.map((skill, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 text-xs bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            {profile.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="w-4 h-4" />
                                    {profile.email}
                                </div>
                            )}
                            {profile.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Phone className="w-4 h-4" />
                                    {profile.phone}
                                </div>
                            )}
                            {profile.location && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <MapPin className="w-4 h-4" />
                                    {profile.location}
                                </div>
                            )}
                        </div>

                        {/* Links */}
                        {(profile.interviewerProfile?.linkedinUrl || profile.interviewerProfile?.cvUrl) && (
                            <div className="flex gap-2 pt-2">
                                {profile.interviewerProfile?.linkedinUrl && (
                                    <a
                                        href={profile.interviewerProfile.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                        LinkedIn
                                    </a>
                                )}
                                {profile.interviewerProfile?.cvUrl && (
                                    <a
                                        href={profile.interviewerProfile.cvUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Xem CV
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Recent Reviews */}
                        {profile.reviewsReceived && profile.reviewsReceived.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Đánh giá gần đây
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {profile.reviewsReceived.slice(0, 3).map((review) => (
                                        <div key={review.id} className="text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                            <div className="flex items-center gap-1 mb-1">
                                                {renderStars(review.rating)}
                                                <span className="text-xs text-slate-400 ml-auto">
                                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                                                    "{review.comment}"
                                                </p>
                                            )}
                                            <p className="text-xs text-slate-400 mt-1">
                                                - {review.author.name}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hourly Rate */}
                        {profile.interviewerProfile?.hourlyRate && (
                            <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg">
                                <p className="text-center">
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                        {profile.interviewerProfile.hourlyRate.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="text-slate-500"> /60 phút</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default UserProfilePopup;
