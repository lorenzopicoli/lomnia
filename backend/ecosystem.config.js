module.exports = {
  apps: [
    {
      name: "server",
      script: "npm",
      args: "run server",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/server-error.log",
      out_file: "./logs/server-out.log",
      log_file: "./logs/server-combined.log",
      time: true,
    },
    {
      name: "ingesterQueue",
      script: "npm",
      args: "run ingester",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/importer-error.log",
      out_file: "./logs/importer-out.log",
      log_file: "./logs/importer-combined.log",
      time: true,
    },
  ],
};
