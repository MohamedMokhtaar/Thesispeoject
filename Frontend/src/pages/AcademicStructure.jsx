import React, { useEffect, useState } from 'react';
import { BookOpen, Building2, CalendarDays, GraduationCap, Library, MapPin, Plus, School, Shapes, UserSquare2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSearchParams } from 'react-router-dom';
import academicStructureService from '../api/academicStructureService';
import TabbedPageShell from '../components/TabbedPageShell';

const tabs = [
    { key: 'campuses', label: 'Campuses' },
    { key: 'faculties', label: 'Faculties' },
    { key: 'departments', label: 'Departments' },
    { key: 'classes', label: 'Classes' },
    { key: 'semesters', label: 'Semesters' },
    { key: 'academics', label: 'Academics' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'subject-class', label: 'Subject Class' }
];

const tabMeta = {
    campuses: { icon: MapPin, title: 'Campus Management', description: 'Create, update, and delete campus records.' },
    faculties: { icon: Building2, title: 'Faculty Management', description: 'Create, update, and delete faculty records.' },
    departments: { icon: UserSquare2, title: 'Department Management', description: 'Create departments and map them to faculties.' },
    classes: { icon: School, title: 'Class Management', description: 'Create classes and map them to departments and campuses.' },
    semesters: { icon: CalendarDays, title: 'Semester Setup', description: 'Create, update, and delete semester records.' },
    academics: { icon: GraduationCap, title: 'Academic Sessions', description: 'Create, update, and delete academic session records.' },
    subjects: { icon: Library, title: 'Subject Management', description: 'Create, update, and delete subjects and codes.' },
    'subject-class': { icon: Shapes, title: 'Subject Class Mapping', description: 'Manage subject-to-class assignments with teacher mapping.' }
};

const compactSwal = {
    width: 340,
    padding: '0.9rem',
    confirmButtonColor: '#1E5EFF',
    cancelButtonColor: '#9CA3AF',
    buttonsStyling: true
};

const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100';

const initialForms = {
    campuses: { name: '' },
    faculties: { name: '' },
    departments: { name: '', faculty_no: '' },
    classes: { cl_name: '', dept_no: '', camp_no: '' },
    semesters: { semister_name: '' },
    academics: { start_date: '', end_date: '', active_year: '' },
    subjects: { name: '', code: '' }
};

const initialSubjectClassForm = { sub_no: '', cls_no: '', teacher_no: '' };
const createSubjectClassDraft = () => ({
    draft_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sub_no: '',
    cls_no: '',
    teacher_no: ''
});

const configs = {
    campuses: {
        label: 'Campus', id: 'camp_no', fields: ['name'], columns: [['name', 'Campus Name']],
        list: academicStructureService.listCampuses, create: academicStructureService.createCampus,
        update: academicStructureService.updateCampus, remove: academicStructureService.deleteCampus
    },
    faculties: {
        label: 'Faculty', id: 'faculty_no', fields: ['name'], columns: [['name', 'Faculty Name']],
        list: academicStructureService.listFaculties, create: academicStructureService.createFaculty,
        update: academicStructureService.updateFaculty, remove: academicStructureService.deleteFaculty
    },
    departments: {
        label: 'Department', id: 'dept_no', fields: ['name', 'faculty_no'], columns: [['name', 'Department'], ['faculty_name', 'Faculty']],
        list: academicStructureService.listDepartments, create: academicStructureService.createDepartment,
        update: academicStructureService.updateDepartment, remove: academicStructureService.deleteDepartment
    },
    classes: {
        label: 'Class', id: 'cls_no', fields: ['cl_name', 'dept_no', 'camp_no'], columns: [['cl_name', 'Class Name'], ['department_name', 'Department'], ['campus_name', 'Campus']],
        list: academicStructureService.listClasses, create: academicStructureService.createClass,
        update: academicStructureService.updateClass, remove: academicStructureService.deleteClass
    },
    semesters: {
        label: 'Semester', id: 'sem_no', fields: ['semister_name'], columns: [['semister_name', 'Semester Name']],
        list: academicStructureService.listSemesters, create: academicStructureService.createSemester,
        update: academicStructureService.updateSemester, remove: academicStructureService.deleteSemester
    },
    academics: {
        label: 'Academic Session', id: 'acy_no', fields: ['start_date', 'end_date', 'active_year'], dateFields: ['start_date', 'end_date'],
        columns: [['active_year', 'Active Year'], ['start_date', 'Start Date'], ['end_date', 'End Date']],
        list: academicStructureService.listAcademics, create: academicStructureService.createAcademic,
        update: academicStructureService.updateAcademic, remove: academicStructureService.deleteAcademic
    },
    subjects: {
        label: 'Subject', id: 'sub_no', fields: ['name', 'code'], columns: [['name', 'Subject Name'], ['code', 'Code']],
        list: academicStructureService.listSubjects, create: academicStructureService.createSubject,
        update: academicStructureService.updateSubject, remove: academicStructureService.deleteSubject
    }
};

