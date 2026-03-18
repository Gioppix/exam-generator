<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { api } from '$lib/api';
    import { ThumbsDown, GripVertical } from '@lucide/svelte';
    import type { Writable } from 'svelte/store';
    import type { paths } from '../../../../../types/api';
    import type { Answer } from './+page.js';
    import { gradeColors } from '$lib/utils';
    import { scale } from 'svelte/transition';

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
    let dragSourceLeft = $state<number | null>(null);
    let dragOverLeft = $state<number | null>(null);

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

    function handleMatchingDrop(targetLeftIndex: number) {
        const srcIdx = dragSourceLeft;
        dragSourceLeft = null;
        dragOverLeft = null;
        if (srcIdx === null || srcIdx === targetLeftIndex) return;
        if (q.question.type !== 'matching') return;
        const leftCount = q.question.left.length;
        answerWritable.update((a) => {
            const pairs =
                a?.type === 'matching'
                    ? [...a.pairs]
                    : Array.from({ length: leftCount }, (_: unknown, i: number) => ({
                          left_index: i,
                          right_index: i
                      }));
            const srcRight = pairs.find((p) => p.left_index === srcIdx)?.right_index ?? srcIdx;
            const tgtRight =
                pairs.find((p) => p.left_index === targetLeftIndex)?.right_index ?? targetLeftIndex;
            return {
                type: 'matching',
                pairs: pairs.map((p) => {
                    if (p.left_index === srcIdx) return { ...p, right_index: tgtRight };
                    if (p.left_index === targetLeftIndex) return { ...p, right_index: srcRight };
                    return p;
                })
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
            {@const openGrade =
                isDone && q.grade != null ? gradeColors(Math.round(q.grade * 100)) : null}
            {@const hasAnswer = $answerWritable?.type === 'open_ended' && $answerWritable.answer}
            <div
                class="rounded border px-3 py-2 text-sm {openGrade
                    ? `${openGrade.border} ${openGrade.bg}`
                    : ''}"
            >
                {#if hasAnswer}
                    {$answerWritable.answer}
                {:else}
                    {@const red = gradeColors(0)}
                    <span class="italic {isDone ? red.text : 'text-muted-foreground'}"
                        >No answer</span
                    >
                {/if}
            </div>
            {#if isDone && q.correct_answer?.type === 'open_ended'}
                <div class="rounded border px-3 py-2 text-sm">
                    <span class="text-xs font-medium text-muted-foreground">Expected: </span>{q
                        .correct_answer.answer}
                </div>
            {/if}
        {/if}

        <!-- Matching -->
    {:else if qc.type === 'matching'}
        <div class="space-y-1.5">
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
                {@const isSource = dragSourceLeft === li}
                {@const isTarget =
                    dragOverLeft === li && dragSourceLeft !== null && dragSourceLeft !== li}
                <div
                    class="flex items-center gap-2 text-sm"
                    role="listitem"
                    ondragover={(e) => {
                        e.preventDefault();
                        if (dragSourceLeft !== null) dragOverLeft = li;
                    }}
                    ondrop={() => handleMatchingDrop(li)}
                    ondragleave={(e) => {
                        if (
                            !(e.currentTarget as HTMLElement).contains(
                                e.relatedTarget as Node | null
                            )
                        ) {
                            if (dragOverLeft === li) dragOverLeft = null;
                        }
                    }}
                >
                    <span class="w-[45%] shrink-0 rounded bg-muted px-2 py-1.5 text-sm leading-snug"
                        >{leftItem}</span
                    >
                    <span class="shrink-0 text-xs text-muted-foreground">→</span>
                    {#if active}
                        <div
                            draggable="true"
                            ondragstart={(e) => {
                                dragSourceLeft = li;
                                if (e.dataTransfer) {
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', String(li));
                                }
                            }}
                            ondragend={() => {
                                dragSourceLeft = null;
                                dragOverLeft = null;
                            }}
                            class="flex w-[45%] cursor-grab items-center gap-1.5 rounded border px-2 py-1.5 text-sm leading-snug transition-all duration-150 select-none
                                {isSource
                                ? 'border-dashed opacity-30'
                                : isTarget
                                  ? 'scale-[1.03] border-blue-400 bg-blue-50 ring-2 ring-blue-300 dark:bg-blue-950'
                                  : 'bg-background hover:border-border hover:bg-muted'}"
                            role="button"
                            tabindex="0"
                        >
                            <GripVertical class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {#key currentRight}
                                <span in:scale={{ duration: 180, start: 0.85 }}>
                                    {qc.right[currentRight]}
                                </span>
                            {/key}
                        </div>
                    {:else}
                        <span
                            class="w-[45%] rounded px-2 py-1.5 text-sm leading-snug
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
        {#if active}
            <p class="text-xs text-muted-foreground">Drag the right-side answers to swap matches</p>
        {/if}
    {/if}

    <!-- Explanation -->
    {#if isDone && q.correct_answer && 'explanation' in q.correct_answer && q.correct_answer.explanation}
        <p class="border-t pt-2 text-xs text-muted-foreground italic">
            {q.correct_answer.explanation}
        </p>
    {/if}

    <!-- Per-question grade -->
    {#if isDone && q.grade != null}
        {@const qColors = gradeColors(Math.round(q.grade * 100))}
        <div class="flex items-center justify-between border-t pt-2">
            <span class="text-xs text-muted-foreground">{q.grading_comment ?? ''}</span>
            <span class="text-xs font-semibold {qColors.text}">{Math.round(q.grade * 100)}%</span>
        </div>
    {/if}
</div>
