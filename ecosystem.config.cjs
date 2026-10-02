// PM2: `pm2 start ecosystem.config.cjs` after `npm ci && npm run build`.
// Exactly one process: the JSON store and the rate limits live in this process's memory,
// so cluster mode or several instances would lose writes.
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
      kill_timeout: 5000,
      // Behind nginx (one proxy, see README). Use "0" only if nothing sits in front of the app.
      env: { NODE_ENV: "production", TRUST_PROXY_HOPS: "1" },
    },
  ],
};
