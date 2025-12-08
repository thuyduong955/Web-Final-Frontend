"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Sun, Moon, User, Lock, Save, Eye, EyeOff, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import MainLayout from '@/components/layout/MainLayout';

export default function SettingsPage() {
    const { profile } = useAuth();
    const { theme, setTheme } = useThemeContext();
    const router = useRouter();
    
    // Profile state
    const [fullName, setFullName] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load profile data
    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name);
        }
    }, [profile]);

    // Handle theme change
    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        setTheme(newTheme);
    };

    // Handle profile update
    const handleUpdateProfile = async () => {
        if (!fullName.trim()) {
            setProfileMessage({ type: 'error', text: 'Tên không được để trống' });
            return;
        }

        setIsUpdatingProfile(true);
        setProfileMessage(null);

        try {
            await api.put('/auth/profile', { name: fullName });
            setProfileMessage({ type: 'success', text: 'Cập nhật tên thành công!' });
        } catch (error: any) {
            setProfileMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tên' 
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // Handle password change
    const handleChangePassword = async () => {
        setPasswordMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các trường' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        setIsUpdatingPassword(true);

        try {
            await api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu' 
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <MainLayout>
        <div className="max-w-2xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cài đặt</h1>
            </div>

            {/* Theme Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    Giao diện
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Chọn giao diện hiển thị cho ứng dụng
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => handleThemeChange('light')}
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            theme === 'light'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                    >
                        <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-cyan-500' : 'text-slate-400'}`} />
                        <span className={`font-medium ${theme === 'light' ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            Sáng
                        </span>
                    </button>
                    <button
                        onClick={() => handleThemeChange('dark')}
                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                            theme === 'dark'
                                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                    >
                        <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-cyan-500' : 'text-slate-400'}`} />
                        <span className={`font-medium ${theme === 'dark' ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300'}`}>
                            Tối
                        </span>
                    </button>
                </div>
            </div>

            {/* Profile Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Thông tin cá nhân
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Cập nhật tên hiển thị của bạn
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            className="bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Họ và tên
                        </label>
                        <Input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Nhập họ và tên"
                        />
                    </div>
                    {profileMessage && (
                        <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {profileMessage.text}
                        </p>
                    )}
                    <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>

            {/* Password Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Đổi mật khẩu
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Đảm bảo tài khoản của bạn được bảo mật với mật khẩu mạnh
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Mật khẩu hiện tại
                        </label>
                        <div className="relative">
                            <Input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Nhập mật khẩu hiện tại"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Mật khẩu mới
                        </label>
                        <div className="relative">
                            <Input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    {passwordMessage && (
                        <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                    <Button
                        onClick={handleChangePassword}
                        disabled={isUpdatingPassword}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        {isUpdatingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </Button>
                </div>
            </div>
        </div>
        </MainLayout>
    );
}
