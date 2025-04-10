import { execSync } from 'child_process';

console.log('⚙️ Building NestJS...');
execSync('npx nest build', { stdio: 'inherit' });

console.log('📦 Copying templates...');
execSync('npx cpx "src/templates/**/*" dist/templates', { stdio: 'inherit' });

console.log('✅ Build complete.');
