import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { migrate } from './migrate.js';
import routes from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();

app.use(cors({
  origin: IS_PROD ? false : true,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${req.method} ${req.path}`);
  }
  next();
});

app.use('/api', routes);

if (IS_PROD) {
  const dist = join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
}

async function start() {
  try {
    await migrate();
    app.listen(PORT, () => {
      console.log(`[server] ✓ Port ${PORT} | ${IS_PROD ? 'production' : 'development'}`);
    });
  } catch (err) {
    console.error('[server] ✗ Startup failed:', err.message);
    process.exit(1);
  }
}

start();
