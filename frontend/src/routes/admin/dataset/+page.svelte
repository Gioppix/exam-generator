<script lang="ts">
    import { onMount } from 'svelte';
    import { invalidate } from '$app/navigation';
    import { api } from '$lib/api';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import QuestionCard from '$lib/components/QuestionCard.svelte';

    let { data } = $props();

    let prompt = $state('');
    let generating = $state(false);
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const activeJobs = $derived(data.jobs.filter((j) => j.status === 'running'));

    function startPolling() {
        if (pollInterval) return;
        pollInterval = setInterval(() => invalidate('app:dataset'), 2000);
    }

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    $effect(() => {
        if (activeJobs.length === 0) stopPolling();
    });

    onMount(() => {
        if (activeJobs.length > 0) startPolling();
    });

    async function generate() {
        if (!prompt.trim()) return;
        generating = true;
        try {
            await api.POST('/admin/dataset/generate', { body: { prompt } });
            prompt = '';
            startPolling();
        } catch (e) {
            console.error(e);
        } finally {
            generating = false;
        }
    }
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-xl font-semibold">Dataset</h1>
        <p class="text-sm text-muted-foreground">Generate and manage exam questions.</p>
    </div>

    <div class="flex gap-2">
        <Input
            bind:value={prompt}
            placeholder="e.g. high school algebra — quadratic equations"
            class="max-w-sm"
            onkeydown={(e) => e.key === 'Enter' && generate()}
        />
        <Button onclick={generate} disabled={generating || !prompt.trim()}>
            {generating ? 'Submitting…' : 'Generate'}
        </Button>
    </div>

    {#if activeJobs.length > 0}
        <div class="space-y-2">
            <p class="text-sm font-medium">Running jobs</p>
            {#each activeJobs as job (job.job_id)}
                <div class="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    <span class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-500"></span>
                    <span class="flex-1 truncate text-muted-foreground">{job.prompt}</span>
                    <span class="font-mono text-xs text-muted-foreground">
                        {job.completed}/{job.total}
                    </span>
                </div>
            {/each}
        </div>
    {/if}

    {#if data.questions.length === 0}
        <p class="text-sm text-muted-foreground">No questions yet. Generate some above.</p>
    {:else}
        <div class="space-y-2">
            <p class="text-sm font-medium">
                {data.questions.length} question{data.questions.length === 1 ? '' : 's'}
            </p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {#each data.questions as question (question.question_id)}
                    <QuestionCard {question} topics={data.topics} />
                {/each}
            </div>
        </div>
    {/if}
</div>
