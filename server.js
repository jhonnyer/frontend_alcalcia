const express = require('express');
const path = require('path');
const app = express();

// Puerto donde correrá el frontend
const port = process.env.PORT || 4200;

// URL del backend
const backendUrl = process.env.API_URL || 'http://localhost:8080';

// Configuración de CORS para permitir la comunicación con el backend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', backendUrl);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Servir archivos estáticos desde la carpeta dist
const distPath = 'dist/donaciones';
app.use(express.static(path.join(__dirname, distPath)));

// Manejar todas las rutas de Angular
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, distPath, 'index.html'));
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Frontend corriendo en http://localhost:${port}`);
    console.log(`Backend configurado en: ${backendUrl}`);
});
