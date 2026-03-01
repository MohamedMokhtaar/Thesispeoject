import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Mail, MapPin, Phone, UserRound, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSearchParams } from 'react-router-dom';
import teacherManagementService from '../api/teacherManagementService';
import TabbedPageShell from '../components/TabbedPageShell';

const tabs = [
    { key: 'teachers', label: 'Teachers' },
    { key: 'states', label: 'States' }
];

const compactSwal = {
    width: 340,
    padding: '0.9rem',
    confirmButtonColor: '#1E5EFF',
    cancelButtonColor: '#9CA3AF',
    buttonsStyling: true
};

const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const modalInputClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const modalLabelClass = 'mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700';

const emptyCreateTeacherForm = {
    name: '',
    tell: '',
    email: '',
    gender: '',
    add_no: '',
    hire_date: ''
};

const emptyTeacherForm = {
    teacher_id: '',
    name: '',
    tell: '',
    email: '',
    gender: '',
    hire_date: '',
    status: 'Active'
};

const emptyStateForm = {
    teacher_no: '',
    status: 'Active'
};

const TeacherManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab') || 'teachers';
    const activeTab = tabs.some((tab) => tab.key === rawTab) ? rawTab : 'teachers';

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [tableLoading, setTableLoading] = useState(false);

    const [teachers, setTeachers] = useState([]);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [addressOptions, setAddressOptions] = useState([]);
    const [addTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
    const [createTeacherForm, setCreateTeacherForm] = useState({ ...emptyCreateTeacherForm });
    const [editingTeacherId, setEditingTeacherId] = useState(null);
    const [teacherForm, setTeacherForm] = useState({ ...emptyTeacherForm });
    const [setStateModalOpen, setSetStateModalOpen] = useState(false);
    const [stateForm, setStateForm] = useState({ ...emptyStateForm });

    const onTabChange = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next);
    };

    const clearMessages = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    const extractError = (error, fallback) =>
        error?.response?.data?.message ||
        (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : fallback);

    const loadTeachers = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const [teachersRes, addressRes] = await Promise.all([
                teacherManagementService.listTeachers(),
                teacherManagementService.listAddressOptions()
            ]);
            if (teachersRes.success) setTeachers(teachersRes.data || []);
            if (addressRes.success) setAddressOptions(addressRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load teachers.'));
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'teachers' || activeTab === 'states') loadTeachers();
    }, [activeTab]);

    const openAddTeacherModal = () => {
        clearMessages();
        setCreateTeacherForm({ ...emptyCreateTeacherForm });
        setAddTeacherModalOpen(true);
    };

    const closeAddTeacherModal = () => {
        setAddTeacherModalOpen(false);
        setCreateTeacherForm({ ...emptyCreateTeacherForm });
    };

    const onSubmitTeacher = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            const payload = {
                name: createTeacherForm.name,
                tell: createTeacherForm.tell || null,
                email: createTeacherForm.email || null,
                gender: createTeacherForm.gender || null,
                add_no: Number(createTeacherForm.add_no),
                hire_date: createTeacherForm.hire_date || null
            };

            const res = await teacherManagementService.createTeacher(payload);
            const generatedId = res?.generated?.teacher_id ? ` Teacher ID: ${res.generated.teacher_id}.` : '';
            const generatedPass = res?.generated?.plain_password ? ` Password: ${res.generated.plain_password}.` : '';
            setSuccessMessage(`Teacher created successfully.${generatedId}${generatedPass}`);
            closeAddTeacherModal();
            await loadTeachers({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to create teacher.'));
        } finally {
            setLoading(false);
        }
    };

    const onEditTeacher = (row) => {
        clearMessages();
        setEditingTeacherId(row.teacher_no);
        setTeacherForm({
            teacher_id: row.teacher_id || '',
            name: row.name || '',
            tell: row.tell || '',
            email: row.email || '',
            gender: row.gender || '',
            hire_date: row.hire_date || '',
            status: row.status || 'Active'
        });
    };

    const cancelTeacherEdit = () => {
        setEditingTeacherId(null);
        setTeacherForm({ ...emptyTeacherForm });
        clearMessages();
    };

    const saveEditedTeacher = async (teacherNo) => {
        setLoading(true);
        clearMessages();
        try {
            const payload = {
                teacher_id: teacherForm.teacher_id || null,
                name: teacherForm.name,
                tell: teacherForm.tell || null,
                email: teacherForm.email || null,
                gender: teacherForm.gender || null,
                hire_date: teacherForm.hire_date || null,
                status: teacherForm.status || 'Active'
            };
            await teacherManagementService.updateTeacher(teacherNo, payload);
            setSuccessMessage('Teacher updated successfully.');
            cancelTeacherEdit();
            await loadTeachers({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to update teacher.'));
        } finally {
            setLoading(false);
        }
    };

    const onDeleteTeacher = async (row) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Teacher?',
            text: `This will remove "${row.name}" and linked account.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await teacherManagementService.deleteTeacher(row.teacher_no);
            if (editingTeacherId === row.teacher_no) cancelTeacherEdit();
            setSuccessMessage('Teacher deleted successfully.');
            await loadTeachers({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete teacher.'));
        } finally {
            setLoading(false);
        }
    };

    const openSetStateModal = () => {
        clearMessages();
        setStateForm({ ...emptyStateForm });
        setSetStateModalOpen(true);
    };

    const closeSetStateModal = () => {
        setSetStateModalOpen(false);
        setStateForm({ ...emptyStateForm });
    };

    const onSubmitSetState = async (e) => {
        e.preventDefault();
        clearMessages();

        const teacherNo = Number(stateForm.teacher_no);
        if (!teacherNo) {
            setErrorMessage('Please select a teacher.');
            return;
        }

        const selectedTeacher = teachers.find((row) => Number(row.teacher_no) === teacherNo);
        if (!selectedTeacher) {
            setErrorMessage('Selected teacher was not found.');
            return;
        }

        if (!selectedTeacher.name) {
            setErrorMessage('Selected teacher has no name. Unable to update state.');
            return;
        }

        setLoading(true);
        try {
            await teacherManagementService.updateTeacher(teacherNo, {
                teacher_id: selectedTeacher.teacher_id || null,
                name: selectedTeacher.name,
                tell: selectedTeacher.tell || null,
                email: selectedTeacher.email || null,
                gender: selectedTeacher.gender || null,
                hire_date: selectedTeacher.hire_date || null,
                status: stateForm.status
            });
            setSuccessMessage(`Teacher state updated to ${stateForm.status}.`);
            closeSetStateModal();
            await loadTeachers({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to set teacher state.'));
        } finally {
            setLoading(false);
        }
    };

    const content = useMemo(
        () => {
            const activeTeachers = teachers.filter((row) => (row.status || row.account_status || 'Active') === 'Active');
            const inactiveTeachers = teachers.filter((row) => (row.status || row.account_status || 'Active') === 'Inactive');

            if (activeTab === 'states') {
                return (
                    <div className="space-y-5">
                        <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center">
                            <div>
                                <h3 className="text-sm font-semibold text-black">Teacher State Management</h3>
                                <p className="mt-0.5 text-sm text-gray-600">Activate or inactivate teacher accounts.</p>
                            </div>
                            <button
                                type="button"
                                onClick={openSetStateModal}
                                disabled={teachers.length === 0}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Set State
                            </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher ID</th>
                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableLoading && (
                                        <tr>
                                            <td colSpan={3} className="px-2 py-8 text-center text-sm text-gray-500">Loading.....</td>
                                        </tr>
                                    )}
                                    {inactiveTeachers.map((row) => (
                                        <tr key={row.teacher_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                            <td className="px-2 py-2 text-gray-800">{row.teacher_id || '-'}</td>
                                            <td className="px-2 py-2 text-gray-800">{row.name || '-'}</td>
                                            <td className="px-2 py-2 text-gray-800">{row.status || row.account_status || '-'}</td>
                                        </tr>
                                    ))}
                                    {!tableLoading && inactiveTeachers.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-2 py-8 text-center text-sm text-gray-500">No inactive teachers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {setStateModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                                <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
                                    <div className="border-b border-slate-200 px-5 py-3">
                                        <h3 className="text-lg font-semibold text-slate-900">Set Teacher State</h3>
                                        <p className="mt-1 text-sm text-slate-600">Select teacher and state to activate or inactivate.</p>
                                    </div>
                                    <form onSubmit={onSubmitSetState} className="space-y-4 px-5 py-4">
                                        <div>
                                            <label className={modalLabelClass}>
                                                <UserRound size={15} className="text-slate-500" />
                                                <span>Teacher *</span>
                                            </label>
                                            <select
                                                value={stateForm.teacher_no}
                                                onChange={(e) => setStateForm((prev) => ({ ...prev, teacher_no: e.target.value }))}
                                                className={modalInputClass}
                                                required
                                            >
                                                <option value="">Select Teacher</option>
                                                {teachers.map((row) => (
                                                    <option key={row.teacher_no} value={row.teacher_no}>
                                                        {`${row.teacher_id || `Teacher ${row.teacher_no}`} - ${row.name || 'Unknown'}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <UserRound size={15} className="text-slate-500" />
                                                <span>State *</span>
                                            </label>
                                            <select
                                                value={stateForm.status}
                                                onChange={(e) => setStateForm((prev) => ({ ...prev, status: e.target.value }))}
                                                className={modalInputClass}
                                                required
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeSetStateModal}
                                                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                            >
                                                Set State
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            const query = teacherSearch.trim().toLowerCase();
            const filteredTeachers = query
                ? activeTeachers.filter((row) =>
                    [
                        row.teacher_id,
                        row.name,
                        row.tell,
                        row.email,
                        row.gender,
                        row.status
                    ]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(query))
                )
                : activeTeachers;

            return (
            <div className="space-y-5">
                <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                    <input
                        type="text"
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        placeholder="Search by teacher ID, name, phone, email, gender, or status"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xl"
                    />
                    <button type="button" onClick={openAddTeacherModal} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">+ Add Teacher</button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher ID</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Hire Date</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableLoading && (
                                <tr>
                                    <td colSpan={8} className="px-2 py-8 text-center text-sm text-gray-500">Loading.....</td>
                                </tr>
                            )}
                            {filteredTeachers.map((row) => (
                                editingTeacherId === row.teacher_no ? (
                                    <tr key={row.teacher_no} className="border-b border-gray-100 bg-amber-50/40 text-sm">
                                        <td className="px-2 py-2"><input className={inputClass} value={teacherForm.teacher_id} onChange={(e) => setTeacherForm((prev) => ({ ...prev, teacher_id: e.target.value }))} /></td>
                                        <td className="px-2 py-2"><input className={inputClass} value={teacherForm.name} onChange={(e) => setTeacherForm((prev) => ({ ...prev, name: e.target.value }))} /></td>
                                        <td className="px-2 py-2"><input className={inputClass} value={teacherForm.tell} onChange={(e) => setTeacherForm((prev) => ({ ...prev, tell: e.target.value }))} /></td>
                                        <td className="px-2 py-2"><input className={inputClass} type="email" value={teacherForm.email} onChange={(e) => setTeacherForm((prev) => ({ ...prev, email: e.target.value }))} /></td>
                                        <td className="px-2 py-2">
                                            <select className={inputClass} value={teacherForm.gender} onChange={(e) => setTeacherForm((prev) => ({ ...prev, gender: e.target.value }))}>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2"><input className={inputClass} type="date" value={teacherForm.hire_date} onChange={(e) => setTeacherForm((prev) => ({ ...prev, hire_date: e.target.value }))} /></td>
                                        <td className="px-2 py-2">
                                            <select className={inputClass} value={teacherForm.status} onChange={(e) => setTeacherForm((prev) => ({ ...prev, status: e.target.value }))}>
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => saveEditedTeacher(row.teacher_no)} className="rounded-md border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50">Update</button>
                                                <button type="button" onClick={cancelTeacherEdit} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={row.teacher_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-2 py-2 text-gray-800">{row.teacher_id || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.name || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.tell || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.email || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.gender || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.hire_date || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{row.status || '-'}</td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => onEditTeacher(row)} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                                                <button type="button" onClick={() => onDeleteTeacher(row)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ))}
                            {!tableLoading && filteredTeachers.length === 0 && <tr><td colSpan={8} className="px-2 py-8 text-center text-sm text-gray-500">No active teachers found.</td></tr>}
                        </tbody>
                    </table>
                </div>

                {addTeacherModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Add New Teacher</h3>
                                    <p className="mt-1 text-sm text-slate-600">Teacher ID and password are generated automatically.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAddTeacherModal}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={onSubmitTeacher} className="flex min-h-0 flex-1 flex-col">
                                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <label className="block">
                                            <span className={modalLabelClass}>
                                                <UserRound size={15} className="text-slate-500" />
                                                <span>Full Name *</span>
                                            </span>
                                            <input type="text" value={createTeacherForm.name} onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter teacher name" className={modalInputClass} required />
                                        </label>
                                        <label className="block">
                                            <span className={modalLabelClass}>
                                                <Phone size={15} className="text-slate-500" />
                                                <span>Phone Number</span>
                                            </span>
                                            <input type="text" value={createTeacherForm.tell} onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, tell: e.target.value }))} placeholder="Enter phone number" className={modalInputClass} />
                                        </label>
                                        <label className="block">
                                            <span className={modalLabelClass}>
                                                <Mail size={15} className="text-slate-500" />
                                                <span>Email</span>
                                            </span>
                                            <input type="email" value={createTeacherForm.email} onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Enter email address" className={modalInputClass} />
                                        </label>
                                        <label className="block">
                                            <span className={modalLabelClass}>
                                                <UserRound size={15} className="text-slate-500" />
                                                <span>Gender</span>
                                            </span>
                                            <select value={createTeacherForm.gender} onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, gender: e.target.value }))} className={modalInputClass}>
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </label>
                                        <label className="block md:col-span-2">
                                            <span className={modalLabelClass}>
                                                <MapPin size={15} className="text-slate-500" />
                                                <span>Address *</span>
                                            </span>
                                            <select
                                                value={createTeacherForm.add_no}
                                                onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, add_no: e.target.value }))}
                                                className={modalInputClass}
                                                required
                                            >
                                                <option value="">Select address</option>
                                                {addressOptions.map((a) => (
                                                    <option key={a.add_no} value={a.add_no}>
                                                        {a.address_label || a.district || `Address ${a.add_no}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block md:col-span-2">
                                            <span className={modalLabelClass}>
                                                <CalendarDays size={15} className="text-slate-500" />
                                                <span>Hire Date</span>
                                            </span>
                                            <input type="date" value={createTeacherForm.hire_date} onChange={(e) => setCreateTeacherForm((prev) => ({ ...prev, hire_date: e.target.value }))} className={modalInputClass} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-3">
                                    <button type="button" onClick={closeAddTeacherModal} className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                    <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Create Teacher</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
        },
        [
            activeTab,
            addTeacherModalOpen,
            createTeacherForm.email,
            createTeacherForm.gender,
            createTeacherForm.add_no,
            createTeacherForm.hire_date,
            createTeacherForm.name,
            createTeacherForm.tell,
            addressOptions,
            editingTeacherId,
            loading,
            setStateModalOpen,
            stateForm.status,
            stateForm.teacher_no,
            teacherSearch,
            tableLoading,
            teacherForm.email,
            teacherForm.gender,
            teacherForm.hire_date,
            teacherForm.name,
            teacherForm.status,
            teacherForm.teacher_id,
            teacherForm.tell,
            teachers
        ]
    );

    return (
        <TabbedPageShell
            title="Teacher Management"
            description="Manage teacher records and account states from one place."
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        >
            {errorMessage && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>}
            {successMessage && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>}
            {content}
        </TabbedPageShell>
    );
};

export default TeacherManagement;
