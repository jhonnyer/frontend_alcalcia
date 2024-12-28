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
        //API_URL: 'http://192.168.1.112:8080/api'
        API_URL: 'http://192.168.195.219:8080/api'
      }
    }
  ]
};
