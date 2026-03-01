import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, CheckCheck, Clock3, RefreshCcw, X } from 'lucide-react';
import classIssueService from '../api/classIssueService';

const isUnread = (notification) => {
    const value = notification?.is_read;
    if (value === 0 || value === '0' || value === false || value === null || value === undefined) {
        return true;
    }
    return false;
};

const formatTimestamp = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    const deltaMs = Date.now() - date.getTime();
    const deltaMin = Math.floor(deltaMs / 60000);
    if (deltaMin < 1) return 'Just now';
    if (deltaMin < 60) return `${deltaMin}m ago`;
    if (deltaMin < 1440) return `${Math.floor(deltaMin / 60)}h ago`;
    if (deltaMin < 10080) return `${Math.floor(deltaMin / 1440)}d ago`;
    return date.toLocaleDateString();
};

const NotificationDrawer = ({ isOpen, onClose, userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        if (!userId) {
            setNotifications([]);
            return;
        }

        setLoading(true);
        setErrorMessage('');
        try {
            const res = await classIssueService.getNotifications(userId);
            const items = res?.success && Array.isArray(res.data) ? res.data : [];
            setNotifications(items);
        } catch (err) {
            console.error('Failed to load notifications', err);
            setNotifications([]);
            setErrorMessage('Could not load notifications right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, userId]);

    const unreadCount = useMemo(
        () => notifications.filter((item) => isUnread(item)).length,
        [notifications]
    );

    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'unread') {
            return notifications.filter((item) => isUnread(item));
        }
        return notifications;
    }, [activeFilter, notifications]);

    const handleRead = async (not) => {
        try {
            if (isUnread(not)) {
                await classIssueService.markNotificationRead(not.not_no);
            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item.not_no === not.not_no ? { ...item, is_read: 1 } : item
                )
            );

            // Deep linking logic
            if (not.module === 'ClassIssues' && not.record_id) {
                navigate(`/class-issues/${not.record_id}`);
            } else {
                // Default fallback for other modules
                navigate('/class-issues');
            }
            onClose();
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-2xl">
                <div className="border-b border-slate-200 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                                    <Bell size={16} />
                                </span>
                                <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Latest updates from your modules</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                            <CheckCheck size={15} />
                            <span className="font-medium">Unread</span>
                        </div>
                        <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white">{unreadCount}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilter === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            All
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('unread')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilter === 'unread'
                                    ? 'bg-slate-900 text-white'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            Unread
                        </button>
                        <button
                            type="button"
                            onClick={fetchNotifications}
                            className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                            <RefreshCcw size={12} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {loading ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                            Loading notifications...
                        </div>
                    ) : errorMessage ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <AlertCircle size={16} />
                            </div>
                            <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
                            <button
                                type="button"
                                onClick={fetchNotifications}
                                className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((not) => {
                            const unread = isUnread(not);
                            return (
                            <button
                                key={not.not_no}
                                onClick={() => handleRead(not)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                    unread
                                        ? 'border-blue-200 bg-blue-50/70 shadow-sm shadow-blue-100'
                                        : 'border-slate-200 bg-white'
                                } hover:-translate-y-0.5 hover:shadow-md`}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                            unread ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        <Bell size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="truncate text-sm font-semibold text-slate-900">{not.title || 'Notification'}</h4>
                                            {unread && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{not.message || 'No details'}</p>
                                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                                            <Clock3 size={12} />
                                            <span>{formatTimestamp(not.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            );
                        })
                    ) : (
                        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <Bell size={20} />
                            </div>
                            <p className="text-sm font-semibold text-slate-600">
                                {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">You are all caught up.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationDrawer;
