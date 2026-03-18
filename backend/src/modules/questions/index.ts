import { z } from 'zod';
import { pool } from '../db.js';
import { QuestionSchema, type Question } from './types.js';

export async function listQuestions(filters?: { topic_ids?: string[] }): Promise<Question[]> {
    const topicFilter =
        filters?.topic_ids && filters.topic_ids.length > 0
            ? `AND EXISTS (
                SELECT 1 FROM question_topics qt
                WHERE qt.question_id = q.question_id
                AND qt.topic_id = ANY($1)
            )`
            : '';
    const params = filters?.topic_ids?.length ? [filters.topic_ids] : [];
    const result = await pool.query(
        `SELECT
            q.question_id,
            q.active,
            q.title,
            q.question,
            q.answer,
            COALESCE(
                (SELECT array_agg(qt.topic_id) FROM question_topics qt WHERE qt.question_id = q.question_id),
                '{}'
            ) AS topic_ids
        FROM questions q
        WHERE TRUE ${topicFilter}
        ORDER BY q.title`,
        params
    );
    return z.array(QuestionSchema).parse(result.rows);
}
