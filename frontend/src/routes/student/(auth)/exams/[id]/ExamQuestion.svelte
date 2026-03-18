<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { api } from '$lib/api';
    import { ThumbsDown } from '@lucide/svelte';
    import type { Writable } from 'svelte/store';
    import type { paths } from '../../../../../types/api';
    import type { Answer } from './+page.js';

    type ApiQuestion =
        paths['/exams/{id}']['get']['responses'][200]['content']['application/json']['questions'][number];

    let {
        q,
        index,
        examId,
        answerWritable,
        active,
        isDone
    }: {
        q: ApiQuestion;
        index: number;
        examId: string;
        answerWritable: Writable<Answer | null>;
        active: boolean;
        isDone: boolean;
    } = $props();

    let reporting = $state(false);

    async function reportQuestion() {
        reporting = true;
        try {
            const { error } = await api.POST('/exams/{id}/report/{questionId}', {
                params: { path: { id: examId, questionId: q.question_id } }
            });
            if (!error) await invalidate('app:exam');
        } finally {
            reporting = false;
        }
    }

    const qc = $derived(q.question);

    function toggleMultipleChoice(idx: number) {
        answerWritable.update((a) => {
            const current = a?.type === 'multiple_choice' ? a.selected_index : [];
            return {
                type: 'multiple_choice',
                selected_index: current.includes(idx)
                    ? current.filter((i) => i !== idx)
                    : [...current, idx]
            };
        });
    }

    function setBoolean(val: boolean) {
        answerWritable.set({ type: 'boolean', answer: val });
    }

    function setOpenEnded(val: string) {
        answerWritable.set({ type: 'open_ended', answer: val });
    }

    function setMatchingPair(leftIndex: number, rightIndex: number) {
        if (q.question.type !== 'matching') return;
        const leftCount = q.question.left.length;
        answerWritable.update((a) => {
            const current =
                a?.type === 'matching'
                    ? a.pairs
                    : Array.from({ length: leftCount }, (_: unknown, i: number) => ({
                          left_index: i,
                          right_index: i
                      }));
            return {
                type: 'matching',
                pairs: current.map((p: { left_index: number; right_index: number }) =>
                    p.left_index === leftIndex
                        ? { left_index: leftIndex, right_index: rightIndex }
                        : p
                )
            };
        });
    }
</script>

