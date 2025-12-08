"use client";

import React from 'react';
import SidebarNav from "@/components/layout/SidebarNav";

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
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
