import { fail, redirect } from '@sveltejs/kit';
import { api } from '$lib/api';

export const actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username') as string;
        const grade_level = (data.get('grade_level') as string) || undefined;
        const country = (data.get('country') as string) || undefined;

        const { data: result, error } = await api.POST('/auth/signup', {
            body: { username, grade_level, country }
        });

        if (error) return fail(409, { error: 'Username already taken' });

        cookies.set('student_id', result.student_id, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax'
        });
        redirect(302, '/student/exams');
    }
};
