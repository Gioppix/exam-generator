<script lang="ts">
    import type { paths } from '../../types/api';

    type Question =
        paths['/admin/dataset']['get']['responses'][200]['content']['application/json'][number];
    type Topic =
        paths['/admin/topics']['get']['responses'][200]['content']['application/json'][number];
    type QuestionContent = Question['question'];
    type AnswerContent = Question['answer'];

    let { question, topics = [] }: { question: Question; topics?: Topic[] } = $props();

    const topicLabels = $derived(
        question.topic_ids
            .map((id) => topics.find((t) => t.topic_id === id)?.label)
            .filter((l): l is string => l !== undefined)
    );

    const q = $derived(question.question as QuestionContent);
    const a = $derived(question.answer as AnswerContent);
</script>

<div class="space-y-3 rounded-lg border bg-card p-4">
    <div class="flex items-start justify-between gap-2">
        <h3 class="leading-snug font-medium">{question.title}</h3>
        <span
            class="shrink-0 rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground"
        >
            {q.type}
        </span>
    </div>

    {#if topicLabels.length > 0}
        <div class="flex flex-wrap gap-1">
            {#each topicLabels as label}
                <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {label}
                </span>
            {/each}
        </div>
    {/if}

    <!-- Question body -->
    <div class="text-sm text-foreground">
        {#if q.type === 'multiple_choice'}
            <p class="mb-2">{q.prompt}</p>
            <ul class="space-y-1">
                {#each q.answers as option, i}
                    {@const selected =
                        (a as typeof a & { type: 'multiple_choice' }).type === 'multiple_choice' &&
                        (
                            a as { type: 'multiple_choice'; selected_index: number[] }
                        ).selected_index.includes(i)}
                    <li
                        class="flex items-center gap-2 rounded px-2 py-1"
                        class:bg-green-50={selected}
                        class:text-green-800={selected}
                        class:dark:bg-green-950={selected}
                        class:dark:text-green-300={selected}
                    >
                        <span class="shrink-0 font-mono text-xs text-muted-foreground"
                            >{String.fromCharCode(65 + i)}.</span
                        >
                        {option}
                        {#if selected}
                            <span class="ml-auto text-xs">✓</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {:else if q.type === 'open_ended'}
            <p class="mb-2">{q.prompt}</p>
            <div class="rounded border border-dashed px-3 py-2 text-muted-foreground italic">
                {(a as { type: 'open_ended'; answer: string }).answer}
            </div>
        {:else if q.type === 'boolean'}
            <p class="mb-2">{q.prompt}</p>
            <span
                class="inline-block rounded px-2 py-0.5 text-sm font-semibold"
                class:bg-green-100={(a as { type: 'boolean'; answer: boolean }).answer}
                class:text-green-800={(a as { type: 'boolean'; answer: boolean }).answer}
                class:bg-red-100={!(a as { type: 'boolean'; answer: boolean }).answer}
                class:text-red-800={!(a as { type: 'boolean'; answer: boolean }).answer}
            >
                {(a as { type: 'boolean'; answer: boolean }).answer ? 'True' : 'False'}
            </span>
        {:else if q.type === 'matching'}
            {@const matchAnswer = a as {
                type: 'matching';
                pairs: { left_index: number; right_index: number }[];
                explanation?: string;
            }}
            <p class="mb-2">{q.prompt}</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="font-medium text-muted-foreground">Left</div>
                <div class="font-medium text-muted-foreground">Right</div>
                {#each matchAnswer.pairs as { left_index, right_index }}
                    <div class="rounded bg-muted px-2 py-1">{q.left[left_index]}</div>
                    <div class="rounded bg-muted px-2 py-1">{q.right[right_index]}</div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Explanation (if present) -->
    {#if 'explanation' in a && a.explanation}
        <p class="border-t pt-2 text-xs text-muted-foreground">{a.explanation}</p>
    {/if}
</div>
