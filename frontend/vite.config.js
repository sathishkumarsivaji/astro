import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      watch: {
        ignored: ['**/*.rar', '**/*.rartemp', '**/*rartemp*', '**/*.zip', '**/*.7z', '**/*.tar*', '**/*.gz', '**/dist/**', '**/.git/**']
      }
    },
    plugins: [
      react(),
      {
        name: 'api-astrology-report-middleware',
        configureServer(server) {
          server.middlewares.use('/api/astrology-report', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const { prompt, systemInstruction, model = 'gemini-2.5-flash', customApiKey } = parsed;
                const apiKey = (
                  customApiKey ||
                  env.GEMINI_API_KEY ||
                  env.VITE_GEMINI_API_KEY ||
                  process.env.GEMINI_API_KEY ||
                  process.env.VITE_GEMINI_API_KEY ||
                  ''
                ).trim();

                if (!apiKey) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    error: 'GEMINI_API_KEY is not configured on the server. Please configure it or supply an API key.'
                  }));
                }

                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
                const requestPayload = {
                  contents: [{ role: 'user', parts: [{ text: prompt }] }],
                  ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
                  generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 8192
                  }
                };

                let geminiRes = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(requestPayload)
                });

                // Fallback for models not supporting systemInstruction
                if (!geminiRes.ok && geminiRes.status === 400 && systemInstruction) {
                  geminiRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
                      generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 8192 }
                    })
                  });
                }

                const data = await geminiRes.json();
                res.statusCode = geminiRes.status;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(data));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: err.message || 'Internal server error proxying Gemini request' }));
              }
            });
          });
        }
      }
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('astroEngine.js')) {
              return 'astro-engine';
            }
          }
        }
      }
    }
  };
})
