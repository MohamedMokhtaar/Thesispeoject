import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    BookOpen,
    ChevronDown,
    FileText,
    LayoutDashboard,
    MessageSquare,
    Settings,
    ShieldCheck,
    UserCheck,
    Users
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';

const menuSections = [
    {
        title: 'Main',
        items: [
            {
                key: 'dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                path: '/dashboard',
                roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher']
            }
        ]
    },
    {
        title: 'Management',
        items: [
            {
                key: 'academic-structure',
                label: 'Academic Section',
                icon: BookOpen,
                path: '/academic-structure',
                roles: ['SuperAdmin', 'Admin', 'Faculty']
            },
            {
                key: 'student-management',
                label: 'Student Management',
                icon: Users,
                path: '/student-management',
                roles: ['SuperAdmin', 'Admin']
            },
            {
                key: 'teacher-management',
                label: 'Teacher Management',
                icon: UserCheck,
                path: '/teacher-management',
                roles: ['SuperAdmin', 'Admin']
            },
            {
                key: 'exam-menu',
                label: 'Exam Menu',
                icon: FileText,
                path: '/exam-menu',
                roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher']
            }
        ]
    },
    {
        title: 'Appeals',
        items: [
            {
                key: 'exam-appeals',
                label: 'Exam Appeals',
                icon: FileText,
                path: '/exam-appeals',
                roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher'],
                children: [
                    {
                        key: 'allow-appeals',
                        label: 'Allow Appeals',
                        path: '/exam-appeals?tab=allow-appeals',
                        roles: ['SuperAdmin', 'Admin', 'HeadOfExam']
                    },
                    {
                        key: 'coursework-appeal',
                        label: 'Course Work Appeal',
                        path: '/exam-appeals?tab=coursework-appeal',
                        roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher']
                    },
                    {
                        key: 'exam-paper-appeals',
                        label: 'Exam Paper Appeals',
                        path: '/exam-appeals?tab=exam-paper-appeals',
                        roles: ['SuperAdmin', 'Admin', 'HeadOfExam']
                    },
                    {
                        key: 'tracking',
                        label: 'Tracking',
                        path: '/exam-appeals?tab=tracking',
                        roles: ['SuperAdmin', 'Admin', 'HeadOfExam']
                    }
                ]
            },
            {
                key: 'class-issues',
                label: 'Class Issues',
                icon: AlertCircle,
                path: '/class-issues',
                roles: ['SuperAdmin', 'Admin', 'Faculty']
            },
            {
                key: 'campus-environment',
                label: 'Campus Environment',
                icon: ShieldCheck,
                path: '/campus-environment',
                roles: ['SuperAdmin', 'Admin', 'Faculty']
            }
        ]
    },
    {
        title: 'Communication',
        items: [
            {
                key: 'messaging-support',
                label: 'Messaging / Support',
                icon: MessageSquare,
                path: '/messaging-support',
                roles: ['SuperAdmin', 'Admin', 'Faculty']
            }
        ]
    },
    {
        title: 'System',
        items: [
            {
                key: 'reporting',
                label: 'Reporting',
                icon: FileText,
                path: '/reporting',
                roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher']
            },
            {
                key: 'settings',
                label: 'Settings',
                icon: Settings,
                path: '/settings',
                roles: ['SuperAdmin', 'Admin', 'HeadOfExam', 'Faculty', 'Teacher'],
                children: [
                    { key: 'roles-users', label: 'Roles & Users', path: '/settings?tab=roles-users' },
                    { key: 'system-config', label: 'System Config', path: '/settings?tab=system-config' }
                ]
            }
        ]
    }
];

const canAccess = (roles, roleName) => !roles || roles.includes(roleName);

const splitPathAndQuery = (path) => {
    const [pathname, rawQuery] = path.split('?');
    return { pathname, rawQuery };
};

const isPathMatch = (location, menuPath) => {
    const { pathname, rawQuery } = splitPathAndQuery(menuPath);
    if (location.pathname !== pathname) {
        return false;
    }

    if (!rawQuery) {
        return true;
    }

    const [key, value] = rawQuery.split('=');
    return new URLSearchParams(location.search).get(key) === value;
};

const Sidebar = ({ isOpen, onClose }) => {
    const roleName = getUser()?.role_name || '';
    const location = useLocation();
    const navigate = useNavigate();

    const visibleItems = useMemo(
        () =>
            menuSections.flatMap((section) =>
                section.items.filter((item) => canAccess(item.roles, roleName))
            ),
        [roleName]
    );

    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        setExpanded((prev) => {
            const next = { ...prev };

            visibleItems.forEach((item) => {
                if (!item.children) {
                    return;
                }

                const visibleChildren = item.children.filter((child) => canAccess(child.roles, roleName));
                const hasActiveChild = visibleChildren.some((child) => isPathMatch(location, child.path));
                if (hasActiveChild) {
                    next[item.key] = true;
                }
            });

            return next;
        });
    }, [location, visibleItems]);

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={onClose} />}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static ${
                    isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}
            >
                <div className="border-b border-gray-200 px-5 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-black">Thesis Management</p>
                            <p className="text-xs text-gray-500">University Appeal System</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const visibleChildren = item.children ? item.children.filter((child) => canAccess(child.roles, roleName)) : [];
                        const isTopActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(`${item.path}/`) ||
                            (visibleChildren.length > 0 && visibleChildren.some((child) => isPathMatch(location, child.path)));

                        return (
                            <div key={item.key}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (item.children) {
                                            setExpanded((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                                        }
                                        handleNavigate(item.path);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                                        isTopActive
                                            ? 'border-blue-100 bg-blue-50 text-blue-700'
                                            : 'border-transparent text-black hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <Icon size={18} className={isTopActive ? 'text-blue-600' : 'text-gray-500'} />
                                        <span>{item.label}</span>
                                    </span>

                                    {visibleChildren.length > 0 && (
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-400 transition-transform ${
                                                expanded[item.key] ? 'rotate-180' : ''
                                            }`}
                                        />
                                    )}
                                </button>

                                {visibleChildren.length > 0 && expanded[item.key] && (
                                    <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-4">
                                        {visibleChildren.map((child) => {
                                            const childActive = isPathMatch(location, child.path);
                                            return (
                                                <button
                                                    key={child.key}
                                                    type="button"
                                                    onClick={() => handleNavigate(child.path)}
                                                    className={`block w-full rounded-md px-2 py-1.5 text-left text-sm transition ${
                                                        childActive
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                                                    }`}
                                                >
                                                    {child.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="border-t border-gray-200 px-4 py-2 text-center">
                    <p className="text-[10px] text-gray-400">Copyright 2026</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

