import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './config/database.js';

import categoryRoutes from './routes/category.routes.js';
import authRoutes from './routes/auth.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js'; 


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
    res.send( 'Infinity Store Backend is running!!🚀 ');
});

// --- Uso de las Rutas (Endpoints) ---
// Define los prefijos de las URLs para cada grupo de rutas
app.use('/api/users', authRoutes);
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

