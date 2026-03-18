import { randomUUID } from 'crypto';
import { ExampleSchema, type Example } from './types.js';

export function getHello(): Example {
    return ExampleSchema.parse({ id: randomUUID(), message: 'Hello, world!' });
}
