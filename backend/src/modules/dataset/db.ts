import { pool } from '../db.js';
import type { Topic } from '../topics/types.js';
import type { QuestionContent, AnswerContent } from '../questions/types.js';

/**
 * Given selected topic IDs, removes any topic that is an ancestor of another
 * selected topic — keeps only the most specific (deepest) selections.
 */
function filterToMostSpecific(selectedIds: string[], allTopics: Topic[]): string[] {
    const parentMap = new Map(allTopics.map((t) => [t.topic_id, t.parent_topic_id]));

    const ancestorsOfSelected = new Set<string>();
    for (const id of selectedIds) {
        let cur = parentMap.get(id) ?? null;
        while (cur) {
            ancestorsOfSelected.add(cur);
            cur = parentMap.get(cur) ?? null;
        }
    }

    return selectedIds.filter((id) => !ancestorsOfSelected.has(id));
}

export async function insertQuestion(
    title: string,
    question: QuestionContent,
    answer: AnswerContent,
    topicNames: string[],
    allTopics: Topic[]
): Promise<void> {
    const labelSet = new Map(allTopics.map((t) => [t.label, t.topic_id]));

    const unknown = topicNames.filter((name) => !labelSet.has(name));
    if (unknown.length > 0) {
        throw new Error(`Unknown topic names: ${unknown.join(', ')}`);
    }

    const selectedIds = topicNames.map((name) => labelSet.get(name) as string);

    const filteredIds = filterToMostSpecific(selectedIds, allTopics);

    const { rows } = await pool.query<{ question_id: string }>(
        'INSERT INTO questions (title, question, answer) VALUES ($1, $2, $3) RETURNING question_id',
        [title, JSON.stringify(question), JSON.stringify(answer)]
    );
    const { question_id } = rows[0];

    for (const topic_id of filteredIds) {
        await pool.query('INSERT INTO question_topics (question_id, topic_id) VALUES ($1, $2)', [
            question_id,
            topic_id
        ]);
    }
}
