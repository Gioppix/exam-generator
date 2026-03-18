import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { pool } from '../db.js';
import { TopicSchema, type Topic, type CreateTopicBody } from './types.js';

export async function listTopics(): Promise<Topic[]> {
    const result = await pool.query(
        'SELECT topic_id, parent_topic_id, label FROM topics ORDER BY label'
    );
    return z.array(TopicSchema).parse(result.rows);
}

export async function createTopic(data: CreateTopicBody): Promise<Topic> {
    const result = await pool.query(
        'INSERT INTO topics (label, parent_topic_id) VALUES ($1, $2) RETURNING topic_id, parent_topic_id, label',
        [data.label, data.parent_topic_id ?? null]
    );
    return TopicSchema.parse(result.rows[0]);
}

export async function deleteTopic(id: string): Promise<void> {
    await pool.query('DELETE FROM topics WHERE topic_id = $1', [id]);
}

// Recursive AI output schema (zod lazy for self-reference)
type SubtopicNode = { topic: string; subtopics: SubtopicNode[] };
const SubtopicNodeSchema: z.ZodType<SubtopicNode> = z.object({
    topic: z.string(),
    subtopics: z.lazy(() => z.array(SubtopicNodeSchema))
});

const GeneratedTreeSchema = z.array(
    z.object({
        parent_topic: z
            .string()
            .nullable()
            .describe(
                'Label of an existing topic to attach under, or null to create a new root tree'
            ),
        subtopics: z.array(SubtopicNodeSchema)
    })
);

async function insertSubtopics(
    nodes: SubtopicNode[],
    parent_topic_id: string | null
): Promise<void> {
    for (const node of nodes) {
        const created = await createTopic({ label: node.topic, parent_topic_id });
        if (node.subtopics.length > 0) {
            await insertSubtopics(node.subtopics, created.topic_id);
        }
    }
}

export function buildTopicTreeText(allTopics: Topic[]): string {
    const childrenMap = new Map<string | null, Topic[]>();
    for (const t of allTopics) {
        const key = t.parent_topic_id ?? null;
        if (!childrenMap.has(key)) childrenMap.set(key, []);
        childrenMap.get(key)!.push(t);
    }

    function renderNode(topic: Topic, depth: number): string {
        const indent = '  '.repeat(depth);
        const children = childrenMap.get(topic.topic_id) ?? [];
        const childLines = children.map((c) => renderNode(c, depth + 1)).join('\n');
        return `${indent}- ${topic.label}${childLines ? '\n' + childLines : ''}`;
    }

    return (childrenMap.get(null) ?? []).map((r) => renderNode(r, 0)).join('\n');
}

export async function generateTopics(context: string): Promise<void> {
    const existing = await listTopics();
    const existingLabels = existing.map((t) => t.label).join(', ');

    const { object } = await generateObject({
        model: openai('gpt-5.4'),
        schema: z.object({ trees: GeneratedTreeSchema }),
        prompt: `Generate a topic tree for an exam system about: "${context}".
${existingLabels ? `Existing topics (you may attach subtopics under them via parent_topic, or set parent_topic to null for a new root tree): ${existingLabels}` : ''}
Return a well-structured hierarchy. Each tree has an optional parent_topic (existing label or null) and nested subtopics.`
    });

    for (const tree of object.trees) {
        const parent = tree.parent_topic
            ? (existing.find((t) => t.label === tree.parent_topic)?.topic_id ?? null)
            : null;
        await insertSubtopics(tree.subtopics, parent);
    }
}
