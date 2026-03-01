import React, { useEffect, useState } from 'react';
import TabbedPageShell from '../components/TabbedPageShell';
import campusEnvironmentService from '../api/campusEnvironmentService';

const tabs = [
    { key: 'complaints', label: '1. Complaints' },
    { key: 'tracking', label: '2. Tracking' }
];

const statusOptions = ['Pending', 'In Review', 'Resolved', 'Completed'];
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');

const normalizeStatus = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'Pending';
    if (['pending', 'in processing', 'processing'].includes(raw)) return 'Pending';
    if (raw === 'in review') return 'In Review';
    if (['resolved', 'reject', 'rejected'].includes(raw)) return 'Resolved';
    if (raw === 'completed') return 'Completed';
    return 'Pending';
};

const resolveComplaintImageUrl = (value) => {
    if (!value) return '';

    let parsedValue = value;
    if (typeof parsedValue === 'string') {
        const trimmed = parsedValue.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                parsedValue = JSON.parse(trimmed);
            } catch (_error) {
                parsedValue = trimmed;
            }
        } else {
            parsedValue = trimmed;
        }
    }

    let imagePath = '';
    if (Array.isArray(parsedValue)) {
        const firstItem = parsedValue[0];
        if (typeof firstItem === 'object' && firstItem !== null) {
            imagePath = String(firstItem.url || firstItem.path || firstItem.src || '').trim();
        } else {
            imagePath = String(firstItem || '').trim();
        }
    } else if (typeof parsedValue === 'object' && parsedValue !== null) {
        imagePath = String(parsedValue.url || parsedValue.path || '').trim();
    } else {
        imagePath = String(parsedValue).split(',')[0].trim();
    }

    if (!imagePath) return '';
    if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('data:')) return imagePath;

    const normalized = imagePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^public\//, '');
    if (normalized.startsWith('storage/')) {
        return `${apiBaseUrl}/${normalized}`;
    }
    return `${apiBaseUrl}/storage/${normalized}`;
};

