<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { api } from '$lib/api';
    import { Button } from '$lib/components/ui/button/index.js';
    import ExamQuestion from './ExamQuestion.svelte';

    let { data } = $props();

    const exam = $derived(data.exam);
    const isActive = $derived(exam.status === 'started');
    const isDone = $derived(exam.status === 'submitted' || exam.status === 'graded');

    const statusLabel: Record<string, string> = {
        created: 'Ready',
        started: 'In Progress',
        submitted: 'Submitted',
        graded: 'Graded'
    };

    const statusClass: Record<string, string> = {
        created: 'bg-muted text-muted-foreground',
        started: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
        graded: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
    };

    let starting = $state(false);
    let submitting = $state(false);

    async function startExam() {
        starting = true;
        try {
            await api.POST('/exams/{id}/start', { params: { path: { id: exam.exam_id } } });
            await invalidate('app:exam');
        } finally {
            starting = false;
        }
    }

    async function submitExam() {
        submitting = true;
        try {
            await api.POST('/exams/{id}/grade', { params: { path: { id: exam.exam_id } } });
            await invalidate('app:exam');
        } finally {
            submitting = false;
        }
    }
</script>

<div class="max-w-2xl space-y-6">
    <div class="flex items-start justify-between gap-4">
        <div>
            <h1 class="text-xl font-semibold">Exam</h1>
            <p class="mt-1 font-mono text-xs text-muted-foreground">{exam.exam_id}</p>
        </div>
        <span
            class="shrink-0 rounded-full px-3 py-1 text-xs font-medium {statusClass[exam.status]}"
        >
            {statusLabel[exam.status]}
        </span>
    </div>

    {#if exam.status === 'created'}
        <div class="space-y-4 rounded-lg border p-6">
            <p class="text-sm text-muted-foreground">
                This exam has <strong>{exam.questions.length}</strong> question{exam.questions
                    .length === 1
                    ? ''
                    : 's'}. Once started, answer each question and submit when done.
            </p>
            <Button onclick={startExam} disabled={starting}>
                {starting ? 'Starting…' : 'Start Exam'}
            </Button>
        </div>
    {/if}

    {#if exam.status === 'graded' && exam.grade != null}
        <div
            class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950"
        >
            <p class="font-semibold text-green-800 dark:text-green-300">
                Final grade: {Math.round(exam.grade * 100)}%
            </p>
        </div>
    {/if}

    {#if exam.questions.length > 0 && exam.status !== 'created'}
        <div class="space-y-4">
            {#each exam.questions as q, i (q.question_id)}
                <ExamQuestion
                    {q}
                    index={i}
                    answerWritable={data.answers[q.question_id]}
                    active={isActive}
                    {isDone}
                />
            {/each}
        </div>

        {#if isActive}
            <div class="pt-2">
                <Button onclick={submitExam} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Exam'}
                </Button>
            </div>
        {/if}
    {:else if exam.status !== 'created'}
        <p class="text-sm text-muted-foreground">This exam has no questions.</p>
    {/if}
</div>
