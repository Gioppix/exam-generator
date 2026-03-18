import { pool } from '../db.js';
import { AuthResponseSchema } from './types.js';

/**
 * Creates a new student with the given username.
 * Returns the student_id on success, or null if the username is already taken.
 * Throws on unexpected database errors.
 */
export async function signup(username: string): Promise<string | null> {
    const result = await pool.query(
        'INSERT INTO students (username) VALUES ($1) ON CONFLICT DO NOTHING RETURNING student_id',
        [username]
    );
    if (!result.rows[0]) return null;
    return AuthResponseSchema.parse(result.rows[0]).student_id;
}

export async function login(username: string): Promise<string | null> {
    const result = await pool.query('SELECT student_id FROM students WHERE username = $1', [
        username
    ]);
    if (!result.rows[0]) return null;
    return AuthResponseSchema.parse(result.rows[0]).student_id;
}
