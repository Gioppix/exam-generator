import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
    const { student_id } = await parent();
    if (!student_id) redirect(302, '/student/login');
    return { student_id };
}
