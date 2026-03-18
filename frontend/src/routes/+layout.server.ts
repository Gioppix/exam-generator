import { api } from '$lib/api';

export async function load({ cookies }) {
    const student_id = cookies.get('student_id');
    if (!student_id) return { student_id: null };

    const { error } = await api.GET('/auth/me', { params: { query: { student_id } } });
    if (error) {
        cookies.delete('student_id', { path: '/' });
        return { student_id: null };
    }

    return { student_id };
}
