"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SidebarNav from "@/components/layout/SidebarNav";
import { Loader2 } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to login if not authenticated (after loading)
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    // Don't render content if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <SidebarNav />
            <main className="flex-1 overflow-auto bg-muted/10">
                {children}
            </main>
        </div>
    );
}

export default MainLayout;
