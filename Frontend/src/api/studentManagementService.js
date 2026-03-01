import client from './client';

const studentManagementService = {
    listAddresses: async () => {
        const res = await client.get('/student-management/addresses');
        return res.data;
    },

    createAddress: async (payload) => {
        const res = await client.post('/student-management/addresses', payload);
        return res.data;
    },

    updateAddress: async (addNo, payload) => {
        const res = await client.put(`/student-management/addresses/${addNo}`, payload);
        return res.data;
    },

    deleteAddress: async (addNo) => {
        const res = await client.delete(`/student-management/addresses/${addNo}`);
        return res.data;
    },

    listSchools: async () => {
        const res = await client.get('/student-management/schools');
        return res.data;
    },

    createSchool: async (payload) => {
        const res = await client.post('/student-management/schools', payload);
        return res.data;
    },

    updateSchool: async (schNo, payload) => {
        const res = await client.put(`/student-management/schools/${schNo}`, payload);
        return res.data;
    },

    deleteSchool: async (schNo) => {
        const res = await client.delete(`/student-management/schools/${schNo}`);
        return res.data;
    },

    listParents: async () => {
        const res = await client.get('/student-management/parents');
        return res.data;
    },

    createParent: async (payload) => {
        const res = await client.post('/student-management/parents', payload);
        return res.data;
    },

    updateParent: async (parentNo, payload) => {
        const res = await client.put(`/student-management/parents/${parentNo}`, payload);
        return res.data;
    },

    deleteParent: async (parentNo) => {
        const res = await client.delete(`/student-management/parents/${parentNo}`);
        return res.data;
    },

    listStudents: async () => {
        const res = await client.get('/student-management/students');
        return res.data;
    },

    createStudent: async (payload) => {
        const res = await client.post('/student-management/students', payload);
        return res.data;
    },

    updateStudent: async (stdId, payload) => {
        const res = await client.put(`/student-management/students/${stdId}`, payload);
        return res.data;
    },

    deleteStudent: async (stdId) => {
        const res = await client.delete(`/student-management/students/${stdId}`);
        return res.data;
    },

    listStudentClasses: async () => {
        const res = await client.get('/student-management/student-classes');
        return res.data;
    },

    createStudentClass: async (payload) => {
        const res = await client.post('/student-management/student-classes', payload);
        return res.data;
    },

    updateStudentClass: async (scNo, payload) => {
        const res = await client.put(`/student-management/student-classes/${scNo}`, payload);
        return res.data;
    },

    deleteStudentClass: async (scNo) => {
        const res = await client.delete(`/student-management/student-classes/${scNo}`);
        return res.data;
    },

    listClassOptions: async () => {
        const res = await client.get('/student-management/classes-options');
        return res.data;
    },

    listSemesterOptions: async () => {
        const res = await client.get('/student-management/semesters-options');
        return res.data;
    },

    listAcademicOptions: async () => {
        const res = await client.get('/student-management/academics-options');
        return res.data;
    },

    listAddressOptions: async () => {
        const res = await client.get('/student-management/addresses-options');
        return res.data;
    },

    listShiftOptions: async () => {
        const res = await client.get('/student-management/shifts-options');
        return res.data;
    }
};

export default studentManagementService;
