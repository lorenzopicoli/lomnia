module.exports = {
  apps: [
    {
      name: "server",
      script: "./build/src/server.js",
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
      name: "importer",
      script: "./build/src/importer.js",
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
