import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist = path.join(__dirname, 'dist');

if (fs.existsSync(dist)) {
  // 1. Copy index.html to 404.html for SPA catch-all fallback
  fs.copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'));

  // 2. Pre-generate physical directories for known client routes so direct URLs never 404
  const routes = ['login', 'signup', 'dashboard', 'profile'];
  routes.forEach(route => {
    const routeDir = path.join(dist, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(path.join(dist, 'index.html'), path.join(routeDir, 'index.html'));
  });

  console.log('✅ Generated 404.html and static route entry points for SPA routing');
}
