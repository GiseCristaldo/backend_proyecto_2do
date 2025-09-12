// src/controllers/userController.js
import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//REGISTRO de usuario - siempre cliente
export const registerUser = async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
     // 1. Validar campos requeridos
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos (nombre, email, password) son obligatorios.' });
        }
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email ya está registrado.' });
    }

    // Hashear contraseña
        // ¿Qué es 'salt'?
        // 'Salt' (sal en español) es una cadena de datos aleatorios que se añade a una contraseña antes de que sea hasheada.
        // Su propósito principal es mejorar la seguridad del proceso de hashing de contraseñas.
        // Si dos usuarios tienen la misma contraseña (ej. "123456"), sin 'salt', el hash resultante sería idéntico.
        // Esto permitiría ataques de "rainbow table" (tablas precalculadas de hashes).
        // Al usar un 'salt' único y aleatorio para cada contraseña, incluso si dos usuarios eligen la misma contraseña,
        // sus hashes resultantes serán completamente diferentes porque se combinan con un 'salt' distinto.
        // `bcrypt.genSalt(10)` genera un 'salt' con un costo de trabajo (work factor) de 10.
        // Un costo de trabajo más alto significa que el proceso de hashing es más lento y, por lo tanto,
        // más resistente a ataques de fuerza bruta, pero también consume más recursos del servidor.
        const salt = await bcrypt.genSalt(10); // Generamos una "sal" única y aleatoria
        const hashedPassword = await bcrypt.hash(password, salt); // Hashea la contraseña combinándola con la sal


    // Crear usuario con rol por defecto 'cliente'
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: 'cliente'
    });

    res.status(201).json({ message: 'Usuario registrado correctamente',
  user: {
                id: newUser.id,
                nombre: newUser.nombre,
                email: newUser.email,
                rol: newUser.rol,
                date_register: newUser.date_register
            }
            });
} catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ message: 'Error en el registro del usuario' });
  }
};

// LOGIN admin o cliente
export const loginUser = async (req, res) => {

  try {
    const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }
    // Verificar si el usuario existe
    const user = await User.findOne({ where: { email } });

   if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (email o contraseña incorrectos).' });
        }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Generar token JWT
    //Un JWT (JSON Web Token) es un token de acceso seguro que: Identifica al usuario que se ha logueado.
   //Permite acceder a rutas protegidas (como hacer pedidos o ver el carrito).
   //Es generado por el backend y enviado al frontend, que lo guarda en localStorage o sessionStorage.
   //para esto estoy usando la librería jsonwebtoken (jwt).
    //El token contiene información del usuario (como su ID y rol) y está firmado con un secreto (JWT_SECRET).
    //El token tiene una fecha de expiración (en este caso, 2 horas)


    const token = jwt.sign(
      { user:{ id: user.id, rol: user.rol } },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor al iniciar sesión' });
  }
};

// VER TODOS LOS USUARIOS (Solo admin) (no probado, no tengo front de admin)
export const getAllUsers = async (req, res) => {
  try {
    // 1. Obtener parámetros de paginación de la query string (ej: /admin/users?page=1&limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // 2. Usar findAndCountAll para obtener usuarios y el conteo total
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] }, // Excluimos la contraseña
      order: [['date_register', 'ASC']],
      limit: limit,
      offset: offset,
    });

    // 3. Calcular el total de páginas
    const totalPages = Math.ceil(count / limit);

    // 4. Enviar la respuesta con los datos de paginación
    res.status(200).json({
      users: rows,
      totalItems: count,
      totalPages: totalPages,
      currentPage: page,
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};
// 5. Edita un usuario (solo admin)
export const updateUser = async (req, res) => {
  try {
    const {id}  = req.params; // ID del usuario a editar
    const { nombre, email, rol } = req.body; // Datos a actualizar

    // Validar que el usuario exista
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Actualizar los campos
    user.nombre = nombre || user.nombre;
    user.email = email || user.email;
    user.rol = rol || user.rol;

        await user.save();

    // Devolver el usuario actualizado (sin la contraseña)
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(200).json({ message: 'Usuario actualizado correctamente', user: userResponse });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar usuario' });
  }
};
// 6. Elimina un usuario (solo admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // ID del usuario a eliminar

    // Validar que el usuario exista
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Eliminar el usuario
    await user.destroy();

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar usuario' });
  }
};  

// HU2.2 y parte de la protección de rutas
export const getLoggedUser = async (req, res) => {
    try {
        // req.user viene del middleware de autenticación (authMiddleware)
        // Este middleware adjunta la información decodificada del JWT al objeto req.
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } // No mostrar la contraseña hasheada
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(user);

    } catch (error) {
        console.error('Error al obtener datos del usuario logueado:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener datos del usuario.' });
    }
};
