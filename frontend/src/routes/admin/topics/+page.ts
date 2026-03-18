import { api } from '$lib/api';

export async function load() {
    const { data, error } = await api.GET('/admin/topics');
    if (error) throw error;
    return { topics: data };
}
