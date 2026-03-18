import { pool } from '../db.js';
import { AuthResponseSchema, StudentSchema } from './types.js';
import type { Student } from './types.js';

/**
 * Creates a new student with the given username, grade_level, and country.
 * Returns the student_id on success, or null if the username is already taken.
 * Throws on unexpected database errors.
 */
export async function signup(
    username: string,
    grade_level?: string,
    country?: string
): Promise<string | null> {
    const result = await pool.query(
        'INSERT INTO students (username, grade_level, country) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING student_id',
        [username, grade_level ?? null, country ?? null]
    );
    if (!result.rows[0]) return null;
    return AuthResponseSchema.parse(result.rows[0]).student_id;
}

export async function getMe(student_id: string): Promise<Student | null> {
    const result = await pool.query(
        'SELECT student_id, username, grade_level, country FROM students WHERE student_id = $1',
        [student_id]
    );
    if (!result.rows[0]) return null;
    return StudentSchema.parse(result.rows[0]);
}

export async function login(username: string): Promise<string | null> {
    const result = await pool.query('SELECT student_id FROM students WHERE username = $1', [
        username
    ]);
    if (!result.rows[0]) return null;
    return AuthResponseSchema.parse(result.rows[0]).student_id;
}
