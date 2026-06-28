import axios from 'axios';

export const ADMIN_SERVICES_URL = 'http://localhost:5173/admin';

export async function getServices() {
	try {
		const res = await axios.get('/api/shops/services/manage/');
		return res.data;
	} catch {
		return [];
	}
}

export async function addService(data) {
	return axios.post('/api/shops/services/manage/', data);
}

export async function updateService(id, data) {
	return axios.put(`/api/shops/services/manage/${id}/`, data);
}

export async function deleteService(id) {
	return axios.delete(`/api/shops/services/manage/${id}/`);
}
