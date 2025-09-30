import express from 'express';
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus
} from '../controllers/orderController.js';

// Importa los middlewares
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas para usuarios autenticados
router.post('/', verifyToken, createOrder);        // HU3.4 - Crear una nueva orden (checkout)
router.get('/my-orders', verifyToken, getUserOrders); // HU3.5 - Ver historial de órdenes del usuario logueado
router.get('/:id', verifyToken, getOrderById);           // Obtener detalle de una orden (protegido, puede ser para admin o propio usuario)

// Rutas para administradores
router.get('/admin', verifyToken, isAdmin, getAllOrders);       // HU4.3 - Obtener todas las órdenes (solo admin)
router.put('/:id/status', verifyToken, isAdmin, updateOrderStatus); // HU4.3 - Actualizar estado de una orden (solo admin)

export default router;