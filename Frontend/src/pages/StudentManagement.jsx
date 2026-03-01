import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, CreditCard, Link2, Mail, MapPin, Phone, School, UserRound, Users, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useSearchParams } from 'react-router-dom';
import studentManagementService from '../api/studentManagementService';
import TabbedPageShell from '../components/TabbedPageShell';

const tabs = [
    { key: 'addresses', label: 'Address' },
    { key: 'schools', label: 'Schools' },
    { key: 'parents', label: 'Parents' },
    { key: 'students', label: 'Students' },
    { key: 'student-class', label: 'Student Class' },
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
    'h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const modalLabelClass = 'mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700';

const emptyStudentForm = {
    student_id: '',
    name: '',
    tell: '',
    gender: '',
    student_email: '',
    add_no: '',
    dob: '',
    parent_no: '',
    register_date: '',
    mother: '',
    pob: '',
    graduation_year: '',
    grade: '',
    sch_no: '',
    shift_no: '',
    nira: ''
};

const createStudentClassDraft = () => ({
    draft_id: `sc-draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    std_id: '',
    cls_no: '',
    sem_no: '',
    acy_no: ''
});

const emptyStudentStateForm = {
    std_id: '',
    status: 'Active'
};

const StudentManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get('tab') || 'schools';
    const activeTab = tabs.some((tab) => tab.key === rawTab) ? rawTab : 'schools';

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [addresses, setAddresses] = useState([]);
    const [addressForm, setAddressForm] = useState({ district: '', villages: '', area: '' });
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressSearch, setAddressSearch] = useState('');
    const [addressModalOpen, setAddressModalOpen] = useState(false);

    const [schools, setSchools] = useState([]);
    const [schoolForm, setSchoolForm] = useState({ name: '', addres: '' });
    const [editingSchoolId, setEditingSchoolId] = useState(null);
    const [schoolSearch, setSchoolSearch] = useState('');
    const [schoolModalOpen, setSchoolModalOpen] = useState(false);

    const [parents, setParents] = useState([]);
    const [parentForm, setParentForm] = useState({ name: '', tell1: '', tell2: '' });
    const [editingParentId, setEditingParentId] = useState(null);
    const [parentSearch, setParentSearch] = useState('');
    const [parentModalOpen, setParentModalOpen] = useState(false);

    const [students, setStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentClassSearch, setStudentClassSearch] = useState('');
    const [shiftOptions, setShiftOptions] = useState([]);
    const [studentModalOpen, setStudentModalOpen] = useState(false);
    const [studentModalMode, setStudentModalMode] = useState('create');
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [studentForm, setStudentForm] = useState({ ...emptyStudentForm });
    const [studentStateModalOpen, setStudentStateModalOpen] = useState(false);
    const [studentStateForm, setStudentStateForm] = useState({ ...emptyStudentStateForm });

    const [studentClasses, setStudentClasses] = useState([]);
    const [studentClassDrafts, setStudentClassDrafts] = useState([]);
    const [studentClassModalOpen, setStudentClassModalOpen] = useState(false);
    const [studentClassForm, setStudentClassForm] = useState({ std_id: '', cls_no: '', sem_no: '', acy_no: '' });
    const [editingStudentClassId, setEditingStudentClassId] = useState(null);
    const [classOptions, setClassOptions] = useState([]);
    const [semesterOptions, setSemesterOptions] = useState([]);
    const [academicOptions, setAcademicOptions] = useState([]);

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

    const toNullableNumber = (value) => (value === '' || value === null || value === undefined ? null : Number(value));

    const studentPayload = (form) => ({
            name: form.name,
            tell: form.tell || null,
            gender: form.gender || null,
            student_email: form.student_email || null,
            add_no: toNullableNumber(form.add_no),
            dob: form.dob || null,
            parent_no: toNullableNumber(form.parent_no),
            register_date: form.register_date || null,
            mother: form.mother || null,
            pob: form.pob,
            graduation_year: toNullableNumber(form.graduation_year),
            grade: form.grade,
            sch_no: toNullableNumber(form.sch_no),
            shift_no: toNullableNumber(form.shift_no),
            nira: form.nira || null
        });

    const loadAddresses = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const res = await studentManagementService.listAddresses();
            if (res.success) {
                setAddresses(res.data || []);
            }
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load addresses.'));
        } finally {
            setTableLoading(false);
        }
    };

    const loadSchools = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const res = await studentManagementService.listSchools();
            if (res.success) {
                setSchools(res.data || []);
            }
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load schools.'));
        } finally {
            setTableLoading(false);
        }
    };

    const loadParents = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const res = await studentManagementService.listParents();
            if (res.success) {
                setParents(res.data || []);
            }
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load parents.'));
        } finally {
            setTableLoading(false);
        }
    };

    const loadStudents = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const [studentsRes, schoolsRes, parentsRes, addressRes, shiftRes] = await Promise.all([
                studentManagementService.listStudents(),
                studentManagementService.listSchools(),
                studentManagementService.listParents(),
                studentManagementService.listAddressOptions(),
                studentManagementService.listShiftOptions()
            ]);
            if (studentsRes.success) setStudents(studentsRes.data || []);
            if (schoolsRes.success) setSchools(schoolsRes.data || []);
            if (parentsRes.success) setParents(parentsRes.data || []);
            if (addressRes.success) setAddresses(addressRes.data || []);
            if (shiftRes.success) setShiftOptions(shiftRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load students.'));
        } finally {
            setTableLoading(false);
        }
    };

    const loadStudentClasses = async ({ preserveMessages = false } = {}) => {
        setTableLoading(true);
        if (!preserveMessages) clearMessages();
        try {
            const [scRes, studentsRes, classesRes, semRes, acyRes] = await Promise.all([
                studentManagementService.listStudentClasses(),
                studentManagementService.listStudents(),
                studentManagementService.listClassOptions(),
                studentManagementService.listSemesterOptions(),
                studentManagementService.listAcademicOptions()
            ]);
            if (scRes.success) setStudentClasses(scRes.data || []);
            if (studentsRes.success) setStudents(studentsRes.data || []);
            if (classesRes.success) setClassOptions(classesRes.data || []);
            if (semRes.success) setSemesterOptions(semRes.data || []);
            if (acyRes.success) setAcademicOptions(acyRes.data || []);
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to load student classes.'));
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        setAddressModalOpen(false);
        setSchoolModalOpen(false);
        setParentModalOpen(false);
        setAddressSearch('');
        setSchoolSearch('');
        setParentSearch('');

        if (activeTab === 'addresses') {
            loadAddresses();
        } else if (activeTab === 'schools') {
            loadSchools();
        } else if (activeTab === 'parents') {
            loadParents();
        } else if (activeTab === 'students' || activeTab === 'states') {
            loadStudents();
        } else if (activeTab === 'student-class') {
            loadStudentClasses();
        } else {
            clearMessages();
        }
    }, [activeTab]);

    const onSubmitAddress = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            if (editingAddressId) {
                await studentManagementService.updateAddress(editingAddressId, addressForm);
                setSuccessMessage('Address updated successfully.');
            } else {
                await studentManagementService.createAddress(addressForm);
                setSuccessMessage('Address created successfully.');
            }

            setAddressForm({ district: '', villages: '', area: '' });
            setEditingAddressId(null);
            setAddressModalOpen(false);
            await loadAddresses({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to save address.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateAddressModal = () => {
        clearMessages();
        setEditingAddressId(null);
        setAddressForm({ district: '', villages: '', area: '' });
        setAddressModalOpen(true);
    };

    const closeAddressModal = () => {
        setAddressModalOpen(false);
        setEditingAddressId(null);
        setAddressForm({ district: '', villages: '', area: '' });
        clearMessages();
    };

    const onEditAddress = (address) => {
        clearMessages();
        setEditingAddressId(address.add_no);
        setAddressForm({
            district: address.district || '',
            villages: address.villages || '',
            area: address.area || ''
        });
        setAddressModalOpen(true);
    };

    const onDeleteAddress = async (address) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Address?',
            text: `Are you sure you want to delete "${address.district}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.deleteAddress(address.add_no);
            if (editingAddressId === address.add_no) {
                setEditingAddressId(null);
                setAddressForm({ district: '', villages: '', area: '' });
                setAddressModalOpen(false);
            }
            setSuccessMessage('Address deleted successfully.');
            await Swal.fire({
                ...compactSwal,
                title: 'Deleted',
                text: 'Address deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            await loadAddresses({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete address.'));
            await Swal.fire({
                ...compactSwal,
                title: 'Delete Failed',
                text: extractError(error, 'Failed to delete address.'),
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const onSubmitSchool = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            if (editingSchoolId) {
                await studentManagementService.updateSchool(editingSchoolId, schoolForm);
                setSuccessMessage('School updated successfully.');
            } else {
                await studentManagementService.createSchool(schoolForm);
                setSuccessMessage('School created successfully.');
            }

            setSchoolForm({ name: '', addres: '' });
            setEditingSchoolId(null);
            setSchoolModalOpen(false);
            await loadSchools({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to save school.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateSchoolModal = () => {
        clearMessages();
        setEditingSchoolId(null);
        setSchoolForm({ name: '', addres: '' });
        setSchoolModalOpen(true);
    };

    const closeSchoolModal = () => {
        setSchoolModalOpen(false);
        setEditingSchoolId(null);
        setSchoolForm({ name: '', addres: '' });
        clearMessages();
    };

    const onEditSchool = (school) => {
        clearMessages();
        setEditingSchoolId(school.sch_no);
        setSchoolForm({ name: school.name || '', addres: school.addres || '' });
        setSchoolModalOpen(true);
    };

    const onDeleteSchool = async (school) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete School?',
            text: `Are you sure you want to delete "${school.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.deleteSchool(school.sch_no);
            if (editingSchoolId === school.sch_no) {
                setEditingSchoolId(null);
                setSchoolForm({ name: '', addres: '' });
                setSchoolModalOpen(false);
            }
            setSuccessMessage('School deleted successfully.');
            await Swal.fire({
                ...compactSwal,
                title: 'Deleted',
                text: 'School deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            await loadSchools({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete school.'));
            await Swal.fire({
                ...compactSwal,
                title: 'Delete Failed',
                text: extractError(error, 'Failed to delete school.'),
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const onSubmitParent = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            if (editingParentId) {
                await studentManagementService.updateParent(editingParentId, parentForm);
                setSuccessMessage('Parent updated successfully.');
            } else {
                await studentManagementService.createParent(parentForm);
                setSuccessMessage('Parent created successfully.');
            }

            setParentForm({ name: '', tell1: '', tell2: '' });
            setEditingParentId(null);
            setParentModalOpen(false);
            await loadParents({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to save parent.'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateParentModal = () => {
        clearMessages();
        setEditingParentId(null);
        setParentForm({ name: '', tell1: '', tell2: '' });
        setParentModalOpen(true);
    };

    const closeParentModal = () => {
        setParentModalOpen(false);
        setEditingParentId(null);
        setParentForm({ name: '', tell1: '', tell2: '' });
        clearMessages();
    };

    const onEditParent = (parent) => {
        clearMessages();
        setEditingParentId(parent.parent_no);
        setParentForm({
            name: parent.name || '',
            tell1: parent.tell1 || '',
            tell2: parent.tell2 || ''
        });
        setParentModalOpen(true);
    };

    const onDeleteParent = async (parent) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Parent?',
            text: `Are you sure you want to delete "${parent.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.deleteParent(parent.parent_no);
            if (editingParentId === parent.parent_no) {
                setEditingParentId(null);
                setParentForm({ name: '', tell1: '', tell2: '' });
                setParentModalOpen(false);
            }
            setSuccessMessage('Parent deleted successfully.');
            await Swal.fire({
                ...compactSwal,
                title: 'Deleted',
                text: 'Parent deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            await loadParents({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete parent.'));
            await Swal.fire({
                ...compactSwal,
                title: 'Delete Failed',
                text: extractError(error, 'Failed to delete parent.'),
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const openCreateStudentModal = () => {
        clearMessages();
        setStudentModalMode('create');
        setEditingStudentId(null);
        setStudentForm({ ...emptyStudentForm });
        setStudentModalOpen(true);
    };

    const onEditStudent = (student) => {
        clearMessages();
        setStudentModalMode('edit');
        setEditingStudentId(student.std_id);
        setStudentForm({
            student_id: student.student_id || '',
            name: student.name || '',
            tell: student.tell || '',
            gender: student.gender || '',
            student_email: student.student_email || '',
            add_no: student.add_no ? String(student.add_no) : '',
            dob: student.dob || '',
            parent_no: student.parent_no ? String(student.parent_no) : '',
            register_date: student.register_date || '',
            mother: student.mother || '',
            pob: student.pob || '',
            graduation_year: student.graduation_year ? String(student.graduation_year) : '',
            grade: student.grade || '',
            sch_no: student.sch_no ? String(student.sch_no) : '',
            shift_no: student.shift_no ? String(student.shift_no) : '',
            nira: student.nira || ''
        });
        setStudentModalOpen(true);
    };

    const closeStudentModal = () => {
        setStudentModalOpen(false);
        setStudentModalMode('create');
        setEditingStudentId(null);
        setStudentForm({ ...emptyStudentForm });
    };

    const onSubmitStudentForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        clearMessages();
        try {
            if (studentModalMode === 'edit' && editingStudentId) {
                await studentManagementService.updateStudent(editingStudentId, studentPayload(studentForm));
                setSuccessMessage('Student updated successfully.');
            } else {
                const res = await studentManagementService.createStudent(studentPayload(studentForm));
                const generatedId = res?.generated?.student_id;
                const generatedPassword = res?.generated?.plain_password;
                if (generatedId && generatedPassword) {
                    setSuccessMessage(`Student created. ID: ${generatedId} | Password: ${generatedPassword}`);
                } else {
                    setSuccessMessage('Student created successfully.');
                }
            }
            closeStudentModal();
            await loadStudents({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, studentModalMode === 'edit' ? 'Failed to update student.' : 'Failed to create student.'));
        } finally {
            setLoading(false);
        }
    };

    const onDeleteStudent = async (student) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Student?',
            text: `Are you sure you want to delete "${student.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.deleteStudent(student.std_id);
            if (editingStudentId === student.std_id) closeStudentModal();
            setSuccessMessage('Student deleted successfully.');
            await loadStudents({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete student.'));
        } finally {
            setLoading(false);
        }
    };

    const openStudentStateModal = () => {
        clearMessages();
        setStudentStateForm({ ...emptyStudentStateForm });
        setStudentStateModalOpen(true);
    };

    const closeStudentStateModal = () => {
        setStudentStateModalOpen(false);
        setStudentStateForm({ ...emptyStudentStateForm });
    };

    const onSubmitStudentState = async (e) => {
        e.preventDefault();
        clearMessages();

        const stdId = Number(studentStateForm.std_id);
        if (!stdId) {
            setErrorMessage('Please select a student.');
            return;
        }

        const selectedStudent = students.find((row) => Number(row.std_id) === stdId);
        if (!selectedStudent) {
            setErrorMessage('Selected student was not found.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...studentPayload({
                    name: selectedStudent.name || '',
                    tell: selectedStudent.tell || '',
                    gender: selectedStudent.gender || '',
                    student_email: selectedStudent.student_email || '',
                    add_no: selectedStudent.add_no ?? '',
                    dob: selectedStudent.dob || '',
                    parent_no: selectedStudent.parent_no ?? '',
                    register_date: selectedStudent.register_date || '',
                    mother: selectedStudent.mother || '',
                    pob: selectedStudent.pob || '',
                    graduation_year: selectedStudent.graduation_year ?? '',
                    grade: selectedStudent.grade || '',
                    sch_no: selectedStudent.sch_no ?? '',
                    shift_no: selectedStudent.shift_no ?? '',
                    nira: selectedStudent.nira || ''
                }),
                status: studentStateForm.status
            };

            if (selectedStudent.student_id) {
                payload.student_id = selectedStudent.student_id;
            }

            await studentManagementService.updateStudent(stdId, payload);
            closeStudentStateModal();
            setSuccessMessage(`Student state updated to ${studentStateForm.status}.`);
            await loadStudents({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to set student state.'));
        } finally {
            setLoading(false);
        }
    };

    const openStudentClassModal = () => {
        clearMessages();
        setStudentClassDrafts([createStudentClassDraft()]);
        setStudentClassModalOpen(true);
    };

    const closeStudentClassModal = () => {
        setStudentClassModalOpen(false);
        setStudentClassDrafts([]);
    };

    const addStudentClassDraftRow = () => {
        setStudentClassDrafts((prev) => [...prev, createStudentClassDraft()]);
    };

    const onChangeStudentClassDraft = (draftId, field, value) => {
        setStudentClassDrafts((prev) => prev.map((row) => (row.draft_id === draftId ? { ...row, [field]: value } : row)));
    };

    const removeStudentClassDraftRow = (draftId) => {
        setStudentClassDrafts((prev) => {
            const next = prev.filter((row) => row.draft_id !== draftId);
            return next.length > 0 ? next : [createStudentClassDraft()];
        });
    };

    const saveStudentClassDraftRows = async (e) => {
        e.preventDefault();
        clearMessages();
        const hasInvalid = studentClassDrafts.some((row) => !row.std_id || !row.cls_no || !row.sem_no || !row.acy_no);
        if (hasInvalid) {
            setErrorMessage('Please fill student, class, semester, and academic year for every row.');
            return;
        }
        setLoading(true);
        try {
            for (const row of studentClassDrafts) {
                await studentManagementService.createStudentClass({
                    std_id: Number(row.std_id),
                    cls_no: Number(row.cls_no),
                    sem_no: Number(row.sem_no),
                    acy_no: Number(row.acy_no)
                });
            }
            closeStudentClassModal();
            setSuccessMessage(`${studentClassDrafts.length} student class mapping(s) created successfully.`);
            await loadStudentClasses({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to create student class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const onEditStudentClass = (row) => {
        clearMessages();
        setEditingStudentClassId(row.sc_no);
        setStudentClassForm({
            std_id: String(row.std_id),
            cls_no: String(row.cls_no),
            sem_no: String(row.sem_no),
            acy_no: String(row.acy_no)
        });
    };

    const cancelStudentClassEdit = () => {
        setEditingStudentClassId(null);
        setStudentClassForm({ std_id: '', cls_no: '', sem_no: '', acy_no: '' });
        clearMessages();
    };

    const saveEditedStudentClass = async (scNo) => {
        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.updateStudentClass(scNo, {
                std_id: Number(studentClassForm.std_id),
                cls_no: Number(studentClassForm.cls_no),
                sem_no: Number(studentClassForm.sem_no),
                acy_no: Number(studentClassForm.acy_no)
            });
            setSuccessMessage('Student class mapping updated successfully.');
            cancelStudentClassEdit();
            await loadStudentClasses({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to update student class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const onDeleteStudentClass = async (row) => {
        const result = await Swal.fire({
            ...compactSwal,
            title: 'Delete Student Class?',
            text: 'This mapping will be removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Keep'
        });
        if (!result.isConfirmed) return;

        setLoading(true);
        clearMessages();
        try {
            await studentManagementService.deleteStudentClass(row.sc_no);
            if (editingStudentClassId === row.sc_no) {
                cancelStudentClassEdit();
            }
            setSuccessMessage('Student class mapping deleted successfully.');
            await loadStudentClasses({ preserveMessages: true });
        } catch (error) {
            setErrorMessage(extractError(error, 'Failed to delete student class mapping.'));
        } finally {
            setLoading(false);
        }
    };

    const content = useMemo(() => {
        if (activeTab === 'addresses') {
            const addressQuery = addressSearch.trim().toLowerCase();
            const filteredAddresses = addressQuery
                ? addresses.filter((address) =>
                    [address.district, address.villages, address.area]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(addressQuery)))
                : addresses;

            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={addressSearch}
                            onChange={(e) => setAddressSearch(e.target.value)}
                            placeholder="Search by district, village, or area"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xl"
                        />
                        <button
                            type="button"
                            onClick={openCreateAddressModal}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            + Add Address
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">District</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Village</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Area</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {filteredAddresses.map((address) => (
                                    <tr key={address.add_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-3 py-3 font-medium text-black">{address.district || '-'}</td>
                                        <td className="px-3 py-3 text-gray-700">{address.villages || '-'}</td>
                                        <td className="px-3 py-3 text-gray-700">{address.area || '-'}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditAddress(address)}
                                                    className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteAddress(address)}
                                                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && filteredAddresses.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                            {addressQuery ? 'No matching addresses found.' : 'No addresses found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {addressModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-4">
                            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-slate-50 to-cyan-50 px-6 py-5">
                                    <h3 className="text-lg font-semibold text-slate-900">{editingAddressId ? 'Edit Address' : 'Add Address'}</h3>
                                    <p className="mt-1 text-sm text-slate-600">Complete address details and save.</p>
                                </div>
                                <form onSubmit={onSubmitAddress} className="space-y-5 px-6 py-5">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className={modalLabelClass}>
                                                <MapPin size={14} />
                                                District
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.district}
                                                onChange={(e) => setAddressForm((prev) => ({ ...prev, district: e.target.value }))}
                                                placeholder="Enter district"
                                                className={modalInputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <MapPin size={14} />
                                                Village
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.villages}
                                                onChange={(e) => setAddressForm((prev) => ({ ...prev, villages: e.target.value }))}
                                                placeholder="Enter village"
                                                className={modalInputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <MapPin size={14} />
                                                Area
                                            </label>
                                            <input
                                                type="text"
                                                value={addressForm.area}
                                                onChange={(e) => setAddressForm((prev) => ({ ...prev, area: e.target.value }))}
                                                placeholder="Enter area"
                                                className={modalInputClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                        <button type="button" onClick={closeAddressModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{editingAddressId ? 'Update' : 'Create'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === 'schools') {
            const schoolQuery = schoolSearch.trim().toLowerCase();
            const filteredSchools = schoolQuery
                ? schools.filter((school) =>
                    [school.name, school.addres]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(schoolQuery)))
                : schools;

            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={schoolSearch}
                            onChange={(e) => setSchoolSearch(e.target.value)}
                            placeholder="Search by school name or address"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xl"
                        />
                        <button
                            type="button"
                            onClick={openCreateSchoolModal}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            + Add School
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Address</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {filteredSchools.map((school) => (
                                    <tr key={school.sch_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-3 py-3 font-medium text-black">{school.name}</td>
                                        <td className="px-3 py-3 text-gray-700">{school.addres || '-'}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditSchool(school)}
                                                    className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteSchool(school)}
                                                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && filteredSchools.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-8 text-center text-sm text-gray-500">
                                            {schoolQuery ? 'No matching schools found.' : 'No schools found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {schoolModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-4">
                            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-slate-50 to-cyan-50 px-6 py-5">
                                    <h3 className="text-lg font-semibold text-slate-900">{editingSchoolId ? 'Edit School' : 'Add School'}</h3>
                                    <p className="mt-1 text-sm text-slate-600">Complete school details and save.</p>
                                </div>
                                <form onSubmit={onSubmitSchool} className="space-y-5 px-6 py-5">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className={modalLabelClass}>
                                                <School size={14} />
                                                School Name
                                            </label>
                                            <input
                                                type="text"
                                                value={schoolForm.name}
                                                onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter school name"
                                                className={modalInputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <MapPin size={14} />
                                                Address
                                            </label>
                                            <input
                                                type="text"
                                                value={schoolForm.addres}
                                                onChange={(e) => setSchoolForm((prev) => ({ ...prev, addres: e.target.value }))}
                                                placeholder="Enter school address"
                                                className={modalInputClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                        <button type="button" onClick={closeSchoolModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{editingSchoolId ? 'Update' : 'Create'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === 'parents') {
            const parentQuery = parentSearch.trim().toLowerCase();
            const filteredParents = parentQuery
                ? parents.filter((parent) =>
                    [parent.name, parent.tell1, parent.tell2]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(parentQuery)))
                : parents;

            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            placeholder="Search by parent name or phone"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xl"
                        />
                        <button
                            type="button"
                            onClick={openCreateParentModal}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            + Add Parent
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone 1</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Phone 2</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {filteredParents.map((parent) => (
                                    <tr key={parent.parent_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-3 py-3 font-medium text-black">{parent.name}</td>
                                        <td className="px-3 py-3 text-gray-700">{parent.tell1 || '-'}</td>
                                        <td className="px-3 py-3 text-gray-700">{parent.tell2 || '-'}</td>
                                        <td className="px-3 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditParent(parent)}
                                                    className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteParent(parent)}
                                                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && filteredParents.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">
                                            {parentQuery ? 'No matching parents found.' : 'No parents found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {parentModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-4">
                            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-slate-50 to-cyan-50 px-6 py-5">
                                    <h3 className="text-lg font-semibold text-slate-900">{editingParentId ? 'Edit Parent' : 'Add Parent'}</h3>
                                    <p className="mt-1 text-sm text-slate-600">Complete parent details and save.</p>
                                </div>
                                <form onSubmit={onSubmitParent} className="space-y-5 px-6 py-5">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className={modalLabelClass}>
                                                <Users size={14} />
                                                Parent Name
                                            </label>
                                            <input
                                                type="text"
                                                value={parentForm.name}
                                                onChange={(e) => setParentForm((prev) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter parent name"
                                                className={modalInputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <Phone size={14} />
                                                Phone 1
                                            </label>
                                            <input
                                                type="text"
                                                value={parentForm.tell1}
                                                onChange={(e) => setParentForm((prev) => ({ ...prev, tell1: e.target.value }))}
                                                placeholder="Enter primary phone"
                                                className={modalInputClass}
                                            />
                                        </div>
                                        <div>
                                            <label className={modalLabelClass}>
                                                <Phone size={14} />
                                                Phone 2
                                            </label>
                                            <input
                                                type="text"
                                                value={parentForm.tell2}
                                                onChange={(e) => setParentForm((prev) => ({ ...prev, tell2: e.target.value }))}
                                                placeholder="Enter secondary phone"
                                                className={modalInputClass}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                        <button type="button" onClick={closeParentModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60">{editingParentId ? 'Update' : 'Create'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const activeStudents = students.filter((row) => (row.status || row.account_status || 'Active') === 'Active');
        const inactiveStudents = students.filter((row) => (row.status || row.account_status || 'Active') === 'Inactive');

        if (activeTab === 'students') {
            const query = studentSearch.trim().toLowerCase();
            const filteredStudents = query
                ? activeStudents.filter((student) =>
                    [
                        student.student_id,
                        student.name,
                        student.tell,
                        student.student_email,
                        student.parent_name,
                        student.school_name,
                        student.nira
                    ]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(query))
                )
                : activeStudents;

            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="Search by student ID, name, phone, email, parent, school, or NIRA"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-xl"
                        />
                        <button
                            type="button"
                            onClick={openCreateStudentModal}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            + Add Student
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student ID</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Tell</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Gender</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Address</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">DOB</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Parent</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Register Date</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mother</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">POB</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Graduation Year</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Grade</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Shift</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">School</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">NIRA</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={17} className="px-3 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {filteredStudents.map((student) => (
                                    <tr key={student.std_id} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-2 py-2 text-gray-800">{student.student_id}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.name}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.tell || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.gender || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.student_email || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.address_district || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.dob || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.parent_name || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.register_date || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.mother || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.pob || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.graduation_year || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.grade || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.shift_name || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.school_name || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.nira || '-'}</td>
                                        <td className="px-2 py-2">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => onEditStudent(student)} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                                                <button type="button" onClick={() => onDeleteStudent(student)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!tableLoading && filteredStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={17} className="px-3 py-8 text-center text-sm text-gray-500">
                                            No active students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {studentModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                            <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
                                <div className="flex items-start justify-between border-b border-slate-200 px-4 py-2.5">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{studentModalMode === 'edit' ? 'Edit Student' : 'Add New Student'}</h3>
                                        <p className="mt-0.5 text-xs text-slate-600">
                                            {studentModalMode === 'edit'
                                                ? 'Update student details using the form below.'
                                                : 'Student ID, username, and password are generated automatically.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeStudentModal}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                        aria-label="Close modal"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <form onSubmit={onSubmitStudentForm} className="flex min-h-0 flex-1 flex-col">
                                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                                        {studentModalMode === 'edit' && (
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <UserRound size={15} className="text-slate-500" />
                                                    <span>Student ID</span>
                                                </label>
                                                <input type="text" value={studentForm.student_id} className={`${modalInputClass} bg-gray-100`} readOnly />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <UserRound size={15} className="text-slate-500" />
                                                    <span>Name *</span>
                                                </label>
                                                <input type="text" value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Enter student name" className={modalInputClass} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <Phone size={15} className="text-slate-500" />
                                                    <span>Phone Number</span>
                                                </label>
                                                <input type="text" value={studentForm.tell} onChange={(e) => setStudentForm((prev) => ({ ...prev, tell: e.target.value }))} placeholder="Enter phone number" className={modalInputClass} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <UserRound size={15} className="text-slate-500" />
                                                    <span>Gender</span>
                                                </label>
                                                <select value={studentForm.gender} onChange={(e) => setStudentForm((prev) => ({ ...prev, gender: e.target.value }))} className={modalInputClass}>
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <Mail size={15} className="text-slate-500" />
                                                    <span>Email</span>
                                                </label>
                                                <input type="email" value={studentForm.student_email} onChange={(e) => setStudentForm((prev) => ({ ...prev, student_email: e.target.value }))} placeholder="Enter email address" className={modalInputClass} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <CalendarDays size={15} className="text-slate-500" />
                                                    <span>Date of Birth</span>
                                                </label>
                                                <input type="date" value={studentForm.dob} onChange={(e) => setStudentForm((prev) => ({ ...prev, dob: e.target.value }))} className={modalInputClass} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <CalendarDays size={15} className="text-slate-500" />
                                                    <span>Register Date</span>
                                                </label>
                                                <input type="date" value={studentForm.register_date} onChange={(e) => setStudentForm((prev) => ({ ...prev, register_date: e.target.value }))} className={modalInputClass} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <Users size={15} className="text-slate-500" />
                                                    <span>Parent</span>
                                                </label>
                                                <select value={studentForm.parent_no} onChange={(e) => setStudentForm((prev) => ({ ...prev, parent_no: e.target.value }))} className={modalInputClass}>
                                                    <option value="">Select Parent</option>
                                                    {parents.map((p) => <option key={p.parent_no} value={p.parent_no}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <School size={15} className="text-slate-500" />
                                                    <span>School</span>
                                                </label>
                                                <select value={studentForm.sch_no} onChange={(e) => setStudentForm((prev) => ({ ...prev, sch_no: e.target.value }))} className={modalInputClass}>
                                                    <option value="">Select School</option>
                                                    {schools.map((s) => <option key={s.sch_no} value={s.sch_no}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <MapPin size={15} className="text-slate-500" />
                                                    <span>Address</span>
                                                </label>
                                                <select value={studentForm.add_no} onChange={(e) => setStudentForm((prev) => ({ ...prev, add_no: e.target.value }))} className={modalInputClass}>
                                                    <option value="">Select Address</option>
                                                    {addresses.map((a) => <option key={a.add_no} value={a.add_no}>{a.district || `Address ${a.add_no}`}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <UserRound size={15} className="text-slate-500" />
                                                    <span>Mother Name</span>
                                                </label>
                                                <input type="text" value={studentForm.mother} onChange={(e) => setStudentForm((prev) => ({ ...prev, mother: e.target.value }))} className={modalInputClass} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <MapPin size={15} className="text-slate-500" />
                                                    <span>Place of Birth *</span>
                                                </label>
                                                <input type="text" value={studentForm.pob} onChange={(e) => setStudentForm((prev) => ({ ...prev, pob: e.target.value }))} className={modalInputClass} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <BookOpen size={15} className="text-slate-500" />
                                                    <span>Graduation Year *</span>
                                                </label>
                                                <select value={studentForm.graduation_year} onChange={(e) => setStudentForm((prev) => ({ ...prev, graduation_year: e.target.value }))} className={modalInputClass} required>
                                                    <option value="">Select Year</option>
                                                    {Array.from({ length: 80 }, (_, i) => {
                                                        const year = String(new Date().getFullYear() - i);
                                                        return (
                                                            <option key={year} value={year}>
                                                                {year}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <BookOpen size={15} className="text-slate-500" />
                                                    <span>Grade *</span>
                                                </label>
                                                <input type="text" value={studentForm.grade} onChange={(e) => setStudentForm((prev) => ({ ...prev, grade: e.target.value }))} className={modalInputClass} required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={modalLabelClass}>
                                                    <CalendarDays size={15} className="text-slate-500" />
                                                    <span>Shift *</span>
                                                </label>
                                                <select value={studentForm.shift_no} onChange={(e) => setStudentForm((prev) => ({ ...prev, shift_no: e.target.value }))} className={modalInputClass} required>
                                                    <option value="">Select Shift</option>
                                                    {shiftOptions.map((s) => <option key={s.shift_no} value={s.shift_no}>{s.shiftName}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className={modalLabelClass}>
                                                    <CreditCard size={15} className="text-slate-500" />
                                                    <span>NIRA</span>
                                                </label>
                                                <input type="text" value={studentForm.nira} onChange={(e) => setStudentForm((prev) => ({ ...prev, nira: e.target.value }))} className={modalInputClass} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-2.5">
                                        <button type="button" onClick={closeStudentModal} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                                            {studentModalMode === 'edit' ? 'Update Student' : 'Create Student'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === 'states') {
            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-sm font-semibold text-black">Student State Management</h3>
                            <p className="mt-0.5 text-sm text-gray-600">Activate or inactivate student accounts.</p>
                        </div>
                        <button
                            type="button"
                            onClick={openStudentStateModal}
                            disabled={students.length === 0}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Set State
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student ID</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={3} className="px-2 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {inactiveStudents.map((student) => (
                                    <tr key={student.std_id} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                        <td className="px-2 py-2 text-gray-800">{student.student_id || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.name || '-'}</td>
                                        <td className="px-2 py-2 text-gray-800">{student.status || student.account_status || '-'}</td>
                                    </tr>
                                ))}
                                {!tableLoading && inactiveStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-2 py-8 text-center text-sm text-gray-500">
                                            No inactive students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {studentStateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-4">
                            <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h3 className="text-base font-semibold text-black">Set Student State</h3>
                                    <p className="mt-1 text-sm text-gray-600">Select student and state to activate or inactivate.</p>
                                </div>
                                <form onSubmit={onSubmitStudentState} className="space-y-4 px-5 py-4">
                                    <div>
                                        <label className={modalLabelClass}>
                                            <UserRound size={15} className="text-slate-500" />
                                            <span>Student *</span>
                                        </label>
                                        <select
                                            value={studentStateForm.std_id}
                                            onChange={(e) => setStudentStateForm((prev) => ({ ...prev, std_id: e.target.value }))}
                                            className={modalInputClass}
                                            required
                                        >
                                            <option value="">Select Student</option>
                                            {students.map((student) => (
                                                <option key={student.std_id} value={student.std_id}>
                                                    {`${student.student_id || `Student ${student.std_id}`} - ${student.name || 'Unknown'}`}
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
                                            value={studentStateForm.status}
                                            onChange={(e) => setStudentStateForm((prev) => ({ ...prev, status: e.target.value }))}
                                            className={modalInputClass}
                                            required
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                                        <button type="button" onClick={closeStudentStateModal} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Set State</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (activeTab === 'student-class') {
            const query = studentClassSearch.trim().toLowerCase();
            const filteredStudentClasses = query
                ? studentClasses.filter((row) =>
                    [
                        row.student_id,
                        row.student_name,
                        row.cl_name,
                        row.semister_name,
                        row.active_year
                    ]
                        .filter(Boolean)
                        .some((value) => String(value).toLowerCase().includes(query))
                )
                : studentClasses;

            return (
                <div className="space-y-4">
                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={studentClassSearch}
                            onChange={(e) => setStudentClassSearch(e.target.value)}
                            placeholder="Search by student, class, semester, or academic year"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:max-w-lg"
                        />
                        <button
                            type="button"
                            onClick={openStudentClassModal}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                            + Add
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Semester</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-2 py-8 text-center text-sm text-gray-500">
                                            Loading.....
                                        </td>
                                    </tr>
                                )}
                                {filteredStudentClasses.map((row) => (
                                    editingStudentClassId === row.sc_no ? (
                                        <tr key={row.sc_no} className="border-b border-gray-100 bg-amber-50/40 text-sm">
                                            <td className="px-2 py-2">
                                                <select className={inputClass} value={studentClassForm.std_id} onChange={(e) => setStudentClassForm((prev) => ({ ...prev, std_id: e.target.value }))}>
                                                    <option value="">Select Student</option>
                                                    {students.map((s) => <option key={s.std_id} value={s.std_id}>{`${s.student_id} - ${s.name}`}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select className={inputClass} value={studentClassForm.cls_no} onChange={(e) => setStudentClassForm((prev) => ({ ...prev, cls_no: e.target.value }))}>
                                                    <option value="">Select Class</option>
                                                    {classOptions.map((c) => <option key={c.cls_no} value={c.cls_no}>{c.cl_name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select className={inputClass} value={studentClassForm.sem_no} onChange={(e) => setStudentClassForm((prev) => ({ ...prev, sem_no: e.target.value }))}>
                                                    <option value="">Select Semester</option>
                                                    {semesterOptions.map((s) => <option key={s.sem_no} value={s.sem_no}>{s.semister_name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select className={inputClass} value={studentClassForm.acy_no} onChange={(e) => setStudentClassForm((prev) => ({ ...prev, acy_no: e.target.value }))}>
                                                    <option value="">Select Academic Year</option>
                                                    {academicOptions.map((a) => <option key={a.acy_no} value={a.acy_no}>{a.active_year}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => saveEditedStudentClass(row.sc_no)} className="rounded-md border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-50">Update</button>
                                                    <button type="button" onClick={cancelStudentClassEdit} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={row.sc_no} className="border-b border-gray-100 text-sm hover:bg-blue-50/50">
                                            <td className="px-2 py-2 text-gray-800">{`${row.student_id} - ${row.student_name}`}</td>
                                            <td className="px-2 py-2 text-gray-800">{row.cl_name}</td>
                                            <td className="px-2 py-2 text-gray-800">{row.semister_name}</td>
                                            <td className="px-2 py-2 text-gray-800">{row.active_year}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => onEditStudentClass(row)} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                                                    <button type="button" onClick={() => onDeleteStudentClass(row)} className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ))}
                                {!tableLoading && filteredStudentClasses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-2 py-8 text-center text-sm text-gray-500">
                                            {query ? 'No matching student class mappings found.' : 'No student class mappings found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {studentClassModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 py-4">
                            <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                                <div className="border-b border-gray-100 px-5 py-4">
                                    <h3 className="text-base font-semibold text-black">Add Student Class Mappings</h3>
                                    <p className="mt-1 text-sm text-gray-600">Use + at the end of each row to add more mappings, then submit all at once.</p>
                                </div>
                                <form onSubmit={saveStudentClassDraftRows} className="flex min-h-0 flex-1 flex-col">
                                    <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b border-gray-200 bg-gray-50">
                                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Class</th>
                                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Semester</th>
                                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Academic Year</th>
                                                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {studentClassDrafts.map((row) => (
                                                        <tr key={row.draft_id} className="border-b border-gray-100 text-sm">
                                                            <td className="px-2 py-2">
                                                                <select className={inputClass} value={row.std_id} onChange={(e) => onChangeStudentClassDraft(row.draft_id, 'std_id', e.target.value)}>
                                                                    <option value="">Select Student</option>
                                                                    {students.map((s) => <option key={s.std_id} value={s.std_id}>{`${s.student_id} - ${s.name}`}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <select className={inputClass} value={row.cls_no} onChange={(e) => onChangeStudentClassDraft(row.draft_id, 'cls_no', e.target.value)}>
                                                                    <option value="">Select Class</option>
                                                                    {classOptions.map((c) => <option key={c.cls_no} value={c.cls_no}>{c.cl_name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <select className={inputClass} value={row.sem_no} onChange={(e) => onChangeStudentClassDraft(row.draft_id, 'sem_no', e.target.value)}>
                                                                    <option value="">Select Semester</option>
                                                                    {semesterOptions.map((s) => <option key={s.sem_no} value={s.sem_no}>{s.semister_name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <select className={inputClass} value={row.acy_no} onChange={(e) => onChangeStudentClassDraft(row.draft_id, 'acy_no', e.target.value)}>
                                                                    <option value="">Select Academic Year</option>
                                                                    {academicOptions.map((a) => <option key={a.acy_no} value={a.acy_no}>{a.active_year}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <div className="flex gap-2">
                                                                    <button type="button" onClick={addStudentClassDraftRow} className="rounded-md border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">+</button>
                                                                    <button type="button" onClick={() => removeStudentClassDraftRow(row.draft_id)} className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100">Remove</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
                                        <button type="button" onClick={closeStudentClassModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Add All</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    }, [
        academicOptions,
        activeTab,
        addressForm.area,
        addressForm.district,
        addressForm.villages,
        addressModalOpen,
        addressSearch,
        classOptions,
        editingAddressId,
        editingStudentClassId,
        editingStudentId,
        editingParentId,
        editingSchoolId,
        parentSearch,
        schoolSearch,
        parentModalOpen,
        schoolModalOpen,
        loading,
        tableLoading,
        parentForm.name,
        parentForm.tell1,
        parentForm.tell2,
        parents,
        addresses,
        shiftOptions,
        schools,
        semesterOptions,
        studentClassForm.acy_no,
        studentClassForm.cls_no,
        studentClassForm.sem_no,
        studentClassForm.std_id,
        studentClassSearch,
        studentClassDrafts,
        studentClassModalOpen,
        studentClasses,
        studentForm,
        studentModalMode,
        studentModalOpen,
        studentStateForm.status,
        studentStateForm.std_id,
        studentStateModalOpen,
        studentSearch,
        students,
        schoolForm.addres,
        schoolForm.name
    ]);

    return (
        <TabbedPageShell
            title="Student Management"
            description="Manage addresses, schools, parents, students, student class mappings, and student states from one place."
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={onTabChange}
        >
            <div className="mb-4 flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {activeTab === 'addresses' ? <MapPin size={18} /> : activeTab === 'parents' ? <Users size={18} /> : activeTab === 'students' || activeTab === 'states' ? <UserRound size={18} /> : activeTab === 'student-class' ? <Link2 size={18} /> : <School size={18} />}
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-black">
                        {activeTab === 'addresses' && 'Address Management'}
                        {activeTab === 'schools' && 'School Management'}
                        {activeTab === 'parents' && 'Parent Management'}
                        {activeTab === 'students' && 'Student Management'}
                        {activeTab === 'student-class' && 'Student Class Management'}
                        {activeTab === 'states' && 'Student States Management'}
                    </h2>
                    <p className="text-sm text-gray-600">Create, edit, delete, and view records directly from this tab.</p>
                </div>
            </div>

            {errorMessage && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
            )}

            {successMessage && (
                <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</div>
            )}

            {content}
        </TabbedPageShell>
    );
};

export default StudentManagement;
