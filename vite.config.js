// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

    // FIX: Redirects Vite's dev server root / path to read index.vite.html
    {
      name: 'dev-server-spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // If the browser requests the root URL, rewrite it to target your Vite file
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/index.vite.html';
          }
          next();
        });
      }
    },

    // Keeps your production build output named correctly as index.html inside dist/
    {
      name: 'rename-vite-html-output',
      closeBundle: async () => {
        const buildDir = resolve(__dirname, 'dist');
        const oldPath = path.join(buildDir, 'index.vite.html');
        const newPath = path.join(buildDir, 'index.html');

        if (fs.existsSync(oldPath)) {
          await fs.promises.rename(oldPath, newPath);
          console.log('Successfully renamed build output to standard index.html');
        }
      }
    },

    // Direct console logger interceptor: Captures the proper LAN IP and draws a perfect terminal QR Code
    {
      name: 'wsl-terminal-qr-override',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          setTimeout(() => {
            const devPort = server.config.server.port || 3000;
            const resolvedTargetIp = windowsHostIp || '192.168.0.31'; 
            
            // Map the mobile connection URL path explicitly to your targeted multi-project route file
            const targetMobileUrl = `http://${resolvedTargetIp}:${devPort}/index.vite.html`;
            
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
        main: resolve(__dirname, 'index.vite.html')
      }
    }
  }
});

