import createClient from 'openapi-fetch';
import { env } from '$env/dynamic/public';
import type { paths } from '../types/api';

export const API_BASE = env.PUBLIC_API_BASE ?? 'http://localhost:8067';

export const api = createClient<paths>({ baseUrl: API_BASE });

export function buildUrl<P extends keyof paths>(path: P, params?: Record<string, string>): string {
    const resolved = (path as string).replace(/\{(\w+)\}/g, (_, k) => params?.[k] ?? '');
    return API_BASE + resolved;
}
