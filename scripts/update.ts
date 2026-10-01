import { execSync } from 'node:child_process';

const run = (command: string): string => execSync(command, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });

run('git pull --ff-only origin main');
run('npm run data');
if (!run('git status --porcelain -- src/data').trim()) {
  console.log('Registry is up to date');
  process.exit(0);
}
run('npm run typecheck');
run('npm test');
run('git add src/data');
run(`git commit -m "Update numbering registry ${new Date().toISOString().slice(0, 10)}"`);
run('git push origin HEAD:main');
console.log('Pushed new registry data, GitHub will release it');
