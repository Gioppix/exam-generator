import { api } from '$lib/api';

export async function load({ parent, depends }) {
    depends('app:exams');
    const { student_id } = await parent();
    const { data: exams, error } = await api.GET('/exams', {
        params: { query: { student_id } }
    });
    if (error) throw error;
    return { exams };
}
