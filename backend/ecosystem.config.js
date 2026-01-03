module.exports = {
  apps: [
    {
      name: "server",
      script: "npm run server",
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
      script: "npm run ingester",
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
    {
      name: "enricher",
      script: "./build/src/enricher.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/enricher-error.log",
      out_file: "./logs/enricher-out.log",
      log_file: "./logs/enricher-combined.log",
      time: true,
    },
  ],
};
