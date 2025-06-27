// src/routes/orderDetailRoutes.js
import express from 'express';
import {
  getAllOrderDetails,
  getOrderDetailById
} from '../controllers/orderDetailController.js'; 

// Importa los middlewares para proteger las rutas (estas deberían ser solo para admin)
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas protegidas para administradores (visualización de detalles de órdenes)
router.get('/', verifyToken, isAdmin, getAllOrderDetails);    // Obtener todos los detalles de orden
router.get('/:id', verifyToken, isAdmin, getOrderDetailById); // Obtener un detalle de orden por ID

export default router;