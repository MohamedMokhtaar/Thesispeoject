import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import NotificationDrawer from '../components/NotificationDrawer';
import Sidebar from '../components/Sidebar';
import classIssueService from '../api/classIssueService';
import { getUser } from '../utils/auth';

const isUnread = (notification) => {
    const value = notification?.is_read;
    return value === 0 || value === '0' || value === false || value === null || value === undefined;
};

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = getUser();

    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const res = await classIssueService.getNotifications(user.user_id);
            const notifs = res?.success && Array.isArray(res.data) ? res.data : [];
            const count = notifs.filter((notification) => isUnread(notification)).length;
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to fetch notification count', err);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [user?.user_id]);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onNotifClick={() => setIsNotifOpen(true)}
                    unreadCount={unreadCount}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
                    <div className="mx-auto w-full max-w-[1600px]">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>

            <NotificationDrawer
                isOpen={isNotifOpen}
                onClose={() => {
                    setIsNotifOpen(false);
                    fetchUnreadCount();
                }}
                userId={user?.user_id}
            />
        </div>
    );
};

export default DashboardLayout;

