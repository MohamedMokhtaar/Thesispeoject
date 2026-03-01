import client from './client';

const teacherManagementService = {
    listTeachers: async () => {
        const res = await client.get('/teacher-management/teachers');
        return res.data;
    },

    listAddressOptions: async () => {
        const res = await client.get('/student-management/addresses-options');
        return res.data;
    },

    createTeacher: async (payload) => {
        const res = await client.post('/teacher-management/teachers', payload);
        return res.data;
    },

    updateTeacher: async (teacherNo, payload) => {
        const res = await client.put(`/teacher-management/teachers/${teacherNo}`, payload);
        return res.data;
    },

    deleteTeacher: async (teacherNo) => {
        const res = await client.delete(`/teacher-management/teachers/${teacherNo}`);
        return res.data;
    }
};

export default teacherManagementService;
