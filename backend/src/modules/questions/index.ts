import { z } from 'zod';
import { pool } from '../db.js';
import { QuestionSchema, type Question } from './types.js';

export async function listQuestions(): Promise<Question[]> {
    const result = await pool.query(`
        SELECT
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
        ORDER BY q.title
    `);
    return z.array(QuestionSchema).parse(result.rows);
}
