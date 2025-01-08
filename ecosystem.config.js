module.exports = {
  apps: [
    {
      name: 'donaciones-app',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 4200,
        API_URL: 'http://localhost:8080/api'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4200,
        API_URL: `http://${process.env.HOST || 'localhost'}:8080/api`
      }
    }
  ]
};
