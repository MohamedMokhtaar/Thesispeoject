import client from './client';

const settingsService = {
    listCredentials: async (type, q = '') => {
        const res = await client.get('/settings/credentials', { params: { type, q } });
        return res.data;
    }
};

export default settingsService;
