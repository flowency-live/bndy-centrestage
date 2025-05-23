// server.mjs - HTTPS server for bndy-centrestage local development
import { createServer } from 'https';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'local.bndy.test'; // Using single domain for all services
const app = next({ dev, hostname });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'local-bndy-test-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'local-bndy-test.pem'))
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, hostname, (err) => {  
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:3000`);
  });
});