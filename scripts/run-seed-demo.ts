import { loadEnvConfig } from '@next/env';

// Load .env.local/.env before importing the seeder, which reads its secrets at runtime.
loadEnvConfig(process.cwd());
import('./seed-demo').catch(error => {
  console.error(error);
  process.exitCode = 1;
});
