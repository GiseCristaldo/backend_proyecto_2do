import express from 'express';
import {
  registerUser,
  loginUser,
  googleAuthHandler,
  getLoggedUser
} from '../controllers/userController.js';

import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas de autenticación (no protegidas)
router.post('/register', registerUser); 
router.post('/login', loginUser);       
router.post('/google', googleAuthHandler);

// Ruta protegida para obtener datos del usuario logueado
router.get('/me', verifyToken, getLoggedUser); 

export default router;
