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
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    'https://infinity-store-frontend.vercel.app',
    'https://*.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Para soportar navegadores legacy
};
app.use(cors(corsOptions));

// Configuración de encabezados de seguridad
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://accounts.google.com"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
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
app.use('/api/users', userRoutes);

// 3. GESTIÓN DE PRODUCTOS: Prefijo /api/products
app.use('/api/products', productRoutes);

// 4. GESTIÓN DE CATEGORÍAS: Prefijo /api/categories
app.use('/api/categories', categoryRoutes);

// 5. GESTIÓN DE PEDIDOS: Prefijo /api/orders
app.use('/api/orders', orderRoutes);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Función para inicializar la base de datos y el servidor
const startServer = async () => {
  try {
    // Sincronizar la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: false }); // Cambiado de true a false para evitar cambios automáticos
    console.log('✅ Modelos sincronizados correctamente.');
    
    // Iniciar el servidor
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
