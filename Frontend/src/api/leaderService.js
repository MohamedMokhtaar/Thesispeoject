import client from './client';

const leaderService = {
  getFaculties: async () => {
    const res = await client.get('/academic-structure/faculties');
    return res.data;
  },

  getDepartments: async (facultyNo) => {
    const url = facultyNo ? `/academic-structure/departments?faculty_no=${facultyNo}` : '/academic-structure/departments';
    const res = await client.get(url);
    return res.data;
  },

  getClassesByDepartment: async (deptNo) => {
    const res = await client.get(`/academic-structure/classes?dept_no=${deptNo}`);
    return res.data;
  },

  getClassStudents: async (clsNo) => {
    const res = await client.get(`/faculty/classes/${clsNo}/students`);
    return res.data;
  },

  assignLeader: async (clsNo, stdId) => {
    const res = await client.put(`/faculty/classes/${clsNo}/leader`, { std_id: stdId });
    return res.data;
  },

  getLeaders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/faculty/leaders?${query}` : '/faculty/leaders';
    const res = await client.get(url);
    return res.data;
  }
};

export default leaderService;
