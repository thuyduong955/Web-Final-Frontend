"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
    Swords,
    Library,
    Calendar,
    HelpCircle,
    Settings,
    LogOut,
    LucideIcon
} from 'lucide-react';
import DefaultAvatar from '@/assets/sidebar-avatar.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const NAV_ITEMS = [
    { id: 'training1v1', label: 'Luyện tập 1v1', icon: Swords },
    { id: 'library', label: 'Thư viện bài học', icon: Library },
    { id: 'calendar', label: 'Lịch luyện tập', icon: Calendar },
];

const FOOTER_ITEMS = [
    { id: 'support', label: 'Hỗ trợ', icon: HelpCircle },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'logout', label: 'Đăng xuất', icon: LogOut, tone: 'danger' },
];

function Icon({ icon: IconComponent, active, isDanger }: { icon: LucideIcon; active?: boolean; isDanger?: boolean }) {
    return (
        <IconComponent
            aria-hidden="true"
            className={`w-[26px] h-[26px] transition-all duration-150 ${active
                ? 'text-[#62d1ee] stroke-[#62d1ee]'
                : isDanger
                    ? 'text-[#f04b4b] stroke-[#f04b4b]'
                    : 'text-[#1f2a37] dark:text-slate-300 stroke-[#1f2a37] dark:stroke-slate-300'
                }`}
        />
    );
}

export interface SidebarNavProps {
    activeId?: string;
    onChange?: (id: string) => void;
}

export function SidebarNav({ activeId, onChange }: SidebarNavProps) {
    const { signOut, profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const routeMap: Record<string, string> = {
        home: '/dashboard',
        training1v1: '/training1v1',
        library: '/library',
        calendar: '/calendar',
    };

    const derivedActive: string = activeId || (
        pathname?.startsWith('/training1v1') ? 'training1v1'
            : pathname?.startsWith('/library') ? 'library'
                : pathname?.startsWith('/calendar') ? 'calendar'
                    : 'home'
    );

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <aside
            className="w-[72px] m-6 ml-6 p-2 bg-white dark:bg-slate-800 border border-[#10182814] dark:border-slate-700 rounded-[24px] flex flex-col items-center gap-8 shadow-[0_25px_45px_rgba(13,38,76,0.08)] dark:shadow-[0_25px_45px_rgba(0,0,0,0.3)] sticky top-6 self-start max-h-[calc(100vh-3rem)] z-50 transition-colors duration-300"
            aria-label="Thanh tác vụ"
        >
            <div className="flex flex-col items-center gap-4 w-full">
                {/* Profile Section with Hover Card */}
                <div className="relative group">
                    <div
                        className="w-14 h-14 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 cursor-pointer transition-transform hover:scale-105"
                        onClick={() => router.push('/profile')}
                        title="Xem hồ sơ"
                    >
                        <Avatar className="w-full h-full">
                            <AvatarImage src={DefaultAvatar.src} className="object-cover" />
                            <AvatarFallback className="bg-brand-cyan/10 text-brand-cyan font-bold">
                                {profile?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Hover Profile Card */}
                    {profile && (
                        <div className="absolute left-full top-0 ml-4 w-64 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-x-[-10px] group-hover:translate-x-0 z-50">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar className="w-12 h-12 border border-slate-100 dark:border-slate-600">
                                    <AvatarImage src={DefaultAvatar.src} />
                                    <AvatarFallback>{profile.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{profile.full_name || 'User'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{profile.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                    {profile.role === 'recruiter' ? 'Nhà tuyển dụng' : profile.role === 'admin' ? 'Quản trị viên' : 'Ứng viên'}
                                </Badge>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Online" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-12 h-px bg-[#1018281f] dark:bg-slate-600" />

                <nav className="flex flex-col gap-[1.1rem] items-center w-full" aria-label="Điều hướng nhanh">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.id === derivedActive;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-label={item.label}
                                title={item.label}
                                className={`w-11 h-11 rounded-full grid place-items-center cursor-pointer transition-all duration-150 border group relative ${isActive
                                    ? 'bg-[#62d1ee26] border-[#62d1ee99]'
                                    : 'bg-transparent border-transparent hover:border-[#62d1ee80]'
                                    }`}
                                onClick={() => {
                                    if (onChange) {
                                        onChange(item.id);
                                    } else {
                                        const to = routeMap[item.id] || '/';
                                        router.push(to);
                                    }
                                }}
                                aria-pressed={isActive}
                            >
                                <Icon icon={item.icon} active={isActive} />

                                {/* Tooltip for Nav Items */}
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="flex flex-col gap-[1.1rem] items-center pt-4 mt-2 border-t border-[#1018281a] w-full" aria-label="Tác vụ bổ sung">
                {FOOTER_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        aria-label={item.label}
                        title={item.label}
                        className={`w-11 h-11 rounded-full grid place-items-center cursor-pointer transition-all duration-150 border bg-transparent border-transparent hover:bg-slate-50 group relative ${item.tone === 'danger' ? 'hover:bg-red-50' : ''}`}
                        onClick={() => {
                            if (item.id === 'logout') {
                                setShowLogoutDialog(true);
                            } else if (onChange) {
                                onChange(item.id);
                            } else {
                                if (item.id === 'settings') router.push('/settings');
                                if (item.id === 'support') router.push('/support');
                            }
                        }}
                    >
                        <Icon icon={item.icon} isDanger={item.tone === 'danger'} />

                        {/* Tooltip for Footer Items */}
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                            {item.label}
                        </div>
                    </button>
                ))}
            </div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            Đăng xuất
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </aside>
    );
}

export default SidebarNav;
