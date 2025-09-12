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

// Rutas protegidas para administradores (CRUD de categorías)
router.post('/', verifyToken, isAdmin, createCategory);    // Crear una nueva categoría (Admin)
router.put('/:id', verifyToken, isAdmin, updateCategory);  // Actualizar una categoría (Admin)

export default router;