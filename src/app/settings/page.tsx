"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Sun, Moon, User, Lock, Save, Eye, EyeOff, Bell, Languages, Trash2, LogOut, Shield, ChevronRight, AlertTriangle, MapPin, Phone, Calendar as CalendarIcon, FileText, Pencil, X, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/services/api';
import uploadService from '@/services/uploadService';
import MainLayout from '@/components/layout/MainLayout';
import DefaultAvatar from '@/assets/sidebar-avatar.png';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'language' | 'account';

// Custom Toggle Switch Component
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (checked: boolean) => void; id: string }) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:ring-offset-2 ${checked ? 'bg-brand-cyan' : 'bg-slate-200 dark:bg-slate-600'
                }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    );
}

function SettingsContent() {
    const { profile, signOut } = useAuth();
    const { theme, setTheme } = useThemeContext();
    const router = useRouter();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [language, setLanguage] = useState<'vi' | 'en'>('vi');

    // Edit mode for profile
    const [isEditMode, setIsEditMode] = useState(false);

    // Profile state
    const [profileData, setProfileData] = useState({
        fullName: '',
        phone: '',
        location: '',
        bio: '',
        gender: '',
        dateOfBirth: '',
        avatar: '',
    });
    const [originalProfileData, setOriginalProfileData] = useState(profileData);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState({
        bookingConfirmation: true,
        interviewReminder: true,
        weeklyDigest: false,
        marketing: false,
    });

    // Delete account
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        if (profile) {
            const pd = profile.profile_data || {};
            const data = {
                fullName: profile.full_name || '',
                phone: String(pd.phone || ''),
                location: String(pd.location || ''),
                bio: String(pd.bio || ''),
                gender: String(pd.gender || ''),
                dateOfBirth: String(pd.dateOfBirth || ''),
                avatar: profile.avatar_url || '',
            };
            setProfileData(data);
            setOriginalProfileData(data);
        }
    }, [profile]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                uploadService.validateImageFile(file, 5);
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAvatarPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } catch (error: any) {
                setProfileMessage({ type: 'error', text: error.message });
            }
        }
    };

    const handleCancelEdit = () => {
        setProfileData(originalProfileData);
        setAvatarPreview(null);
        setAvatarFile(null);
        setIsEditMode(false);
        setProfileMessage(null);
    };

    const handleUpdateProfile = async () => {
        if (!profileData.fullName.trim()) {
            setProfileMessage({ type: 'error', text: 'Tên không được để trống' });
            return;
        }

        setIsUpdatingProfile(true);
        setProfileMessage(null);

        try {
            let avatarUrl = profileData.avatar;

            // Upload avatar to R2 if changed
            if (avatarFile) {
                setIsUploadingAvatar(true);
                try {
                    avatarUrl = await uploadService.uploadAvatar(avatarFile);
                } catch (uploadError: any) {
                    setProfileMessage({ type: 'error', text: 'Lỗi tải ảnh: ' + uploadError.message });
                    return;
                } finally {
                    setIsUploadingAvatar(false);
                }
            }

            await api.put('/auth/profile', {
                name: profileData.fullName,
                phone: profileData.phone,
                location: profileData.location,
                bio: profileData.bio,
                gender: profileData.gender || null,
                dateOfBirth: profileData.dateOfBirth || null,
                avatar: avatarUrl,
            });
            setProfileMessage({ type: 'success', text: 'Cập nhật thành công!' });
            setOriginalProfileData({ ...profileData, avatar: avatarUrl });
            setAvatarFile(null);
            setAvatarPreview(null);
            setIsEditMode(false);
        } catch (error: any) {
            setProfileMessage({
                type: 'error',
                text: error.response?.data?.message || 'Có lỗi xảy ra'
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

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
            await api.put('/auth/change-password', { currentPassword, newPassword });
            setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({
                type: 'error',
                text: error.response?.data?.message || 'Mật khẩu hiện tại không đúng'
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const tabs = [
        { id: 'profile' as SettingsTab, label: 'Hồ sơ', icon: User },
        { id: 'security' as SettingsTab, label: 'Bảo mật', icon: Shield },
        { id: 'notifications' as SettingsTab, label: 'Thông báo', icon: Bell },
        { id: 'language' as SettingsTab, label: 'Giao diện', icon: Languages },
        { id: 'account' as SettingsTab, label: 'Tài khoản', icon: Lock },
    ];

    const genderOptions = [
        { value: '', label: 'Chọn giới tính' },
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
        { value: 'PREFER_NOT_TO_SAY', label: 'Không muốn tiết lộ' },
    ];

    const getGenderLabel = (value: string) => genderOptions.find(o => o.value === value)?.label || '-';

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto p-4 md:p-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Cài đặt</h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Navigation */}
                    <div className="md:w-64 shrink-0">
                        <nav className="bg-white dark:bg-slate-800/50 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700/50">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id
                                        ? 'bg-brand-cyan/10 text-brand-cyan font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Thông tin cá nhân</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {isEditMode ? 'Chỉnh sửa thông tin của bạn' : 'Xem thông tin hiển thị của bạn'}
                                        </p>
                                    </div>
                                    {!isEditMode && (
                                        <Button
                                            onClick={() => setIsEditMode(true)}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            Sửa hồ sơ
                                        </Button>
                                    )}
                                </div>

                                {/* Avatar Section */}
                                <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700/50">
                                    <div className="relative">
                                        <Avatar className="w-24 h-24 border-4 border-white dark:border-slate-700 shadow-lg">
                                            <AvatarImage src={avatarPreview || profileData.avatar || DefaultAvatar.src} />
                                            <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan text-2xl font-bold">
                                                {profileData.fullName?.[0]?.toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isEditMode && (
                                            <>
                                                <input
                                                    ref={avatarInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => avatarInputRef.current?.click()}
                                                    className="absolute bottom-0 right-0 w-8 h-8 bg-brand-cyan hover:bg-brand-cyan/90 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                                                >
                                                    <Camera className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                                            {profileData.fullName || 'Chưa cập nhật'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400">{profile?.email}</p>
                                        <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-brand-cyan/10 text-brand-cyan text-sm font-medium rounded-full">
                                            <User className="w-3.5 h-3.5" />
                                            {profile?.role === 'INTERVIEWER' ? 'Người phỏng vấn' : 'Ứng viên'}
                                        </span>
                                    </div>
                                </div>

                                {/* Profile Fields */}
                                <div className="space-y-5">
                                    {/* Email (always readonly) */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={profile?.email || ''}
                                            disabled
                                            className="bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi</p>
                                    </div>

                                    {/* Full Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Họ và tên
                                        </label>
                                        {isEditMode ? (
                                            <Input
                                                type="text"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData(p => ({ ...p, fullName: e.target.value }))}
                                                placeholder="Nhập họ và tên"
                                            />
                                        ) : (
                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white">
                                                {profileData.fullName || '-'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Số điện thoại
                                        </label>
                                        {isEditMode ? (
                                            <Input
                                                type="tel"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                                                placeholder="0912 345 678"
                                            />
                                        ) : (
                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white">
                                                {profileData.phone || '-'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Địa điểm
                                        </label>
                                        {isEditMode ? (
                                            <Input
                                                type="text"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData(p => ({ ...p, location: e.target.value }))}
                                                placeholder="TP. Hồ Chí Minh, Việt Nam"
                                            />
                                        ) : (
                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white">
                                                {profileData.location || '-'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Gender & Date of Birth */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Giới tính
                                            </label>
                                            {isEditMode ? (
                                                <select
                                                    value={profileData.gender}
                                                    onChange={(e) => setProfileData(p => ({ ...p, gender: e.target.value as any }))}
                                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan"
                                                >
                                                    {genderOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white">
                                                    {getGenderLabel(profileData.gender)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                Ngày sinh
                                            </label>
                                            {isEditMode ? (
                                                <Input
                                                    type="date"
                                                    value={profileData.dateOfBirth}
                                                    onChange={(e) => setProfileData(p => ({ ...p, dateOfBirth: e.target.value }))}
                                                />
                                            ) : (
                                                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white">
                                                    {profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Giới thiệu bản thân
                                        </label>
                                        {isEditMode ? (
                                            <Textarea
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData(p => ({ ...p, bio: e.target.value }))}
                                                placeholder="Viết vài dòng giới thiệu về bản thân..."
                                                rows={4}
                                                className="resize-none"
                                            />
                                        ) : (
                                            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-slate-900 dark:text-white min-h-[80px]">
                                                {profileData.bio || '-'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Messages & Buttons */}
                                    {profileMessage && (
                                        <div className={`p-3 rounded-xl text-sm ${profileMessage.type === 'success'
                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            }`}>
                                            {profileMessage.text}
                                        </div>
                                    )}

                                    {isEditMode && (
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                onClick={handleCancelEdit}
                                                variant="outline"
                                                className="gap-2"
                                            >
                                                <X className="w-4 h-4" />
                                                Hủy
                                            </Button>
                                            <Button
                                                onClick={handleUpdateProfile}
                                                disabled={isUpdatingProfile}
                                                className="bg-brand-cyan hover:bg-brand-cyan/90 text-white gap-2"
                                            >
                                                <Save className="w-4 h-4" />
                                                {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Bảo mật</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Đổi mật khẩu để bảo vệ tài khoản
                                </p>

                                <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
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
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
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
                                                    placeholder="Ít nhất 6 ký tự"
                                                    autoComplete="new-password"
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
                                                    autoComplete="new-password"
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
                                            <div className={`p-3 rounded-xl text-sm ${passwordMessage.type === 'success'
                                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                                }`}>
                                                {passwordMessage.text}
                                            </div>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={isUpdatingPassword}
                                            className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            {isUpdatingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Thông báo email</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    Chọn loại thông báo bạn muốn nhận qua email
                                </p>

                                <div className="space-y-4">
                                    {[
                                        { key: 'bookingConfirmation', label: 'Xác nhận đặt lịch', desc: 'Nhận email khi đặt lịch phỏng vấn thành công' },
                                        { key: 'interviewReminder', label: 'Nhắc nhở phỏng vấn', desc: 'Nhận email nhắc nhở 1 giờ trước buổi phỏng vấn' },
                                        { key: 'weeklyDigest', label: 'Tổng hợp hàng tuần', desc: 'Nhận tổng hợp hoạt động mỗi tuần' },
                                        { key: 'marketing', label: 'Tin tức & Khuyến mãi', desc: 'Nhận thông tin về tính năng mới và ưu đãi' },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-600/50 hover:border-brand-cyan/30 transition-colors"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900 dark:text-white">{item.label}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</div>
                                            </div>
                                            <Toggle
                                                id={`toggle-${item.key}`}
                                                checked={emailNotifications[item.key as keyof typeof emailNotifications]}
                                                onChange={(checked) => setEmailNotifications(prev => ({
                                                    ...prev,
                                                    [item.key]: checked
                                                }))}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <Button className="mt-6 bg-brand-cyan hover:bg-brand-cyan/90 text-white">
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu cài đặt
                                </Button>
                            </div>
                        )}

                        {/* Language Tab */}
                        {activeTab === 'language' && (
                            <div className="space-y-6">
                                {/* Theme */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        {theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                        Giao diện
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Chọn chế độ hiển thị
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                                ? 'border-brand-cyan bg-brand-cyan/10'
                                                : 'border-slate-200 dark:border-slate-600/50 hover:border-slate-300'
                                                }`}
                                        >
                                            <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-brand-cyan' : 'text-slate-400'}`} />
                                            <span className={`font-medium ${theme === 'light' ? 'text-brand-cyan' : 'text-slate-600 dark:text-slate-300'}`}>
                                                Sáng
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                                ? 'border-brand-cyan bg-brand-cyan/10'
                                                : 'border-slate-200 dark:border-slate-600/50 hover:border-slate-300'
                                                }`}
                                        >
                                            <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-brand-cyan' : 'text-slate-400'}`} />
                                            <span className={`font-medium ${theme === 'dark' ? 'text-brand-cyan' : 'text-slate-600 dark:text-slate-300'}`}>
                                                Tối
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Languages className="w-5 h-5" />
                                        Ngôn ngữ
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Chọn ngôn ngữ hiển thị
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setLanguage('vi')}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${language === 'vi'
                                                ? 'border-brand-cyan bg-brand-cyan/10'
                                                : 'border-slate-200 dark:border-slate-600/50 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="text-2xl">🇻🇳</span>
                                            <span className={`font-medium ${language === 'vi' ? 'text-brand-cyan' : 'text-slate-600 dark:text-slate-300'}`}>
                                                Tiếng Việt
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => setLanguage('en')}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${language === 'en'
                                                ? 'border-brand-cyan bg-brand-cyan/10'
                                                : 'border-slate-200 dark:border-slate-600/50 hover:border-slate-300'
                                                }`}
                                        >
                                            <span className="text-2xl">🇬🇧</span>
                                            <span className={`font-medium ${language === 'en' ? 'text-brand-cyan' : 'text-slate-600 dark:text-slate-300'}`}>
                                                English
                                            </span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3">
                                        * Tính năng đa ngôn ngữ đang được phát triển
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <div className="space-y-6">
                                {/* Logout */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                        <LogOut className="w-5 h-5" />
                                        Đăng xuất
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Đăng xuất khỏi tài khoản trên thiết bị này
                                    </p>
                                    <Button
                                        onClick={handleLogout}
                                        variant="outline"
                                        className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700/50"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Đăng xuất
                                    </Button>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-200 dark:border-red-800/30">
                                    <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Vùng nguy hiểm
                                    </h2>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/70 mb-4">
                                        Xóa tài khoản vĩnh viễn. Hành động này không thể hoàn tác.
                                    </p>

                                    {!showDeleteConfirm ? (
                                        <Button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-700/50 dark:text-red-400 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Xóa tài khoản
                                        </Button>
                                    ) : (
                                        <div className="space-y-4 p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-red-200 dark:border-red-800/30">
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                Nhập <strong className="text-red-600">XOA TAI KHOAN</strong> để xác nhận:
                                            </p>
                                            <Input
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                placeholder="XOA TAI KHOAN"
                                                className="border-red-200 focus:border-red-400 focus:ring-red-400/20 dark:border-red-800/50"
                                            />
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeleteConfirmText('');
                                                    }}
                                                    variant="outline"
                                                    className="flex-1"
                                                >
                                                    Hủy
                                                </Button>
                                                <Button
                                                    disabled={deleteConfirmText !== 'XOA TAI KHOAN'}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Xóa vĩnh viễn
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
                </div>
            </MainLayout>
        }>
            <SettingsContent />
        </Suspense>
    );
}
