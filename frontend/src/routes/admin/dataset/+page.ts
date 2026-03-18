import { api } from '$lib/api';

export async function load({ depends }) {
    depends('app:dataset');
    const [
        { data: questions, error },
        { data: topics, error: topicsError },
        { data: jobs, error: jobsError }
    ] = await Promise.all([
        api.GET('/admin/dataset'),
        api.GET('/admin/topics'),
        api.GET('/admin/dataset/jobs')
    ]);
    if (error) throw error;
    if (topicsError) throw topicsError;
    if (jobsError) throw jobsError;
    return { questions, topics, jobs };
}
