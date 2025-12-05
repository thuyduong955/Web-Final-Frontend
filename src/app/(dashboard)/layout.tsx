"use client";

import SidebarNav from "@/components/layout/SidebarNav";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthPage } from "@/components/auth/AuthPage";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* <ProtectedRoute fallback={<AuthPage />}> */}
            {/* Temporarily disable ProtectedRoute until AuthPage is fully migrated */}
            <SidebarNav />
            <main className="flex-1 overflow-auto bg-muted/10">
                {children}
            </main>
            {/* </ProtectedRoute> */}
        </div>
    );
}
