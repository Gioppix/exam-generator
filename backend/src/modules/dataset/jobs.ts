import { pool } from '../db.js';
import { listTopics, buildTopicTreeText } from '../topics/index.js';
import { generateOutlines, generateAndInsertQuestion } from './index.js';
import type { Outline } from './index.js';
import type { Topic } from '../topics/types.js';
import { type Job } from './types.js';

// ─── In-memory job store ──────────────────────────────────────────────────────

const jobs = new Map<string, Job>();

export function createJob(prompt: string): Job {
    const job: Job = {
        job_id: crypto.randomUUID(),
        status: 'running',
        prompt,
        created_at: new Date().toISOString(),
        total: 0,
        completed: 0
    };
    jobs.set(job.job_id, job);
    return job;
}

export function updateJob(job_id: string, updates: Partial<Job>): void {
    const job = jobs.get(job_id);
    if (job) jobs.set(job_id, { ...job, ...updates });
}

export function listJobs(): Job[] {
    return Array.from(jobs.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

// ─── Job runner ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

async function generateAndInsertWithRetry(outline: Outline, allTopics: Topic[]): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await generateAndInsertQuestion(outline, allTopics);
            return;
        } catch (err) {
            console.error(
                `Question "${outline.title}" attempt ${attempt}/${MAX_RETRIES} failed:`,
                err
            );
        }
    }
    console.error(`Giving up on question "${outline.title}" after ${MAX_RETRIES} attempts.`);
}

async function runGenerationJob(
    job_id: string,
    prompt: string,
    existingTitles: string[]
): Promise<void> {
    try {
        const allTopics = await listTopics();
        const outlines = await generateOutlines(
            prompt,
            existingTitles,
            buildTopicTreeText(allTopics)
        );

        updateJob(job_id, { total: outlines.length });

        let completed = 0;
        for (const outline of outlines) {
            await generateAndInsertWithRetry(outline, allTopics);
            updateJob(job_id, { completed: ++completed });
        }

        updateJob(job_id, { status: 'done' });
    } catch (err) {
        updateJob(job_id, { status: 'error', error: String(err) });
    }
}

export async function generateDataset(prompt: string): Promise<string> {
    const existing = await pool.query<{ title: string }>(
        'SELECT title FROM questions WHERE active = true'
    );
    const existingTitles = existing.rows.map((r) => r.title);

    const job = createJob(prompt);
    runGenerationJob(job.job_id, prompt, existingTitles);
    return job.job_id;
}