const CampusEnvironment = () => {
    const [activeTab, setActiveTab] = useState('complaints');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [complaints, setComplaints] = useState([]);
    const [tracking, setTracking] = useState([]);
    const [supportModalOpen, setSupportModalOpen] = useState(false);
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportStudents, setSupportStudents] = useState([]);
    const [supportForName, setSupportForName] = useState('');
    const [statusSavingId, setStatusSavingId] = useState(null);

    const loadComplaints = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await campusEnvironmentService.getComplaints();
            if (res?.success) {
                setComplaints(res.data || []);
            } else {
                setErrorMessage(res?.message || 'Failed to load complaints.');
            }
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || 'Failed to load complaints.');
        } finally {
            setLoading(false);
        }
    };

    const loadTracking = async () => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await campusEnvironmentService.getTracking();
            if (res?.success) {
                setTracking(res.data || []);
            } else {
                setErrorMessage(res?.message || 'Failed to load tracking.');
            }
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || 'Failed to load tracking.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'complaints') {
            loadComplaints();
            return;
        }
        loadTracking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const complaintStats = {
        total: complaints.length,
        pending: complaints.filter((item) => normalizeStatus(item.status) === 'Pending').length,
        inReview: complaints.filter((item) => normalizeStatus(item.status) === 'In Review').length,
        resolved: complaints.filter((item) => normalizeStatus(item.status) === 'Resolved').length,
        completed: complaints.filter((item) => normalizeStatus(item.status) === 'Completed').length
    };

    const filteredComplaints =
        statusFilter === 'All'
            ? complaints
            : complaints.filter((item) => normalizeStatus(item.status) === statusFilter);

    const handleStatusSelect = async (item, newStatus) => {
        const currentStatus = normalizeStatus(item.status);
        if (currentStatus === newStatus) return;

        const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
        const legacyUser = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = authUser?.user_id || legacyUser?.user_id || 13;

        setStatusSavingId(item.cmp_env_com_no);
        setErrorMessage('');

        try {
            const res = await campusEnvironmentService.updateStatus(item.cmp_env_com_no, {
                new_status: newStatus,
                user_id: userId,
                note: `Status changed to ${newStatus}`
            });

            if (!res?.success) {
                setErrorMessage(res?.message || 'Failed to update status.');
                return;
            }

            await loadComplaints();
            if (activeTab === 'tracking') {
                await loadTracking();
            }
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || 'Failed to update status.');
        } finally {
            setStatusSavingId(null);
        }
    };

    const openSupportStudents = async (cmpEnvComNo, studentName) => {
        if (!cmpEnvComNo) return;

        setSupportForName(studentName || '');
        setSupportModalOpen(true);
        setSupportLoading(true);
        setSupportStudents([]);

        try {
            const res = await campusEnvironmentService.getSupportStudents(cmpEnvComNo);
            if (res?.success) {
                setSupportStudents(res.data || []);
            } else {
                setErrorMessage(res?.message || 'Failed to load support students.');
            }
        } catch (error) {
            setErrorMessage(error?.response?.data?.message || 'Failed to load support students.');
        } finally {
            setSupportLoading(false);
        }
    };

    const renderComplaintsTab = () => (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'All', count: complaintStats.total },
                        { key: 'Pending', count: complaintStats.pending },
                        { key: 'In Review', count: complaintStats.inReview },
                        { key: 'Resolved', count: complaintStats.resolved },
                        { key: 'Completed', count: complaintStats.completed }
                    ].map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setStatusFilter(item.key)}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                                statusFilter === item.key
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
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">student_id</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">student name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">class</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">issue name</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">image</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                                    Loading complaints...
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            filteredComplaints.map((item) => {
                                const imageUrl = resolveComplaintImageUrl(item.images);
                                return (
                                <tr key={item.cmp_env_com_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    <td className="px-3 py-2 text-gray-800">{item.student_id}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.class_name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.issue_name || item.campuses_issues}</td>
                                    <td className="px-3 py-2 text-gray-800">
                                        {imageUrl ? (
                                            <a
                                                href={imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block"
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`Complaint by ${item.name || item.student_id}`}
                                                    className="h-10 w-10 rounded-md border border-gray-200 object-cover"
                                                />
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={normalizeStatus(item.status)}
                                                onChange={(event) => handleStatusSelect(item, event.target.value)}
                                                disabled={statusSavingId === item.cmp_env_com_no}
                                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                            >
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => openSupportStudents(item.cmp_env_com_no, item.student_id)}
                                                className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                Support
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                            })}

                        {!loading && filteredComplaints.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                                    No complaints found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTrackingTab = () => (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">student_id</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">student name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">class</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">issue name</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">image</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">action</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                                Loading tracking...
                            </td>
                        </tr>
                    )}

                    {!loading &&
                            tracking.map((item) => {
                                const imageUrl = resolveComplaintImageUrl(item.images);
                                return (
                                <tr key={item.cet_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    <td className="px-3 py-2 text-gray-800">{item.student_id}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.class_name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-800">{item.issue_name || item.campuses_issues}</td>
                                    <td className="px-3 py-2 text-gray-800">
                                        {imageUrl ? (
                                            <a
                                                href={imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block"
                                            >
                                                <img
                                                    src={imageUrl}
                                                    alt={`Complaint by ${item.name || item.student_id}`}
                                                    className="h-10 w-10 rounded-md border border-gray-200 object-cover"
                                                />
                                            </a>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={normalizeStatus(item.change_status || item.status)}
                                                onChange={(event) => handleStatusSelect(item, event.target.value)}
                                                disabled={statusSavingId === item.cmp_env_com_no}
                                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                            >
                                                {statusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {status}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => openSupportStudents(item.cmp_env_com_no, item.student_id)}
                                                className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                Support
                                            </button>
                                        </div>
                                    </td>
                            </tr>
                        );
                        })}

                    {!loading && tracking.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                                No tracking found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <>
            <TabbedPageShell
                title="Campus Environment"
                description="Manage campus environment complaints and tracking."
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                {errorMessage && (
                    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {errorMessage}
                    </div>
                )}

                {activeTab === 'complaints' ? renderComplaintsTab() : renderTrackingTab()}
            </TabbedPageShell>

            {supportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                            <h3 className="text-base font-semibold text-black">
                                Support Students {supportForName ? `- ${supportForName}` : ''}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSupportModalOpen(false)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                            >
                                Close
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-auto p-4">
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">student_id</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">name</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">supported_at</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supportLoading && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-500">
                                                    Loading support students...
                                                </td>
                                            </tr>
                                        )}

                                        {!supportLoading &&
                                            supportStudents.map((student) => (
                                                <tr key={`${student.std_id}-${student.supported_at}`} className="border-b border-gray-100 text-sm">
                                                    <td className="px-3 py-2 text-gray-800">{student.student_id}</td>
                                                    <td className="px-3 py-2 text-gray-800">{student.name}</td>
                                                    <td className="px-3 py-2 text-gray-800">{student.supported_at || '-'}</td>
                                                </tr>
                                            ))}

                                        {!supportLoading && supportStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-500">
                                                    No support students found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CampusEnvironment;
