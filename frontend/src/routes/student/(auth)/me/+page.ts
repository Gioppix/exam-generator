import { api } from '$lib/api';

export async function load({ parent }) {
    const { student_id } = await parent();
    const { data: me, error } = await api.GET('/auth/me', { params: { query: { student_id } } });
    if (error) throw error;
    return { me };
}
