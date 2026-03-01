import client from './client';

const campusEnvironmentService = {
    getComplaints: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const url = query
            ? `/faculty/campus-environment/complaints?${query}`
            : '/faculty/campus-environment/complaints';

        const response = await client.get(url);
        return response.data;
    },

    getTracking: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const url = query
            ? `/faculty/campus-environment/tracking?${query}`
            : '/faculty/campus-environment/tracking';

        const response = await client.get(url);
        return response.data;
    },

    getSupportStudents: async (cmpEnvComNo) => {
        const response = await client.get(`/faculty/campus-environment/support/${cmpEnvComNo}`);
        return response.data;
    },

    updateStatus: async (cmpEnvComNo, payload) => {
        const response = await client.put(`/faculty/campus-environment/${cmpEnvComNo}/status`, payload);
        return response.data;
    }
};

export default campusEnvironmentService;
