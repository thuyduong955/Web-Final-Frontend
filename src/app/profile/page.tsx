"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import DefaultAvatar from '@/assets/sidebar-avatar.png';
import MainLayout from '@/components/layout/MainLayout';

export default function ProfilePage() {
    const router = useRouter();
    const { profile } = useAuth();

    // Mock data - trong thực tế sẽ lấy từ API
    const userData = {
        name: profile?.full_name || 'Alex Nguyen',
        email: profile?.email || 'alex.nguyen@example.com',
        role: profile?.role === 'recruiter' ? 'Nhà tuyển dụng' : profile?.role === 'admin' ? 'Quản trị viên' : 'Product Designer',
        gender: 'Female',
        dateOfBirth: 'May 17, 1998',
        location: 'Ho Chi Minh City, Vietnam',
        joined: 'February 2024',
        bio: 'Designs smooth interview experiences and obsesses over delightful flows.',
        mockInterviews: 38,
        currentStreak: 5,
    };

    return (
        <MainLayout>
        <div className="min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User profile</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Manage your identity, security, and activity insights.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Basic Info Card */}
                    <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-white to-cyan-50/30 dark:from-slate-800 dark:to-slate-800">
                        <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full mb-6">
                            BASIC INFO
                        </span>

                        {/* Profile Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-2xl border-2 border-cyan-400 p-1 bg-cyan-50 dark:bg-slate-700">
                                <Avatar className="w-full h-full rounded-xl">
                                    <AvatarImage src={DefaultAvatar.src} className="object-cover rounded-xl" />
                                    <AvatarFallback className="bg-cyan-100 text-cyan-600 text-2xl font-bold rounded-xl">
                                        {userData.name[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{userData.name}</h2>
                                <p className="text-slate-500 dark:text-slate-400">{userData.role}</p>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">NAME</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">EMAIL</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">ROLE</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.role}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">GENDER</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.gender}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">DATE OF BIRTH</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.dateOfBirth}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">LOCATION</p>
                                <p className="text-slate-900 dark:text-white font-medium">{userData.location}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">JOINED</p>
                            <p className="text-slate-900 dark:text-white font-medium">{userData.joined}</p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">BIO</p>
                            <p className="text-slate-600 dark:text-slate-300">{userData.bio}</p>
                        </div>
                    </Card>

                    {/* Activity Card */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-white dark:bg-slate-800">
                            <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full mb-4">
                                ACTIVITY
                            </span>

                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{userData.mockInterviews}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Mock interviews completed</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white">{userData.currentStreak} days</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Current streak</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
        </MainLayout>
    );
}
