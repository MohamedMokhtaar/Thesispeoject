import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Shield, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../utils/auth';

const Header = ({ onMenuClick, onNotifClick, unreadCount }) => {
    const user = getUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const pageTitle = useMemo(() => {
        if (location.pathname.startsWith('/student-management')) return 'Student Management';
        if (location.pathname.startsWith('/teacher-management')) return 'Teacher Management';
        if (location.pathname.startsWith('/academic-structure')) return 'Academic Structure';
        if (location.pathname.startsWith('/exam-appeals')) return 'Exam Appeals';
        if (location.pathname.startsWith('/exam-menu')) return 'Exam Menu';
        if (location.pathname.startsWith('/reporting')) return 'Reporting';
        if (location.pathname.startsWith('/class-issues')) return 'Class Issues';
        if (location.pathname.startsWith('/class-management')) return 'Class Management';
        if (location.pathname.startsWith('/campus-environment')) return 'Campus Environment';
        if (location.pathname.startsWith('/messaging-support')) return 'Messaging / Support';
        if (location.pathname.startsWith('/settings')) return 'Settings';
        if (location.pathname.startsWith('/profile')) return 'Profile';
        return 'Dashboard';
    }, [location.pathname]);

    useEffect(() => {
        const onClickOutside = (event) => {
            if (!menuRef.current || menuRef.current.contains(event.target)) {
                return;
            }
            setIsMenuOpen(false);
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 lg:hidden">
                    <Menu size={20} />
                </button>
                <div>
                    <p className="text-sm font-semibold text-black">{pageTitle}</p>
                    <p className="text-xs text-gray-500">University Thesis Appeal System</p>
                </div>
            </div>

            <div className="flex items-center gap-2" ref={menuRef}>
                <button
                    onClick={onNotifClick}
                    className="group relative rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 transition hover:bg-gray-50"
                    >
                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-semibold leading-none text-black">{user?.display_name || user?.username}</p>
                            <p className="mt-1 text-[10px] text-gray-500">{user?.role_name}</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                            <User size={16} />
                        </div>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                            <button
                                onClick={() => {
                                    navigate('/profile');
                                    setIsMenuOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition hover:bg-blue-50"
                            >
                                <User size={14} className="text-blue-600" />
                                <span>Profile</span>
                            </button>

                            <button
                                type="button"
                                disabled
                                className="flex w-full cursor-not-allowed items-center gap-3 px-4 py-2 text-sm text-gray-400"
                            >
                                <Shield size={14} />
                                <span>Security</span>
                            </button>

                            <div className="my-2 border-t border-gray-100" />

                            <button
                                onClick={logout}
                                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                            >
                                <LogOut size={14} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

