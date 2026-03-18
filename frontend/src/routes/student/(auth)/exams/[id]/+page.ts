import { writable, type Writable } from 'svelte/store';
import { api } from '$lib/api';
import type { paths } from '$types/api';

export const ssr = false;

export type Answer =
    paths['/exams/{id}/submit-answer/{questionId}']['post']['requestBody']['content']['application/json']['answer'];

function debounce<T>(fn: (val: T) => void, ms: number): (val: T) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (val: T) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(val), ms);
    };
}

export async function load({ params, depends }) {
    depends('app:exam');
    const { data: exam, error } = await api.GET('/exams/{id}', {
        params: { path: { id: params.id } }
    });
    if (error) throw error;

    const answers: Record<string, Writable<Answer | null>> = {};

    for (const q of exam.questions) {
        const w = writable<Answer | null>(q.student_answer ?? null);

        const examId = exam.exam_id;
        const questionId = q.question_id;

        const save = debounce((answer: Answer | null) => {
            // null → absent key → backend sets NULL in DB
            api.POST('/exams/{id}/submit-answer/{questionId}', {
                params: { path: { id: examId, questionId } },
                body: { answer: answer ?? undefined }
            });
        }, 400);

        // subscribe() fires immediately — skip the initial call
        let initial = true;
        w.subscribe((answer) => {
            if (initial) {
                initial = false;
                return;
            }
            save(answer);
        });

        answers[q.question_id] = w;
    }

    return { exam, answers };
}
