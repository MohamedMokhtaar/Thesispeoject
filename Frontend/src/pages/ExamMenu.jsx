import React from 'react';
import { ClipboardCheck, FileText, LineChart, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import TabbedPageShell from '../components/TabbedPageShell';

const tabs = [
    { key: 'exams', label: 'Exams' },
    { key: 'exam_registration', label: 'Exam Registration' },
    { key: 'attendence', label: 'Attendence' },
    { key: 'result', label: 'Result' }
];

const aliasTabMap = {
    exam_register: 'exam_registration',
    sxam_register: 'exam_registration',
    sexam_register: 'exam_registration',
    attendance: 'attendence'
};

const tabContent = {
    exams: {
        icon: FileText,
        title: 'Exams',
        description: 'Create and manage exam records, schedules, and statuses.'
    },
    exam_registration: {
        icon: Users,
        title: 'Exam Registration',
        description: 'Track students who are registered for exam sessions.'
    },
    attendence: {
        icon: ClipboardCheck,
        title: 'Attendence',
        description: 'Manage exam-day attendance records for each registered student.'
    },
    result: {
        icon: LineChart,
        title: 'Result',
        description: 'Review final exam outcomes and publication status.'
    }
};

const examRows = [
    { id: 'EXM-101', name: 'Software Engineering', semester: 'Y3-S1', date: '2026-03-10', status: 'Scheduled' },
    { id: 'EXM-102', name: 'Database Systems', semester: 'Y3-S1', date: '2026-03-12', status: 'Open' }
];

const registerRows = [
    { regNo: 'REG-501', student: 'Nuwan Perera', exam: 'Software Engineering', status: 'Approved' },
    { regNo: 'REG-502', student: 'Kasuni Silva', exam: 'Database Systems', status: 'Pending' }
];

const attendenceRows = [
    { attendanceNo: 'ATT-901', student: 'Nuwan Perera', exam: 'Software Engineering', present: 'Present' },
    { attendanceNo: 'ATT-902', student: 'Kasuni Silva', exam: 'Database Systems', present: 'Absent' }
];

const resultRows = [
    { resultNo: 'RES-301', student: 'Nuwan Perera', exam: 'Software Engineering', grade: 'A-', status: 'Published' },
    { resultNo: 'RES-302', student: 'Kasuni Silva', exam: 'Database Systems', grade: 'B+', status: 'Published' }
];

const ExamMenu = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab') || 'exams';
    const normalizedTab = aliasTabMap[rawTab] || rawTab;
    const activeTab = tabs.some((tab) => tab.key === normalizedTab) ? normalizedTab : 'exams';
    const section = tabContent[activeTab];
    const Icon = section.icon;

    const onTabChange = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next);
    };

    return (
        <TabbedPageShell
            title="Exam Menu"
            description="Manage exams and exam registration details from a single place."
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-black">{section.title}</h2>
                    <p className="text-sm text-gray-600">{section.description}</p>
                </div>
            </div>

            <div className="mt-5 overflow-x-auto">
                {activeTab === 'exams' ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Exam ID</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Semester</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examRows.map((row) => (
                                <tr key={row.id} className="border-b border-gray-100 text-sm transition hover:bg-blue-50/50">
                                    <td className="px-3 py-3 font-medium text-black">{row.id}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.name}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.semester}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.date}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === 'exam_registration' ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Register No</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registerRows.map((row) => (
                                <tr key={row.regNo} className="border-b border-gray-100 text-sm transition hover:bg-blue-50/50">
                                    <td className="px-3 py-3 font-medium text-black">{row.regNo}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.student}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.exam}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === 'attendence' ? (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Attendance No</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendenceRows.map((row) => (
                                <tr key={row.attendanceNo} className="border-b border-gray-100 text-sm transition hover:bg-blue-50/50">
                                    <td className="px-3 py-3 font-medium text-black">{row.attendanceNo}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.student}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.exam}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{row.present}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Result No</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Exam</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultRows.map((row) => (
                                <tr key={row.resultNo} className="border-b border-gray-100 text-sm transition hover:bg-blue-50/50">
                                    <td className="px-3 py-3 font-medium text-black">{row.resultNo}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.student}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.exam}</td>
                                    <td className="px-3 py-3 text-gray-700">{row.grade}</td>
                                    <td className="px-3 py-3">
                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{row.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </TabbedPageShell>
    );
};

export default ExamMenu;
