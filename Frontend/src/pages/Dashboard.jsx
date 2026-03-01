import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Gauge,
    GraduationCap,
    ListChecks,
    Layers,
    UserCheck,
    Users
} from 'lucide-react';
import { getUser } from '../utils/auth';
import classIssueService from '../api/classIssueService';
import studentManagementService from '../api/studentManagementService';
import teacherManagementService from '../api/teacherManagementService';

const Dashboard = () => {
    const navigate = useNavigate();
    const roleName = getUser()?.role_name || '';

    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalAppeals: 0,
        pendingAppeals: 0,
        inReviewAppeals: 0,
        resolvedAppeals: 0,
        completedAppeals: 0,
        activeQueue: 0,
        activeAcademicYear: '',
        totalClasses: 0
    });
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [studentsRes, teachersRes, classesRes, statsRes, issuesRes, fallbackStudentsRes] = await Promise.allSettled([
                    studentManagementService.listStudents(),
                    teacherManagementService.listTeachers(),
                    classIssueService.getClasses(),
                    classIssueService.getStats(),
                    classIssueService.getIssues(),
                    classIssueService.getAllStudents()
                ]);

                const studentsFromManagement =
                    studentsRes.status === 'fulfilled' && studentsRes.value.success ? studentsRes.value.data || [] : [];
                const studentsFromFaculty =
                    fallbackStudentsRes.status === 'fulfilled' && fallbackStudentsRes.value.success ? fallbackStudentsRes.value.data || [] : [];
                const students =
                    studentsFromManagement.length > 0
                        ? studentsFromManagement
                        : Array.from(new Map(studentsFromFaculty.map((row) => [row.std_id, row])).values());

                const teachers =
                    teachersRes.status === 'fulfilled' && teachersRes.value.success ? teachersRes.value.data || [] : [];
                const classes = classesRes.status === 'fulfilled' && classesRes.value.success ? classesRes.value.data : [];
                const stats = statsRes.status === 'fulfilled' && statsRes.value.success ? statsRes.value.data : {};
                const issues = issuesRes.status === 'fulfilled' && issuesRes.value.success ? issuesRes.value.data : [];

                const pendingAppeals = Number(stats.pending || 0);
                const inReviewAppeals = Number(stats.inReview || 0);
                const resolvedAppeals = Number(stats.resolved || 0);
                const completedAppeals = Number(stats.completed || 0);
                const totalAppeals = Number(stats.total || issues.length || 0);
                const activeQueue = pendingAppeals + inReviewAppeals;

                const year = new Date().getFullYear();

                setMetrics({
                    totalStudents: students.length,
                    totalTeachers: teachers.length,
                    totalAppeals,
                    pendingAppeals,
                    inReviewAppeals,
                    resolvedAppeals,
                    completedAppeals,
                    activeQueue,
                    activeAcademicYear: `${year}/${year + 1}`,
                    totalClasses: classes.length
                });

                const mappedActivities = issues.slice(0, 6).map((issue) => ({
                    id: issue.cl_is_co_no,
                    student: issue.leader_name || 'N/A',
                    type: issue.issue_name || 'Appeal',
                    status: issue.status || 'Pending',
                    date: issue.created_at
                        ? new Date(issue.created_at).toLocaleDateString()
                        : new Date().toLocaleDateString()
                }));
                setActivities(mappedActivities);
            } catch (error) {
                console.error('Dashboard load error:', error);
                setActivities([]);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const statusReports = useMemo(() => {
        const rows = [
            { key: 'pending', label: 'Pending', value: metrics.pendingAppeals, bar: 'bg-amber-400' },
            { key: 'review', label: 'In Review', value: metrics.inReviewAppeals, bar: 'bg-blue-500' },
            { key: 'resolved', label: 'Resolved', value: metrics.resolvedAppeals, bar: 'bg-emerald-500' },
            { key: 'completed', label: 'Completed', value: metrics.completedAppeals, bar: 'bg-slate-700' }
        ];

        const total = rows.reduce((sum, row) => sum + row.value, 0);

        return rows.map((row) => ({
            ...row,
            percent: total > 0 ? Math.round((row.value / total) * 100) : 0
        }));
    }, [metrics.completedAppeals, metrics.inReviewAppeals, metrics.pendingAppeals, metrics.resolvedAppeals]);

    const summaryCards = useMemo(
        () => [
            { key: 'students', label: 'Total Students', value: metrics.totalStudents, icon: Users },
            { key: 'teachers', label: 'Total Teachers', value: metrics.totalTeachers, icon: UserCheck },
            { key: 'classes', label: 'Total Classes', value: metrics.totalClasses, icon: Layers },
            { key: 'appeals', label: 'Total Appeals', value: metrics.totalAppeals, icon: ListChecks },
            { key: 'queue', label: 'Active Queue', value: metrics.activeQueue, icon: Gauge },
            { key: 'year', label: 'Active Academic Year', value: metrics.activeAcademicYear, icon: CalendarClock },
            { key: 'resolved', label: 'Resolved + Completed', value: metrics.resolvedAppeals + metrics.completedAppeals, icon: CheckCircle2 }
        ],
        [metrics]
    );

    const issuePerClass = metrics.totalClasses > 0 ? (metrics.totalAppeals / metrics.totalClasses).toFixed(1) : '0.0';
    const issuePer100Students =
        metrics.totalStudents > 0 ? ((metrics.totalAppeals / metrics.totalStudents) * 100).toFixed(1) : '0.0';
    const resolutionRate =
        metrics.totalAppeals > 0
            ? Math.round(((metrics.resolvedAppeals + metrics.completedAppeals) / metrics.totalAppeals) * 100)
            : 0;

    const quickActions = [
        { key: 'add-student', label: 'Add Student', path: '/student-management?tab=students' },
        { key: 'open-period', label: 'Open Appeal Period', path: '/exam-appeals?tab=allow-appeals' },
        { key: 'assign-teacher', label: 'Assign Teacher', path: '/academic-structure?tab=academics' },
        { key: 'view-reports', label: 'View Reports', path: '/exam-appeals?tab=tracking' }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Dashboard Snapshot</p>
                        <h1 className="mt-2 text-2xl font-semibold text-black">Welcome, {roleName || 'User'}</h1>
                        <p className="mt-1 text-sm text-gray-600">Small summary reports for student, class, and appeal performance.</p>
                    </div>
                    <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white md:flex">
                        <GraduationCap size={22} />
                    </div>
                </div>
            </div>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.key}
                            className="group rounded-lg border border-gray-200 border-t-2 border-t-blue-600 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                    <Icon size={15} />
                                </div>
                                <ArrowRight size={14} className="text-gray-300 transition group-hover:text-blue-600" />
                            </div>
                            <p className="mt-2 text-lg font-bold leading-none text-black">{loading ? '...' : card.value}</p>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                        </div>
                    );
                })}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-black">Small Summary Reports</h2>
                    </div>
                    <div className="mt-4 space-y-3">
                        {statusReports.map((row) => (
                            <div key={row.key} className="space-y-1.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">{row.label}</span>
                                    <span className="text-gray-600">
                                        {loading ? '...' : `${row.value} (${row.percent}%)`}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100">
                                    <div className={`h-2 rounded-full ${row.bar}`} style={{ width: `${row.percent}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-black">Quick Ratios</h2>
                    <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Appeals per Class</p>
                            <p className="mt-1 text-xl font-semibold text-black">{loading ? '...' : issuePerClass}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Appeals per 100 Students</p>
                            <p className="mt-1 text-xl font-semibold text-black">{loading ? '...' : issuePer100Students}</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                            <p className="text-xs uppercase tracking-wide text-gray-500">Resolution Rate</p>
                            <p className="mt-1 text-xl font-semibold text-black">{loading ? '...' : `${resolutionRate}%`}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-black">Quick Actions</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.key}
                            type="button"
                            onClick={() => navigate(action.path)}
                            className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-black">Recent Appeals</h2>
                    <button
                        type="button"
                        onClick={() => navigate('/exam-appeals?tab=tracking')}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        View all
                    </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length > 0 ? (
                                activities.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-100 text-sm transition hover:bg-blue-50/50">
                                        <td className="px-3 py-3 font-medium text-black">{row.student}</td>
                                        <td className="px-3 py-3 text-gray-700">{row.type}</td>
                                        <td className="px-3 py-3">
                                            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600">{row.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                        <div className="inline-flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            <span>No recent activity found.</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
