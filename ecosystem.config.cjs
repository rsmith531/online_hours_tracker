module.exports = {
    apps: [
      {
        name: 'my_workday_tracker',
        port: '3000',
        exec_mode: 'cluster',
        instances: 'max',
        script: './.output/server/index.mjs'
      }
    ]
  }
  