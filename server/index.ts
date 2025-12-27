import { spawn } from 'child_process';
import path from 'path';

// Launch Next.js dev server
const next = spawn('npx', ['next', 'dev', '-p', '5000', '-H', '0.0.0.0'], { 
  stdio: 'inherit', 
  shell: true,
  cwd: process.cwd(),
  env: { ...process.env }
});

next.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code ?? 0);
});

next.on('error', (err) => {
  console.error('Failed to start Next.js process:', err);
  process.exit(1);
});
