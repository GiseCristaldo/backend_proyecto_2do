import express from 'express';
// Importamos solo las funciones de administración
import {
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

// Importa los middlewares 
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Las rutas de administración se definen aquí con un prefijo simple,
// ya que el prefijo /api/users ya viene desde app.js.
// El prefijo completo será: /api/users/admin/users
router.get('/admin/users', verifyToken, isAdmin, getAllUsers); 
router.put('/admin/users/:id', verifyToken, isAdmin, updateUser); 
router.delete('/admin/users/:id', verifyToken, isAdmin, deleteUser); 

export default router;