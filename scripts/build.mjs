// Ensure Lightning CSS uses WASM fallback on environments where native binary isn't available (e.g., Vercel builders)
process.env.LIGHTNINGCSS_FORCE_WASM = process.env.LIGHTNINGCSS_FORCE_WASM || '1';

import { spawnSync } from 'node:child_process';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

// 1) Prebuild env checks
run('node', ['scripts/prebuild-check.mjs']);

// 2) Migrations (fail in CI, skip locally if DB down per script logic)
run('node', ['scripts/run-migrate-or-skip.mjs']);

// 3) Next build (use npx for cross-platform resolution on Windows/Linux)
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
run(npx, ['next', 'build']);
