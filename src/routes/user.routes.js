import express from 'express';
// Importamos las funciones de administración
import {
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

// Importa los middlewares 
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas de administración de usuarios (solo admin)
router.get('/admin', verifyToken, isAdmin, getAllUsers); 
router.put('/admin/:id', verifyToken, isAdmin, updateUser); 
router.delete('/admin/:id', verifyToken, isAdmin, deleteUser); 

export default router;