const placeholderText = {};

const crudTabs = Object.keys(configs);
const fieldLabelMap = {
    name: 'Name',
    faculty_no: 'Faculty',
    dept_no: 'Department',
    camp_no: 'Campus',
    cl_name: 'Class Name',
    semister_name: 'Semester Name',
    start_date: 'Start Date',
    end_date: 'End Date',
    active_year: 'Active Year',
    code: 'Code'
};

const AcademicStructure = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab') || 'faculties';
    const activeTab = tabs.some((tab) => tab.key === rawTab) ? rawTab : 'faculties';
    const section = tabMeta[activeTab];
    const Icon = section.icon;
    const cfg = configs[activeTab];

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [rows, setRows] = useState({ campuses: [], faculties: [], departments: [], classes: [], semesters: [], academics: [], subjects: [] });
    const [crudSearch, setCrudSearch] = useState('');
    const [forms, setForms] = useState(initialForms);
    const [editing, setEditing] = useState({ campuses: null, faculties: null, departments: null, classes: null, semesters: null, academics: null, subjects: null });
    const [subjectClassRows, setSubjectClassRows] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [crudModalOpen, setCrudModalOpen] = useState(false);
    const [subjectClassModalOpen, setSubjectClassModalOpen] = useState(false);
    const [subjectClassDrafts, setSubjectClassDrafts] = useState([]);
    const [editingSubjectClassId, setEditingSubjectClassId] = useState(null);
    const [editingSubjectClassForm, setEditingSubjectClassForm] = useState(initialSubjectClassForm);

    const clearMessages = () => { setErrorMessage(''); setSuccessMessage(''); };
    const extractError = (error, fallback) =>
        error?.response?.data?.message || (error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : fallback);

    const loadTab = async (tab, { showLoader = true, preserveMessages = false } = {}) => {
        if (!crudTabs.includes(tab) && tab !== 'subject-class') return;
        if (showLoader) setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            if (tab === 'departments') {
                const [fRes, dRes] = await Promise.all([academicStructureService.listFaculties(), academicStructureService.listDepartments()]);
                if (fRes.success) setRows((prev) => ({ ...prev, faculties: fRes.data || [] }));
                if (dRes.success) setRows((prev) => ({ ...prev, departments: dRes.data || [] }));
            } else if (tab === 'classes') {
                const [cRes, dRes, campusRes] = await Promise.all([
                    academicStructureService.listClasses(),
                    academicStructureService.listDepartments(),
                    academicStructureService.listCampuses()
                ]);
                if (cRes.success) setRows((prev) => ({ ...prev, classes: cRes.data || [] }));
                if (dRes.success) setRows((prev) => ({ ...prev, departments: dRes.data || [] }));
                if (campusRes.success) setRows((prev) => ({ ...prev, campuses: campusRes.data || [] }));
            } else if (tab === 'subject-class') {
                const [mappingRes, subjectRes, classRes, teacherRes] = await Promise.all([
                    academicStructureService.listSubjectClasses(),
                    academicStructureService.listSubjects(),
                    academicStructureService.listClasses(),
                    academicStructureService.listTeacherOptions()
                ]);
                if (mappingRes.success) setSubjectClassRows(mappingRes.data || []);
                if (subjectRes.success) setRows((prev) => ({ ...prev, subjects: subjectRes.data || [] }));
                if (classRes.success) setRows((prev) => ({ ...prev, classes: classRes.data || [] }));
                if (teacherRes.success) setTeacherOptions(teacherRes.data || []);
            } else {
                const res = await configs[tab].list();
                if (res.success) setRows((prev) => ({ ...prev, [tab]: res.data || [] }));
            }
        } catch (error) {
            setErrorMessage(extractError(error, `Failed to load ${tab}.`));
        } finally {
            if (showLoader) setTableLoading(false);
        }
    };

    useEffect(() => {
        loadTab(activeTab, { showLoader: true, preserveMessages: false });
        setCrudModalOpen(false);
        setCrudSearch('');
    }, [activeTab]);

    const onTabChange = (tab) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!cfg) return;
        setLoading(true);
        clearMessages();
        try {
            const id = editing[activeTab];
            if (id) await cfg.update(id, forms[activeTab]);
            else await cfg.create(forms[activeTab]);
            setSuccessMessage(`${cfg.label} ${id ? 'updated' : 'created'} successfully.`);
            setForms((prev) => ({ ...prev, [activeTab]: { ...initialForms[activeTab] } }));
            setEditing((prev) => ({ ...prev, [activeTab]: null }));
            setCrudModalOpen(false);
            await loadTab(activeTab, { showLoader: true, preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, `Failed to save ${cfg.label.toLowerCase()}.`));
        } finally {
            setLoading(false);
        }
    };

    const onEdit = (row) => {
        if (!cfg) return;
        const next = { ...initialForms[activeTab] };
        Object.keys(next).forEach((key) => { next[key] = row[key] ?? ''; });
        if (activeTab === 'departments') next.faculty_no = next.faculty_no ? String(next.faculty_no) : '';
        if (activeTab === 'classes') {
            next.dept_no = next.dept_no ? String(next.dept_no) : '';
            next.camp_no = next.camp_no ? String(next.camp_no) : '';
        }
        setForms((prev) => ({ ...prev, [activeTab]: next }));
        setEditing((prev) => ({ ...prev, [activeTab]: row[cfg.id] }));
        setCrudModalOpen(true);
        clearMessages();
    };

    const onDelete = async (row) => {
        if (!cfg) return;
        const result = await Swal.fire({
            ...compactSwal, title: `Delete ${cfg.label}?`, text: 'This action cannot be undone.', icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Delete', cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await cfg.remove(row[cfg.id]);
            if (editing[activeTab] === row[cfg.id]) {
                setEditing((prev) => ({ ...prev, [activeTab]: null }));
                setForms((prev) => ({ ...prev, [activeTab]: { ...initialForms[activeTab] } }));
                setCrudModalOpen(false);
            }
            setSuccessMessage(`${cfg.label} deleted successfully.`);
            await loadTab(activeTab, { showLoader: true, preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, `Failed to delete ${cfg.label.toLowerCase()}.`));
        } finally {
            setLoading(false);
        }
    };

    const openSubjectClassModal = () => {
        setSubjectClassDrafts([createSubjectClassDraft()]);
        setSubjectClassModalOpen(true);
        clearMessages();
    };

    const closeSubjectClassModal = () => {
        setSubjectClassModalOpen(false);
        setSubjectClassDrafts([]);
    };

    const addSubjectClassDraftRow = () => {
        setSubjectClassDrafts((prev) => [...prev, createSubjectClassDraft()]);
    };

    const onChangeSubjectClassDraft = (draftId, field, value) => {
        setSubjectClassDrafts((prev) => prev.map((row) => (row.draft_id === draftId ? { ...row, [field]: value } : row)));
    };

    const removeSubjectClassDraftRow = (draftId) => {
        setSubjectClassDrafts((prev) => {
            const next = prev.filter((row) => row.draft_id !== draftId);
            return next.length > 0 ? next : [createSubjectClassDraft()];
        });
    };

    const createSubjectClass = async (e) => {
        e.preventDefault();
        clearMessages();
        const hasInvalid = subjectClassDrafts.some((row) => !row.sub_no || !row.cls_no || !row.teacher_no);
        if (hasInvalid) {
            setErrorMessage('Please fill subject, class, and teacher for every row.');
            return;
        }

        setLoading(true);
        try {
            for (const row of subjectClassDrafts) {
                await academicStructureService.createSubjectClass({
                    sub_no: Number(row.sub_no),
                    cls_no: Number(row.cls_no),
                    teacher_no: Number(row.teacher_no)
                });
            }
            closeSubjectClassModal();
            setSuccessMessage(`${subjectClassDrafts.length} subject class mapping(s) created successfully.`);
            await loadTab('subject-class', { showLoader: true, preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to create subject class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const onEditSubjectClass = (row) => {
        setEditingSubjectClassId(row.sub_cl_no);
        setEditingSubjectClassForm({
            sub_no: row.sub_no ? String(row.sub_no) : '',
            cls_no: row.cls_no ? String(row.cls_no) : '',
            teacher_no: row.teacher_no ? String(row.teacher_no) : ''
        });
        clearMessages();
    };

    const cancelSubjectClassEdit = () => {
        setEditingSubjectClassId(null);
        setEditingSubjectClassForm({ ...initialSubjectClassForm });
        clearMessages();
    };

    const saveEditedSubjectClass = async (subClNo) => {
        setLoading(true);
        clearMessages();
        try {
            await academicStructureService.updateSubjectClass(subClNo, {
                sub_no: Number(editingSubjectClassForm.sub_no),
                cls_no: Number(editingSubjectClassForm.cls_no),
                teacher_no: Number(editingSubjectClassForm.teacher_no)
            });
            cancelSubjectClassEdit();
            setSuccessMessage('Subject class mapping updated successfully.');
            await loadTab('subject-class', { showLoader: true, preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to update subject class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const onDeleteSubjectClass = async (row) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Subject Class?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await academicStructureService.deleteSubjectClass(row.sub_cl_no);
            if (editingSubjectClassId === row.sub_cl_no) {
                cancelSubjectClassEdit();
            }
            setSuccessMessage('Subject class mapping deleted successfully.');
            await loadTab('subject-class', { showLoader: true, preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete subject class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const openCrudModal = () => {
        setEditing((prev) => ({ ...prev, [activeTab]: null }));
        setForms((prev) => ({ ...prev, [activeTab]: { ...initialForms[activeTab] } }));
        setCrudModalOpen(true);
        clearMessages();
    };

    const closeCrudModal = () => {
        setCrudModalOpen(false);
        setEditing((prev) => ({ ...prev, [activeTab]: null }));
        setForms((prev) => ({ ...prev, [activeTab]: { ...initialForms[activeTab] } }));
        clearMessages();
    };

    const getFieldLabel = (field) =>
        fieldLabelMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

    const renderCrudField = (field) => {
        const fieldLabel = getFieldLabel(field);
        const fieldWrapperClass = cfg.fields.length === 1 ? 'md:col-span-2' : '';

        if (field === 'faculty_no') {
            return (
                <label key={field} className={`flex flex-col gap-1.5 ${fieldWrapperClass}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fieldLabel}</span>
                    <select
                        value={forms[activeTab][field]}
                        onChange={(e) => setForms((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: e.target.value } }))}
                        className={inputClass}
                        required
                    >
                        <option value="">Select Faculty</option>
                        {rows.faculties.map((f) => <option key={f.faculty_no} value={f.faculty_no}>{f.name}</option>)}
                    </select>
                </label>
            );
        }

        if (field === 'dept_no') {
            return (
                <label key={field} className={`flex flex-col gap-1.5 ${fieldWrapperClass}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fieldLabel}</span>
                    <select
                        value={forms[activeTab][field]}
                        onChange={(e) => setForms((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: e.target.value } }))}
                        className={inputClass}
                        required
                    >
                        <option value="">Select Department</option>
                        {rows.departments.map((d) => <option key={d.dept_no} value={d.dept_no}>{`${d.name}${d.faculty_name ? ` (${d.faculty_name})` : ''}`}</option>)}
                    </select>
                </label>
            );
        }

        if (field === 'camp_no') {
            return (
                <label key={field} className={`flex flex-col gap-1.5 ${fieldWrapperClass}`}>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fieldLabel}</span>
                    <select
                        value={forms[activeTab][field]}
                        onChange={(e) => setForms((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: e.target.value } }))}
                        className={inputClass}
                        required
                    >
                        <option value="">Select Campus</option>
                        {rows.campuses.map((c) => <option key={c.camp_no} value={c.camp_no}>{c.name}</option>)}
                    </select>
                </label>
            );
        }

        return (
            <label key={field} className={`flex flex-col gap-1.5 ${fieldWrapperClass}`}>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{fieldLabel}</span>
                <input
                    type={cfg.dateFields?.includes(field) ? 'date' : 'text'}
                    value={forms[activeTab][field]}
                    onChange={(e) => setForms((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [field]: e.target.value } }))}
                    className={inputClass}
                    placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                    required
                />
            </label>
        );
    };

    const renderCrud = () => {
        const isSingleFieldForm = cfg.fields.length === 1;
        const searchValue = crudSearch.trim().toLowerCase();
        const filteredRows = searchValue
            ? rows[activeTab].filter((row) =>
                cfg.columns.some(([key]) => String(row[key] ?? '').toLowerCase().includes(searchValue)))
            : rows[activeTab];

        return (
            <div className="space-y-5">
                <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <input
                        type="text"
                        value={crudSearch}
                        onChange={(e) => setCrudSearch(e.target.value)}
                        placeholder={`Search ${cfg.label.toLowerCase()}...`}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-sm"
                    />
                    <button
                        type="button"
                        onClick={openCrudModal}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                        <Plus size={14} />
                        Add
                    </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                        <thead><tr className="border-b border-gray-200 bg-gray-50">{cfg.columns.map(([_, label]) => <th key={label} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</th>)}<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th></tr></thead>
                        <tbody>
                            {tableLoading && <tr><td colSpan={cfg.columns.length + 1} className="px-3 py-8 text-center text-sm text-gray-500">Loading.....</td></tr>}
                            {filteredRows.map((row) => (
                                <tr key={row[cfg.id]} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    {cfg.columns.map(([key]) => <td key={`${row[cfg.id]}-${key}`} className="px-3 py-3 text-gray-800">{row[key] || '-'}</td>)}
                                    <td className="px-3 py-3"><div className="flex gap-2"><button type="button" onClick={() => onEdit(row)} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button><button type="button" onClick={() => onDelete(row)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button></div></td>
                                </tr>
                            ))}
                            {!tableLoading && filteredRows.length === 0 && <tr><td colSpan={cfg.columns.length + 1} className="px-3 py-8 text-center text-sm text-gray-500">{searchValue ? 'No matching records found.' : 'No records found.'}</td></tr>}
                        </tbody>
                    </table>
                </div>

            {crudModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-slate-50 to-cyan-50 px-6 py-5">
                            <h3 className="text-lg font-semibold text-slate-900">{editing[activeTab] ? `Edit ${cfg.label}` : `Add ${cfg.label}`}</h3>
                            <p className="mt-1 text-sm text-slate-600">Complete the required fields and save to continue.</p>
                        </div>
                        <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
                            <div className={isSingleFieldForm ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-4 md:grid-cols-2'}>
                                {cfg.fields.map((field) => renderCrudField(field))}
                            </div>
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={closeCrudModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{editing[activeTab] ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        );
    };

    const renderSubjectClassCrud = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-sm text-gray-600">Manage subject-class-teacher mappings directly from this table.</p>
                <button
                    type="button"
                    onClick={openSubjectClassModal}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                    <Plus size={14} />
                    Add
                </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Code</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableLoading && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">Loading.....</td>
                            </tr>
                        )}
                        {subjectClassRows.map((row) => (
                            editingSubjectClassId === row.sub_cl_no ? (
                                <tr key={row.sub_cl_no} className="border-b border-gray-100 bg-amber-50/40 text-sm">
                                    <td className="px-3 py-2">
                                        <select
                                            className={inputClass}
                                            value={editingSubjectClassForm.sub_no}
                                            onChange={(e) => setEditingSubjectClassForm((prev) => ({ ...prev, sub_no: e.target.value }))}
                                        >
                                            <option value="">Select Subject</option>
                                            {rows.subjects.map((s) => <option key={s.sub_no} value={s.sub_no}>{`${s.name}${s.code ? ` (${s.code})` : ''}`}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">-</td>
                                    <td className="px-3 py-2">
                                        <select
                                            className={inputClass}
                                            value={editingSubjectClassForm.cls_no}
                                            onChange={(e) => setEditingSubjectClassForm((prev) => ({ ...prev, cls_no: e.target.value }))}
                                        >
                                            <option value="">Select Class</option>
                                            {rows.classes.map((c) => <option key={c.cls_no} value={c.cls_no}>{c.cl_name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            className={inputClass}
                                            value={editingSubjectClassForm.teacher_no}
                                            onChange={(e) => setEditingSubjectClassForm((prev) => ({ ...prev, teacher_no: e.target.value }))}
                                        >
                                            <option value="">Select Teacher</option>
                                            {teacherOptions.map((t) => <option key={t.teacher_no} value={t.teacher_no}>{t.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => saveEditedSubjectClass(row.sub_cl_no)} className="rounded-md border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50">Update</button>
                                            <button type="button" onClick={cancelSubjectClassEdit} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={row.sub_cl_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                    <td className="px-3 py-3 text-gray-800">{row.subject_name || '-'}</td>
                                    <td className="px-3 py-3 text-gray-800">{row.subject_code || '-'}</td>
                                    <td className="px-3 py-3 text-gray-800">{row.cl_name || '-'}</td>
                                    <td className="px-3 py-3 text-gray-800">{row.teacher_name || '-'}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => onEditSubjectClass(row)} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                                            <button type="button" onClick={() => onDeleteSubjectClass(row)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ))}
                        {!tableLoading && subjectClassRows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">No subject class mappings found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {subjectClassModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-4">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h3 className="text-base font-semibold text-black">Add Subject Class Mapping</h3>
                            <p className="mt-1 text-sm text-gray-600">Use + at the end of any row to add more mappings, then submit all at once.</p>
                        </div>
                        <form onSubmit={createSubjectClass} className="flex min-h-0 flex-1 flex-col">
                            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                                <div className="overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Teacher</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subjectClassDrafts.map((row) => (
                                                <tr key={row.draft_id} className="border-b border-gray-100 text-sm">
                                                    <td className="px-3 py-2">
                                                        <select className={inputClass} value={row.sub_no} onChange={(e) => onChangeSubjectClassDraft(row.draft_id, 'sub_no', e.target.value)}>
                                                            <option value="">Select Subject</option>
                                                            {rows.subjects.map((s) => <option key={s.sub_no} value={s.sub_no}>{`${s.name}${s.code ? ` (${s.code})` : ''}`}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select className={inputClass} value={row.cls_no} onChange={(e) => onChangeSubjectClassDraft(row.draft_id, 'cls_no', e.target.value)}>
                                                            <option value="">Select Class</option>
                                                            {rows.classes.map((c) => <option key={c.cls_no} value={c.cls_no}>{c.cl_name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select className={inputClass} value={row.teacher_no} onChange={(e) => onChangeSubjectClassDraft(row.draft_id, 'teacher_no', e.target.value)}>
                                                            <option value="">Select Teacher</option>
                                                            {teacherOptions.map((t) => <option key={t.teacher_no} value={t.teacher_no}>{t.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={addSubjectClassDraftRow} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">+</button>
                                                            <button type="button" onClick={() => removeSubjectClassDraftRow(row.draft_id)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100">Remove</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                                <button type="button" onClick={closeSubjectClassModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Add All</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <TabbedPageShell title="Academic Structure" description="Centralized setup for campuses, faculties, departments, classes, semesters, and subjects." tabs={tabs} activeTab={activeTab} onTabChange={onTabChange}>
            <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18} /></div>
                <div><h2 className="text-lg font-semibold text-black">{section.title}</h2><p className="text-sm text-gray-600">{section.description}</p></div>
            </div>
            {errorMessage && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>}
            {successMessage && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>}
            {crudTabs.includes(activeTab) ? renderCrud() : activeTab === 'subject-class' ? renderSubjectClassCrud() : <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600"><div className="flex items-center gap-2"><BookOpen size={16} className="text-blue-600" /><span>{placeholderText[activeTab]}</span></div></div>}
        </TabbedPageShell>
    );
};

export default AcademicStructure;
