"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, ChevronDown, ChevronUp, HelpCircle, Key, User, Settings, Mail, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';

interface FAQItem {
    id: number;
    question: string;
    answer: string;
    icon: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        id: 1,
        question: 'Cách đổi tên',
        answer: 'Để đổi tên, bạn vào trang Cài đặt (Settings) từ thanh điều hướng bên trái. Trong phần "Thông tin cá nhân", nhập tên mới vào ô "Họ và tên" và nhấn nút "Lưu thay đổi".',
        icon: <User className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 2,
        question: 'Cách đổi mật khẩu',
        answer: 'Để đổi mật khẩu, vào trang Cài đặt (Settings). Cuộn xuống phần "Đổi mật khẩu", nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới. Sau đó nhấn nút "Đổi mật khẩu".',
        icon: <Key className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 3,
        question: 'Cách thay đổi giao diện sáng/tối',
        answer: 'Vào trang Cài đặt (Settings), trong phần "Giao diện" bạn có thể chọn chế độ Sáng hoặc Tối. Thay đổi sẽ được áp dụng ngay lập tức cho toàn bộ ứng dụng.',
        icon: <Settings className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 4,
        question: 'Cách xem hồ sơ cá nhân',
        answer: 'Nhấn vào avatar của bạn ở đầu thanh điều hướng bên trái (ribbon) để truy cập trang hồ sơ cá nhân. Tại đây bạn có thể xem thông tin cá nhân và thống kê hoạt động.',
        icon: <User className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 5,
        question: 'Cách liên hệ hỗ trợ',
        answer: 'Bạn có thể liên hệ với chúng tôi qua email: support@aiinterview.com hoặc gọi hotline: 1900-1234. Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24 giờ làm việc.',
        icon: <Mail className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 6,
        question: 'Cách bảo mật tài khoản',
        answer: 'Để bảo mật tài khoản, hãy sử dụng mật khẩu mạnh (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt). Không chia sẻ mật khẩu với bất kỳ ai và đổi mật khẩu định kỳ.',
        icon: <Shield className="w-5 h-5 text-cyan-500" />,
    },
    {
        id: 7,
        question: 'Cách bật/tắt thông báo',
        answer: 'Hiện tại tính năng quản lý thông báo đang được phát triển. Bạn sẽ có thể tùy chỉnh thông báo email và push notification trong các bản cập nhật tiếp theo.',
        icon: <Bell className="w-5 h-5 text-cyan-500" />,
    },
];

export default function SupportPage() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <MainLayout>
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hỗ trợ</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Tìm câu trả lời cho các câu hỏi thường gặp hoặc liên hệ với chúng tôi.
                </p>

                {/* FAQ Section */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <HelpCircle className="w-6 h-6 text-cyan-500" />
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Câu hỏi thường gặp</h2>
                    </div>

                    <div className="space-y-3">
                        {FAQ_ITEMS.map((item) => (
                            <Card
                                key={item.id}
                                className="overflow-hidden transition-all duration-200"
                            >
                                <button
                                    onClick={() => toggleExpand(item.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {item.question}
                                        </span>
                                    </div>
                                    {expandedId === item.id ? (
                                        <ChevronUp className="w-5 h-5 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    )}
                                </button>
                                {expandedId === item.id && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="pl-8 text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-l-2 border-cyan-200 dark:border-cyan-800 ml-2.5">
                                            {item.answer}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Contact Section */}
                <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Vẫn cần hỗ trợ?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Liên hệ với chúng tôi qua:
                    </p>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                        <p><span className="font-medium">Email:</span> support@example.com</p>
                        <p><span className="font-medium">Điện thoại:</span> 1900-xxxx-xxx</p>
                        <p><span className="font-medium">Giờ làm việc:</span> 8:00 - 17:00 (Thứ 2 - Thứ 6)</p>
                    </div>
                </Card>
            </div>
        </div>
        </MainLayout>
    );
}
