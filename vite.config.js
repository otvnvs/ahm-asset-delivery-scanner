// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';

/**
 * Parses raw Windows ipconfig streams line-by-line inside WSL.
 * Targets the true physical host network adapter by filtering out virtual subnets.
 */
function getWslHostIp() {
  try {
    const isWsl = fs.existsSync('/proc/version') && 
                  fs.readFileSync('/proc/version', 'utf8').toLowerCase().includes('microsoft');
    
    if (isWsl) {
      const stdout = execSync('cmd.exe /c ipconfig').toString();
      const lines = stdout.split(/\r?\n/);
      let activeIp = null;

      for (const line of lines) {
        if (line.includes('IPv4 Address')) {
          const match = line.match(/:\s*([0-9\.]+)/);
          if (match && match[1]) {
            const foundIp = match[1].trim();
            // Skip the internal virtual WSL container hypervisor switch subnet
            if (foundIp.startsWith('172.') || foundIp.startsWith('127.')) {
              continue;
            }
            activeIp = foundIp;
          }
        }
      }
      return activeIp;
    }
  } catch (err) {
    console.warn('[WSL Network Hook] Could not map Windows host network profiles:', err.message);
  }
  return null;
}

const windowsHostIp = getWslHostIp();

export default defineConfig({
  base: './',
  plugins: [
    vue(),

    // Direct console logger interceptor: Captures the proper LAN IP and draws a perfect terminal QR Code
    {
      name: 'wsl-terminal-qr-override',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setTimeout(() => {
            const devPort = server.config.server.port || 3000;
            const resolvedTargetIp = windowsHostIp || '192.168.0.31'; 
            
            // Map the mobile connection URL path explicitly to your targeted multi-project route file
            const targetMobileUrl = `http://${resolvedTargetIp}:${devPort}/`;
            
            console.log('\n┌────────────────────────────────────────────────────────────┐');
            console.log(`│ 📱 WSL MOBILE DEV LINK ENABLED                             │`);
            console.log(`│ Target Host IP: ${resolvedTargetIp}                        │`);
            console.log(`│ URL Endpoint:   ${targetMobileUrl}        │`);
            console.log('└────────────────────────────────────────────────────────────┘\n');
            
            try {
              // Invokes the native Linux utility with half-block lines for pixel-perfect scanning
              execSync(`qrencode -t utf8 "${targetMobileUrl}"`, { stdio: 'inherit' });
              console.log('\n');
            } catch (qrError) {
              console.warn('[WSL QR Generator] Native qrencode utility execution failed.');
              console.log(`Fallback Link URL: ${targetMobileUrl}\n`);
            }
            
          }, 200); // Triggers right after Vite writes out its standard help lines
        });
      }
    },

    // Dev-only broker proxy: mimics the Android /api/net/request Java interceptor
    // so the same BrokerTransport code works in the browser during development.
    // On Android this plugin is inactive; the native Java layer handles the broker.
    {
      name: 'dev-broker-proxy',
      configureServer(server) {
        server.middlewares.use('/api/net/request', async (req, res, next) => {
          if (req.method !== 'POST') return next();

          try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const envelope = JSON.parse(Buffer.concat(chunks).toString());
            const inner = envelope.request || {};

            console.log(`[DEV BROKER] ${inner.method || 'GET'} ${inner.url}`);

            // Use https.request with rejectUnauthorized:false to handle SAP self-signed certs.
            const { status, statusText, headers, body } = await new Promise(async(resolve, reject) => {
              const targetUrl = new URL(inner.url);
              const reqOptions = {
                hostname: targetUrl.hostname,
                port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
                path: targetUrl.pathname + targetUrl.search,
                method: inner.method || 'GET',
                headers: inner.headers || {},
                rejectUnauthorized: false,
              };
              const timeoutMs = envelope.timeout_ms || 15000;
              const protocol = targetUrl.protocol === 'https:' ? https : (await import('http')).default;
              const outReq = protocol.request(reqOptions, (inRes) => {
                const chunks = [];
                inRes.on('data', (c) => chunks.push(c));
                inRes.on('end', () => {
                  const hdrs = {};
                  for (let i = 0; i < inRes.rawHeaders.length; i += 2) {
                    const key = inRes.rawHeaders[i].toLowerCase();
                    if (key === 'set-cookie') {
                      if (!hdrs[key]) hdrs[key] = [];
                      hdrs[key].push(inRes.rawHeaders[i + 1]);
                    } else {
                      hdrs[key] = inRes.rawHeaders[i + 1];
                    }
                  }
                  resolve({
                    status: inRes.statusCode,
                    statusText: inRes.statusMessage || '',
                    headers: hdrs,
                    body: Buffer.concat(chunks).toString(),
                  });
                });
                inRes.on('error', reject);
              });
              outReq.setTimeout(timeoutMs, () => { outReq.destroy(new Error('Request timed out')); });
              outReq.on('error', reject);
              if (inner.body) outReq.write(inner.body);
              outReq.end();
            });

            console.log(`[DEV BROKER] ${status} | set-cookie: ${headers['set-cookie'] ? JSON.stringify(headers['set-cookie']) : 'none'}`);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status, statusText, headers, body }));
          } catch (err) {
            console.error('[DEV BROKER] Forward failed:', err.message);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 502,
              statusText: 'Bad Gateway',
              headers: {},
              body: JSON.stringify({ error: err.message })
            }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    cors: true,
    host: '0.0.0.0', // Listens on all internal WSL networking interfaces cleanly
    //open: '/index.vite.html' // Automatically opens the browser to your targeted dev route
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});

