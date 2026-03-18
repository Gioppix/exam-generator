import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Returns Tailwind color classes for a grade percentage (0–100). */
export function gradeColors(pct: number): {
    text: string;
    border: string;
    bg: string;
} {
    if (pct >= 80) {
        return {
            text: 'text-green-700 dark:text-green-400',
            border: 'border-green-200 dark:border-green-800',
            bg: 'bg-green-50 dark:bg-green-950'
        };
    }
    if (pct >= 60) {
        return {
            text: 'text-yellow-700 dark:text-yellow-400',
            border: 'border-yellow-200 dark:border-yellow-800',
            bg: 'bg-yellow-50 dark:bg-yellow-950'
        };
    }
    return {
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        bg: 'bg-red-50 dark:bg-red-950'
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
