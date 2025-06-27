import { Router } from 'express';

import {
    getCategories,
    getCategoriesById,
    createCategory,
    updateCategory,
} from '../controllers/categoriesController.js';
 import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
const router = Router();

// Obtener todas las categorías activas
router.get('/', getCategories);
// Obtener categoría por ID
router.get('/:id', getCategoriesById);
router.post('/', createCategory);
    // Crear una nueva categoría
  // Rutas protegidas para administradores (CRUD de categorías)(no probado porque no tengo front de admin)
    router.post('/', verifyToken, isAdmin, createCategory);    // Crear una nueva categoría (Admin)
    router.put('/:id', verifyToken, isAdmin, updateCategory); 

export default router;