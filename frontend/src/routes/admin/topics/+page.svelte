<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { api } from '$lib/api';
    import { Button } from '$lib/components/ui/button/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import type { paths } from '../../../types/api';

    type Topic =
        paths['/admin/topics']['get']['responses'][200]['content']['application/json'][number];
    type TopicNode = Topic & { children: TopicNode[] };

    let { data } = $props();

    let context = $state('');
    let generating = $state(false);

    function buildTree(flat: Topic[]): TopicNode[] {
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const map = new Map<string, TopicNode>();
        for (const t of flat) map.set(t.topic_id, { ...t, children: [] });
        const roots: TopicNode[] = [];
        for (const node of map.values()) {
            if (node.parent_topic_id) {
                map.get(node.parent_topic_id)?.children.push(node);
            } else {
                roots.push(node);
            }
        }
        return roots;
    }

    async function generate() {
        if (!context.trim()) return;
        generating = true;
        try {
            await api.POST('/admin/topics/generate', { body: { context } });
            await invalidateAll();
        } catch (e) {
            console.error(e);
        } finally {
            generating = false;
        }
    }

    let tree = $derived(buildTree(data.topics));
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-xl font-semibold">Topics</h1>
        <p class="text-sm text-muted-foreground">Manage the topic hierarchy for exam generation.</p>
    </div>

    <div class="flex gap-2">
        <Input
            bind:value={context}
            placeholder="e.g. high school mathematics"
            class="max-w-sm"
            onkeydown={(e) => e.key === 'Enter' && generate()}
        />
        <Button onclick={generate} disabled={generating || !context.trim()}>
            {generating ? 'Generating…' : 'Generate more'}
        </Button>
    </div>

    {#if data.topics.length === 0}
        <p class="text-sm text-muted-foreground">No topics yet. Generate some above.</p>
    {:else}
        <ul class="space-y-1 text-sm">
            {#each tree as node (node.topic_id)}
                {@render topicNode(node, 0)}
            {/each}
        </ul>
    {/if}
</div>

{#snippet topicNode(node: TopicNode, depth: number)}
    <li>
        <span
            class="inline-block rounded px-2 py-0.5 hover:bg-accent"
            style="margin-left: {depth * 1.25}rem"
        >
            {node.label}
        </span>
        {#if node.children.length > 0}
            <ul class="space-y-1">
                {#each node.children as child (child.topic_id)}
                    {@render topicNode(child, depth + 1)}
                {/each}
            </ul>
        {/if}
    </li>
{/snippet}
