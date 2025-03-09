// ~/ecosystem.config.cjs

module.exports = {
    apps: [
      {
        name: 'my_workday_tracker',
        port: '3000',
        exec_mode: 'cluster',
        instances: 'max',
        script: './.output/server/index.mjs',
        error_file: './logs/error.log',
        out_file: './logs/output.log',
        merge_logs: true,
        autorestart: true
      }
    ]
  }
  