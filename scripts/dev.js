#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';

const usePython = process.env.BACKEND_TYPE !== 'node' && fs.existsSync('.venv/bin/uvicorn');

let server;
if (usePython) {
  console.log('🐍 Starting Python FastAPI Backend on http://localhost:5001...');
  server = spawn('.venv/bin/uvicorn', ['backend.app.main:app', '--reload', '--port', '5001'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '5001' },
  });
} else {
  console.log('🟢 Starting Node.js Express Backend on http://localhost:3001...');
  server = spawn('npx', ['tsx', 'watch', 'server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.PORT || '3001' },
  });
}

const client = spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    API_TARGET: usePython ? 'http://localhost:5001' : 'http://localhost:3001',
  },
});

function cleanup() {
  server.kill('SIGTERM');
  client.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
server.on('exit', (code) => {
  if (code && code !== 0) console.error(`API server exited with code ${code}`);
});
client.on('exit', (code) => {
  if (code && code !== 0) console.error(`Vite client exited with code ${code}`);
});
