// src/routes/productRoutes.js
import express from 'express';
import {
  getProducts,       // Renombré de 'getAllProducts' a 'getProducts' en la última versión del controlador
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

// Importa los middlewares para proteger las rutas de administrador
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas públicas de productos
router.get('/', getProducts);         // HU1.1, HU1.3 - Obtener todos los productos
router.get('/:id', getProductById);   // HU1.2 - Obtener detalle de un producto por ID

// Rutas protegidas para administradores (CRUD de productos)
router.post('/', verifyToken, isAdmin, createProduct);    // HU4.1 - Crear un nuevo producto
router.put('/:id', verifyToken, isAdmin, updateProduct);  // HU4.1 - Actualizar un producto existente
router.delete('/:id', verifyToken, isAdmin, deleteProduct); // HU4.1 - Eliminar lógicamente un producto

export default router;