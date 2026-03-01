import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabbedPageShell from '../components/TabbedPageShell';
import classIssueService from '../api/classIssueService';
import leaderService from '../api/leaderService';

const tabs = [
    { key: 'issues', label: '1. Issues' },
    { key: 'leaders', label: '2. Leaders' }
];

const statusOptions = ['Pending', 'In Review', 'Resolved', 'Completed'];

const ClassIssuesList = () => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('issues');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [leadersLoading, setLeadersLoading] = useState(false);
    const [issuesLoading, setIssuesLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [faculties, setFaculties] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [leaders, setLeaders] = useState([]);

    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');

    const [issues, setIssues] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, resolved: 0, completed: 0 });
    const [filterStatus, setFilterStatus] = useState('All');

    const clearMessages = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    const extractError = (error, fallback) =>
        error?.response?.data?.message ||
        (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : fallback);

    useEffect(() => {
        const initLeadersData = async () => {
            setLeadersLoading(true);
            clearMessages();
            try {
                const [facultiesResult, leadersResult] = await Promise.allSettled([
                    leaderService.getFaculties(),
                    leaderService.getLeaders()
                ]);

                if (facultiesResult.status === 'fulfilled' && facultiesResult.value?.success) {
                    setFaculties(facultiesResult.value.data || []);
                } else {
                    const err = facultiesResult.status === 'rejected' ? facultiesResult.reason : null;
                    setErrorMessage(extractError(err, 'Failed to load faculties.'));
                }

                if (leadersResult.status === 'fulfilled' && leadersResult.value?.success) {
                    setLeaders(leadersResult.value.data || []);
                } else if (facultiesResult.status === 'fulfilled' && facultiesResult.value?.success) {
                    const err = leadersResult.status === 'rejected' ? leadersResult.reason : null;
                    setErrorMessage(extractError(err, 'Failed to load leaders.'));
                }
            } finally {
                setLeadersLoading(false);
            }
        };

        initLeadersData();
    }, []);

    useEffect(() => {
        if (activeTab !== 'issues') return;

        const loadIssuesData = async () => {
            setIssuesLoading(true);
            clearMessages();
            try {
                const [issuesRes, statsRes] = await Promise.all([
                    classIssueService.getIssues(),
                    classIssueService.getStats()
                ]);

                if (issuesRes.success) setIssues(issuesRes.data || []);
                if (statsRes.success) setStats(statsRes.data || { total: 0, pending: 0, inReview: 0, resolved: 0, completed: 0 });
            } catch (error) {
                setErrorMessage(extractError(error, 'Failed to load issues.'));
            } finally {
                setIssuesLoading(false);
            }
        };

        loadIssuesData();
    }, [activeTab]);

    const loadLeaders = async (params = {}) => {
        setLeadersLoading(true);
        clearMessages();
        try {
            const res = await leaderService.getLeaders(params);
            if (res.success) setLeaders(res.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load leaders.'));
        } finally {
            setLeadersLoading(false);
        }
    };

    const loadIssuesAndStats = async () => {
        setIssuesLoading(true);
        try {
            const [issuesRes, statsRes] = await Promise.all([
                classIssueService.getIssues(),
                classIssueService.getStats()
            ]);

            if (issuesRes.success) setIssues(issuesRes.data || []);
            if (statsRes.success) setStats(statsRes.data || { total: 0, pending: 0, inReview: 0, resolved: 0, completed: 0 });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to refresh issues.'));
        } finally {
            setIssuesLoading(false);
        }
    };

    const getCurrentLeaderFilter = () => {
        if (selectedClass) return { cls_no: selectedClass };
        if (selectedDepartment?.dept_no) return { dept_no: selectedDepartment.dept_no };
        if (selectedFaculty?.faculty_no) return { faculty_no: selectedFaculty.faculty_no };
        return {};
    };

    const handleFacultyChange = async (facultyNo) => {
        clearMessages();
        const nextFaculty = faculties.find((faculty) => String(faculty.faculty_no) === String(facultyNo)) || null;

        setSelectedFaculty(nextFaculty);
        setSelectedDepartment(null);
        setSelectedClass('');
        setSelectedStudent('');
        setDepartments([]);
        setClasses([]);
        setStudents([]);

        if (!nextFaculty) {
            await loadLeaders();
            return;
        }

        setLeadersLoading(true);
        try {
            const [departmentRes, leadersRes] = await Promise.all([
                leaderService.getDepartments(nextFaculty.faculty_no),
                leaderService.getLeaders({ faculty_no: nextFaculty.faculty_no })
            ]);

            if (departmentRes.success) setDepartments(departmentRes.data || []);
            if (leadersRes.success) setLeaders(leadersRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load departments for selected faculty.'));
        } finally {
            setLeadersLoading(false);
        }
    };

    const handleDepartmentChange = async (departmentNo) => {
        clearMessages();
        const nextDepartment = departments.find((department) => String(department.dept_no) === String(departmentNo)) || null;

        setSelectedDepartment(nextDepartment);
        setSelectedClass('');
        setSelectedStudent('');
        setClasses([]);
        setStudents([]);

        if (!nextDepartment) {
            await loadLeaders(selectedFaculty ? { faculty_no: selectedFaculty.faculty_no } : {});
            return;
        }

        setLeadersLoading(true);
        try {
            const [classesRes, leadersRes] = await Promise.all([
                leaderService.getClassesByDepartment(nextDepartment.dept_no),
                leaderService.getLeaders({ dept_no: nextDepartment.dept_no })
            ]);

            if (classesRes.success) setClasses(classesRes.data || []);
            if (leadersRes.success) setLeaders(leadersRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load classes for selected department.'));
        } finally {
            setLeadersLoading(false);
        }
    };

    const handleClassChange = async (classNo) => {
        clearMessages();
        setSelectedClass(classNo);
        setSelectedStudent('');
        setStudents([]);

        if (!classNo) {
            await loadLeaders(selectedDepartment ? { dept_no: selectedDepartment.dept_no } : (selectedFaculty ? { faculty_no: selectedFaculty.faculty_no } : {}));
            return;
        }

        setLeadersLoading(true);
        try {
            const [studentsRes, leadersRes] = await Promise.all([
                leaderService.getClassStudents(classNo),
                leaderService.getLeaders({ cls_no: classNo })
            ]);

            if (studentsRes.success) setStudents(studentsRes.data || []);
            if (leadersRes.success) setLeaders(leadersRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load students for selected class.'));
        } finally {
            setLeadersLoading(false);
        }
    };

    const handleAssignLeader = async (event) => {
        event.preventDefault();
        if (!selectedClass || !selectedStudent) return;

        setSubmitting(true);
        clearMessages();
        try {
            const res = await leaderService.assignLeader(selectedClass, selectedStudent);
            if (res.success) {
                setSuccessMessage('Class leader assigned successfully.');
                setSelectedStudent('');
                await loadLeaders(getCurrentLeaderFilter());
                if (issues.length > 0 || activeTab === 'issues') {
                    await loadIssuesAndStats();
                }
            } else {
                setErrorMessage(res.message || 'Failed to assign class leader.');
            }
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to assign class leader.'));
        } finally {
            setSubmitting(false);
        }
    };

    const statusToKey = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'pending':
                return 'pending';
            case 'in review':
                return 'inReview';
            case 'resolved':
                return 'resolved';
            case 'completed':
                return 'completed';
            default:
                return null;
        }
    };

    const handleStatusUpdate = async (issueId, nextStatus) => {
        const currentIssue = issues.find((issue) => issue.cl_is_co_no === issueId);
        if (!currentIssue || currentIssue.status === nextStatus) return;

        clearMessages();

        const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
        const legacyUser = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = authUser?.user_id || legacyUser?.user_id || 1;

        try {
            const res = await classIssueService.updateIssueStatus(issueId, {
                new_status: nextStatus,
                note: `Status updated to ${nextStatus} from dashboard`,
                user_id: userId
            });

            if (!res.success) {
                setErrorMessage(res.message || 'Failed to update status.');
                return;
            }

            setIssues((prev) =>
                prev.map((issue) => (issue.cl_is_co_no === issueId ? { ...issue, status: nextStatus } : issue))
            );

            setStats((prev) => {
                const oldKey = statusToKey(currentIssue.status);
                const newKey = statusToKey(nextStatus);
                const next = { ...prev };

                if (oldKey && typeof next[oldKey] === 'number' && next[oldKey] > 0) next[oldKey] -= 1;
                if (newKey && typeof next[newKey] === 'number') next[newKey] += 1;

                return next;
            });

            setSuccessMessage('Issue status updated successfully.');
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to update issue status.'));
        }
    };

    const filteredIssues =
        filterStatus === 'All' ? issues : issues.filter((issue) => issue.status === filterStatus);

    const renderLeadersTab = () => (
        <div className="space-y-4">
            <form onSubmit={handleAssignLeader} className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-black">Select Faculty, Department, Class, then Student</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Faculty</label>
                        <select
                            value={selectedFaculty?.faculty_no || ''}
                            onChange={(event) => handleFacultyChange(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Select faculty</option>
                            {faculties.map((faculty) => (
                                <option key={faculty.faculty_no} value={faculty.faculty_no}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Department</label>
                        <select
                            value={selectedDepartment?.dept_no || ''}
                            onChange={(event) => handleDepartmentChange(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            disabled={!selectedFaculty}
                        >
                            <option value="">{selectedFaculty ? 'Select department' : 'Select faculty first'}</option>
                            {departments.map((department) => (
                                <option key={department.dept_no} value={department.dept_no}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(event) => handleClassChange(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            disabled={!selectedDepartment}
                        >
                            <option value="">{selectedDepartment ? 'Select class' : 'Select department first'}</option>
                            {classes.map((item) => (
                                <option key={item.cls_no} value={item.cls_no}>
                                    {item.cl_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(event) => setSelectedStudent(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                            disabled={!selectedClass}
                        >
                            <option value="">{selectedClass ? 'Select student' : 'Select class first'}</option>
                            {students.map((student) => (
                                <option key={student.std_id} value={student.std_id}>
                                    {student.student_id} - {student.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-5">
                    <button
                        type="submit"
                        disabled={submitting || !selectedStudent}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {submitting ? 'Assigning...' : 'Assign Leader'}
                    </button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Leader Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student ID</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Department</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Faculty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leadersLoading && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                                    Loading leaders...
                                </td>
                            </tr>
                        )}
                        {!leadersLoading &&
                            leaders.map((leader) => (
                                <tr key={leader.le_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    <td className="px-3 py-2 text-gray-800">{leader.student_name}</td>
                                    <td className="px-3 py-2 text-gray-800">{leader.student_code}</td>
                                    <td className="px-3 py-2 text-gray-800">{leader.cl_name}</td>
                                    <td className="px-3 py-2 text-gray-800">{leader.department_name}</td>
                                    <td className="px-3 py-2 text-gray-800">{leader.faculty_name}</td>
                                </tr>
                            ))}
                        {!leadersLoading && leaders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                                    No leaders found for selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderIssuesTab = () => (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'All', count: stats.total || issues.length },
                        { key: 'Pending', count: stats.pending || 0 },
                        { key: 'In Review', count: stats.inReview || 0 },
                        { key: 'Resolved', count: stats.resolved || 0 },
                        { key: 'Completed', count: stats.completed || 0 }
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setFilterStatus(item.key)}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                filterStatus === item.key
                                    ? 'bg-blue-600 text-white'
                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {item.key} ({item.count})
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student ID</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Issue Name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {issuesLoading && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                                    Loading issues...
                                </td>
                            </tr>
                        )}
                        {!issuesLoading &&
                            filteredIssues.map((issue) => (
                                <tr key={issue.cl_is_co_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    <td className="px-3 py-2 text-gray-800">{issue.student_id || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.leader_name || issue.student_name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.class_name}</td>
                                    <td className="px-3 py-2 text-gray-800">{issue.issue_name}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={issue.status}
                                                onChange={(event) => handleStatusUpdate(issue.cl_is_co_no, event.target.value)}
                                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                            >
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/class-issues/${issue.cl_is_co_no}`)}
                                                className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        {!issuesLoading && filteredIssues.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                                    No issues found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <TabbedPageShell
            title="Class Issues"
            description="Manage class leaders and review reported class issues."
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {errorMessage && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            {activeTab === 'leaders' ? renderLeadersTab() : renderIssuesTab()}
        </TabbedPageShell>
    );
};

export default ClassIssuesList;
