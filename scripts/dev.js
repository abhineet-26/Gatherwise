#!/usr/bin/env node
import { spawn } from 'child_process';

// Starts both API server and Vite client concurrently for zero-config dev
const server = spawn('npx', ['tsx', 'watch', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3001' },
});

const client = spawn('npx', ['vite'], {
  stdio: 'inherit',
  env: process.env,
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
