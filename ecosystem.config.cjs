module.exports = {
  apps: [
    {
      name: "sakhtosaz",
      cwd: "/root/sakhtosaz/sakhtosaz",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      interpreter: "/usr/bin/node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
      },
    },
  ],
};