<div class="group space-y-3 rounded-lg border bg-card p-4">
    <div class="flex items-start justify-between gap-2">
        <p class="text-sm leading-snug font-medium">
            <span class="mr-2 text-muted-foreground">{index + 1}.</span>{qc.prompt}
        </p>
        <div class="flex shrink-0 items-center gap-2">
            <button
                onclick={reportQuestion}
                disabled={reporting || !!q.reported_at}
                class="rounded p-1 transition-colors
                    {q.reported_at
                    ? 'cursor-not-allowed text-destructive opacity-50'
                    : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive'}"
                title={q.reported_at ? 'Already reported' : 'Report question'}
            >
                <ThumbsDown class="h-3.5 w-3.5" />
            </button>
        </div>
    </div>

    <!-- Multiple choice -->
    {#if qc.type === 'multiple_choice'}
        <ul class="space-y-1">
            {#each qc.answers as option, idx (idx)}
                {@const selected =
                    $answerWritable?.type === 'multiple_choice' &&
                    $answerWritable.selected_index.includes(idx)}
                {@const isCorrect =
                    isDone &&
                    q.correct_answer?.type === 'multiple_choice' &&
                    q.correct_answer.selected_index.includes(idx)}
                <li>
                    {#if active}
                        <button
                            class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors
                                {selected
                                ? 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'hover:bg-muted'}"
                            onclick={() => toggleMultipleChoice(idx)}
                        >
                            <span
                                class="flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs
                                {selected
                                    ? 'border-blue-500 bg-blue-500 text-white'
                                    : 'border-muted-foreground'}"
                                >{#if selected}✓{/if}</span
                            >
                            <span class="mr-1 font-mono text-xs text-muted-foreground"
                                >{String.fromCharCode(65 + idx)}.</span
                            >
                            {option}
                        </button>
                    {:else}
                        <div
                            class="flex items-center gap-2 rounded px-2 py-1.5 text-sm
                                {isCorrect
                                ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
                                : selected
                                  ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  : ''}"
                        >
                            <span class="font-mono text-xs text-muted-foreground"
                                >{String.fromCharCode(65 + idx)}.</span
                            >
                            {option}
                            {#if isCorrect}<span class="ml-auto text-xs">✓</span>{/if}
                            {#if selected && !isCorrect}<span class="ml-auto text-xs">✗</span>{/if}
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>

        <!-- Boolean -->
    {:else if qc.type === 'boolean'}
        {@const currentBool =
            $answerWritable?.type === 'boolean' ? $answerWritable.answer : undefined}
        {@const correctBool =
            isDone && q.correct_answer?.type === 'boolean' ? q.correct_answer.answer : null}
        <div class="flex gap-2">
            {#each [true, false] as val (val)}
                {@const selected = currentBool === val}
                {@const isCorrectChoice = correctBool === val}
                {#if active}
                    <button
                        class="rounded border px-3 py-1.5 text-sm font-medium transition-colors
                            {selected
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-border hover:bg-muted'}"
                        onclick={() => setBoolean(val)}
                    >
                        {val ? 'True' : 'False'}
                    </button>
                {:else}
                    <span
                        class="rounded border px-3 py-1.5 text-sm font-medium
                            {isCorrectChoice
                            ? 'border-green-300 bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : selected
                              ? 'border-red-300 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'border-border text-muted-foreground'}"
                    >
                        {val ? 'True' : 'False'}
                    </span>
                {/if}
            {/each}
        </div>

        <!-- Open ended -->
    {:else if qc.type === 'open_ended'}
        {#if active}
            <textarea
                class="w-full resize-none rounded border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                rows="3"
                placeholder="Your answer…"
                value={$answerWritable?.type === 'open_ended' ? $answerWritable.answer : ''}
                oninput={(e) => setOpenEnded((e.target as HTMLTextAreaElement).value)}
            ></textarea>
        {:else}
            <div class="rounded border px-3 py-2 text-sm">
                {#if $answerWritable?.type === 'open_ended' && $answerWritable.answer}
                    {$answerWritable.answer}
                {:else}
                    <span class="text-muted-foreground italic">No answer</span>
                {/if}
            </div>
            {#if isDone && q.correct_answer?.type === 'open_ended'}
                <div
                    class="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-950"
                >
                    <span class="text-xs font-medium text-green-700 dark:text-green-400"
                        >Expected:
                    </span>{q.correct_answer.answer}
                </div>
            {/if}
        {/if}

        <!-- Matching -->
    {:else if qc.type === 'matching'}
        <div class="space-y-2">
            {#each qc.left as leftItem, li (li)}
                {@const currentRight =
                    $answerWritable?.type === 'matching'
                        ? ($answerWritable.pairs.find(
                              (p: { left_index: number; right_index: number }) =>
                                  p.left_index === li
                          )?.right_index ?? li)
                        : li}
                {@const correctRight =
                    isDone && q.correct_answer?.type === 'matching'
                        ? q.correct_answer.pairs.find((p) => p.left_index === li)?.right_index
                        : undefined}
                {@const isCorrectMatch =
                    correctRight !== undefined && currentRight === correctRight}
                <div class="flex items-center gap-3 text-sm">
                    <span class="flex-1 rounded bg-muted px-2 py-1">{leftItem}</span>
                    <span class="text-muted-foreground">→</span>
                    {#if active}
                        <select
                            class="flex-1 rounded border bg-background px-2 py-1 text-sm"
                            value={currentRight}
                            onchange={(e) =>
                                setMatchingPair(li, Number((e.target as HTMLSelectElement).value))}
                        >
                            {#each qc.right as rightItem, ri (ri)}
                                <option value={ri}>{rightItem}</option>
                            {/each}
                        </select>
                    {:else}
                        <span
                            class="flex-1 rounded px-2 py-1
                                {isDone && correctRight !== undefined
                                ? isCorrectMatch
                                    ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-muted'}"
                        >
                            {qc.right[currentRight] ?? '—'}
                        </span>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <!-- Explanation -->
    {#if isDone && q.correct_answer && 'explanation' in q.correct_answer && q.correct_answer.explanation}
        <p class="border-t pt-2 text-xs text-muted-foreground italic">
            {q.correct_answer.explanation}
        </p>
    {/if}

    <!-- Per-question grade -->
    {#if isDone && q.grade != null}
        <div class="flex items-center justify-between border-t pt-2">
            <span class="text-xs text-muted-foreground">{q.grading_comment ?? ''}</span>
            <span class="text-xs font-semibold">{Math.round(q.grade * 100)}%</span>
        </div>
    {/if}
</div>
