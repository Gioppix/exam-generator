<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { api } from '$lib/api';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';

    let { data } = $props();

    let prompt = $state('');
    let creating = $state(false);

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

    async function createExam() {
        if (!prompt.trim()) return;
        creating = true;
        try {
            const { data: result, error } = await api.POST('/exams/create', {
                body: { prompt, student_id: data.student_id }
            });
            if (error) {
                console.error(error);
                return;
            }
            prompt = '';
            await invalidate('app:exams');
            window.location.href = resolve(`/student/exams/${result.exam_id}`);
        } finally {
            creating = false;
        }
    }
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-xl font-semibold">Exams</h1>
        <p class="text-sm text-muted-foreground">Create and take exams.</p>
    </div>

    <div class="flex gap-2">
        <Input
            bind:value={prompt}
            placeholder="e.g. quadratic equations, algebra basics"
            class="max-w-sm"
            onkeydown={(e) => e.key === 'Enter' && createExam()}
        />
        <Button onclick={createExam} disabled={creating || !prompt.trim()}>
            {creating ? 'Generating…' : 'New Exam'}
        </Button>
    </div>

    {#if data.exams.length === 0}
        <p class="text-sm text-muted-foreground">No exams yet. Create one above.</p>
    {:else}
        <div class="space-y-2">
            {#each data.exams as exam (exam.exam_id)}
                <a
                    href={resolve(`/student/exams/${exam.exam_id}`)}
                    class="flex items-center gap-4 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                    <div class="min-w-0 flex-1">
                        <p class="truncate font-mono text-xs text-muted-foreground">
                            {exam.exam_id.slice(0, 8)}…
                        </p>
                        <p class="mt-0.5 text-xs text-muted-foreground">
                            {new Date(exam.created_at).toLocaleString()}
                        </p>
                    </div>
                    <span class="text-xs text-muted-foreground">
                        {exam.question_count} question{exam.question_count === 1 ? '' : 's'}
                    </span>
                    {#if exam.grade != null}
                        <span class="text-sm font-semibold">
                            {Math.round(exam.grade * 100)}%
                        </span>
                    {/if}
                    <span
                        class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {statusClass[
                            exam.status
                        ]}"
                    >
                        {statusLabel[exam.status]}
                    </span>
                </a>
            {/each}
        </div>
    {/if}
</div>
