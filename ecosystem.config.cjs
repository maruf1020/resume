// PM2: `pm2 start ecosystem.config.cjs` after `npm ci && npm run build`.
// One process: data lives in Postgres, but the visitor rate limits, the persona cache and background
// jobs (publish & train, PDF) live in this process's memory.
module.exports = {
  apps: [
    {
      name: "portfolio",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      // Give background jobs (publish & train) time to finish on restart; one cut short is marked failed.
      kill_timeout: 30000,
      // Behind nginx (one proxy, see README). Use "0" only if nothing sits in front of the app.
      // PORT matches the -p above: the PDF step prints pages from this server over 127.0.0.1.
      env: { NODE_ENV: "production", TRUST_PROXY_HOPS: "1", PORT: "3000" },
    },
  ],
};
