import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';
import helmet from 'helmet';

import categoryRoutes from './routes/category.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js'; 
import userRoutes from './routes/user.routes.js'; // <-- NUEVA IMPORTACIÓN


dotenv.config();

const app = express();

// Configuración de CORS para permitir solicitudes desde el frontend
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Configuración de encabezados de seguridad
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', cors(corsOptions), express.static('uploads'));

app.get('/', (req, res) => {
    res.send( 'Infinity Store Backend is running!!🚀 ');
});

// --- Uso de las Rutas (Endpoints) ---
// Define los prefijos de las URLs para cada grupo de rutas

// 1. AUTENTICACIÓN (LOGIN, REGISTER, GOOGLE): Prefijo /api/auth
app.use('/api/auth', authRoutes);

// 2. GESTIÓN DE USUARIOS (ADMIN/CRUD): Prefijo /api/users
app.use('/api/users', userRoutes); // <-- Montaje del nuevo router

app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes );
app.use('/api/orders', orderRoutes);


// Middleware para manejar errores no capturados (opcional, pero buena práctica)
app.use((err, req, res, next) => {
    console.error(err.stack); // Registra el error en la consola del servidor
    res.status(500).send('Algo salió mal en el servidor!'); // Envía una respuesta genérica al cliente
});


//conexión con la base de datos

try {
    await sequelize.authenticate();
    console.log('My Database is connected ¡Yeeey! 🎉');
    await sequelize.sync();
} catch (error) {
    console.error('Error al conectar la base de datos:', error); 
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running bitch: http://localhost:${PORT}`);
});
