import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getStats = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.contract && filters.contract !== 'All') params.append('contract', filters.contract);
        if (filters.internet_service && filters.internet_service !== 'All') params.append('internet_service', filters.internet_service);
        if (filters.senior_citizen !== undefined && filters.senior_citizen !== -1) params.append('senior_citizen', filters.senior_citizen);

        const response = await api.get(`/stats?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
    }
};

export const predictChurn = async (customerData) => {
    try {
        // Use the new endpoint that saves to DB
        const response = await api.post('/predict_and_save', customerData);
        return response.data;
    } catch (error) {
        console.error("Error predicting churn:", error);
        throw error;
    }
};

export const getFeatureImportance = async () => {
    try {
        const response = await api.get('/feature-importance');
        return response.data;
    } catch (error) {
        console.error("Error fetching feature importance:", error);
        throw error;
    }
};

export const getHistory = async () => {
    try {
        const response = await axios.get(`${API_URL}/history`);
        return response.data;
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

export const exportHistory = () => {
    // Trigger file download directly
    window.location.href = `${API_URL}/export`;
};

export default api;
