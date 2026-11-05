import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', port: 5173, strictPort: true,
      proxy: {
        '/backend': {
          target: env.BACKEND_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/backend(?=\/|$)/, ''),
          configure(proxy) {
            proxy.on('error', (_error, _request, response) => {
              if ('writeHead' in response && !response.headersSent && !response.writableEnded) {
                response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
                response.end(JSON.stringify({
                  message: 'Backend indisponível. Inicie o Spring Boot e confira a porta configurada em BACKEND_URL.',
                }))
              }
            })
          },
        },
      },
    },
  }
})
