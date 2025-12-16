import { createServer } from 'http'

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Squadbooks Test Server</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          h1 { color: #333; }
          .status { color: #22c55e; }
        </style>
      </head>
      <body>
        <h1>Squadbooks Test Server</h1>
        <p class="status">✓ Server is running</p>
        <p>Request URL: ${req.url}</p>
        <p>Method: ${req.method}</p>
        <p>Port: 3000</p>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/api/test">Test API endpoint</a></li>
          <li><a href="/dashboard">Dashboard (Next.js route)</a></li>
        </ul>
        <p><em>This is a simple test server. Start the full Next.js app for full functionality.</em></p>
      </body>
    </html>
  `)
})

const PORT = 3001

server.listen(PORT, () => {
  console.log(`🚀 Test server running at http://localhost:${PORT}`)
  console.log(`Press Ctrl+C to stop`)
})
