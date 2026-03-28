import { serve } from '@hono/node-server';
import app from './app.js';

const PORT = 3081;

console.log(`
╔══════════════════════════════════════════╗
║   ALMO Mission Control — Backend API     ║
║   Port: ${PORT}                             ║
║   Health: http://localhost:${PORT}/api/health ║
╚══════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port: PORT,
});
