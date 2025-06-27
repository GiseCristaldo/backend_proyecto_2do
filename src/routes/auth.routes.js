// src/routes/authRoutes.js
import express from 'express';
// Importamos las funciones del controlador de usuarios
import {
  registerUser,
  loginUser,
  getLoggedUser,
  getAllUsers,
} from '../controllers/userController.js';

// Importa los middlewares 
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas de autenticación (no protegidas inicialmente)
router.post('/register', registerUser); // HU2.1
router.post('/login', loginUser);       // HU2.2

// Rutas protegidas
// Obtener información del usuario logueado (protegida por token)
router.get('/me', verifyToken, getLoggedUser); // Necesita un token válido

// Obtener todos los usuarios (protegida por token Y rol de administrador)
router.get('/admin/users', verifyToken, isAdmin, getAllUsers); // Necesita token válido Y rol 'admin'

export default router;
