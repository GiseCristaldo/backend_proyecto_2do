// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; 

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Ahora req.user tiene {id, rol}
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
      next();
  } else {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' });
  }
};
