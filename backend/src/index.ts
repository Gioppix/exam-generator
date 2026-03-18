import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { fileURLToPath } from 'url';
import exampleRouter from './routers/example.js';
import topicsRouter from './routers/topics.js';
import datasetRouter from './routers/dataset.js';
import authRouter from './routers/auth.js';
import examsRouter from './routers/exams.js';

const app = new OpenAPIHono();

app.use(cors());

const ARTIFICIAL_DELAY_MS = Number(process.env.ARTIFICIAL_DELAY_MS) || 0;
if (ARTIFICIAL_DELAY_MS > 0) {
    app.use(async (_, next) => {
        await new Promise((r) => setTimeout(r, ARTIFICIAL_DELAY_MS));
        await next();
    });
}

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/', exampleRouter);
app.route('/', topicsRouter);
app.route('/', datasetRouter);
app.route('/', authRouter);
app.route('/', examsRouter);

app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'Exam Generator', version: '1.0.0' }
});

// Only start the HTTP server when this file is run directly (not imported by gen:api)
const thisFile = fileURLToPath(import.meta.url);
const isMain =
    process.argv[1] === thisFile || process.argv[1]?.replace(/\.js$/, '.ts') === thisFile;

if (isMain) {
    const port = Number(process.env.PORT) || 8067;
    serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;
