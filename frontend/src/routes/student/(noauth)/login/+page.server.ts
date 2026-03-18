import { fail, redirect } from '@sveltejs/kit';
import { api } from '$lib/api';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username') as string;

        const { data: result, error } = await api.POST('/auth/login', {
            body: { username }
        });

        if (error) return fail(401, { error: 'Student not found' });

        cookies.set('student_id', result.student_id, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
        });
        redirect(302, '/student/exams');
    }
};
