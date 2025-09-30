import { User } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library'; 

// REGISTRO de usuario - siempre cliente
export const registerUser = async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
     // 1. Validate required fields
        if (!nombre || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos (nombre, email, password) son obligatorios.' });
        }
        
    // Trim whitespace from email
    const trimmedEmail = email.trim();
  
    if (trimmedEmail.length > 254) {
    return res.status(400).json({ 
        message: 'El email no puede exceder los 254 caracteres.' 
    });
}

if (trimmedEmail.length < 5) {
    return res.status(400).json({ 
        message: 'El email debe tener al menos 5 caracteres.' 
    });
}

    // --- SIMPLIFIED EMAIL FORMAT VALIDATION (REQUISITO: Valid email format) ---
    const atIndex = trimmedEmail.indexOf('@');
    const dotIndex = trimmedEmail.lastIndexOf('.');

    // 1. Must contain an '@'
    if (atIndex === -1) {
      return res.status(400).json({ message: 'El email debe contener el símbolo @.' });
    }

    // 2. Must contain a '.' after the '@' and cannot end with '.'
    if (dotIndex < atIndex || dotIndex === -1 || dotIndex === trimmedEmail.length - 1) {
      return res.status(400).json({ message: 'El email debe tener un dominio válido (ej. ".com", ".net").' });
    }

    // 3. Local part (before @) and domain part (between @ and .) cannot be empty
    if (atIndex === 0 || dotIndex - atIndex <= 1) {
       return res.status(400).json({ message: 'El email no tiene un formato válido (partes faltantes).' });
    }
    // --- END OF SIMPLIFIED EMAIL VALIDATION ---

    // Check if email already exists (REQUISITO: Clear error cases)
    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email ya está registrado.' });
    }


    // --- SIMPLIFIED PASSWORD SECURITY VALIDATION (REQUISITO: Minimum security criteria) ---
    
    // 1. Minimum length (8 characters)
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }
    
    // 2. Maximum length (128 characters)
    if (password.length > 128) {
    return res.status(400).json({ 
        message: 'La contraseña no puede exceder los 128 caracteres.' 
    });
}

    // 2. Uppercase (at least one)
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe incluir al menos una mayúscula.' });
    }

    // 3. Number (at least one)
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe incluir al menos un número.' });
    }

    // 4. Special character (at least one of the required ones)
    const specialCharRegex = /[@$!%*?&]/;
    if (!specialCharRegex.test(password)) {
      return res.status(400).json({ message: 'La contraseña debe incluir al menos un carácter especial (@, $, !, %, *, ?, o &).' });
    }

    // Validate password confirmation (REQUISITO: Password must match)
    if (password !== req.body.confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    // Hash password (REQUISITO: Encrypted passwords / Security)
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt); 


    // Crear usuario con rol por defecto 'cliente' (REQUISITO: Persistencia)
    const newUser = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: 'cliente',
      loginMethod: 'local'
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

// ALTERNATIVE LOGIN WITH GOOGLE (REQUISITO: Google login support)
export const googleAuthHandler = async (req, res) => { 
    const { idToken } = req.body;

    // 1. Validate required token
    if (!idToken) {
        return res.status(400).json({ message: 'El token de Google es obligatorio.' });
    }

    try {
        let userData;
        
        // 1. CLAVE DE AUDIENCIA: Usamos la variable de backend
        const CLIENT_ID_AUDIENCE = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
        
        // Inicializa el cliente con la clave
        const client = new OAuth2Client(CLIENT_ID_AUDIENCE); 

        // DEBUG: Muestra la clave que Node está leyendo (CRÍTICO)
        console.log("DEBUG BACKEND CLIENT_ID used for Audience:", CLIENT_ID_AUDIENCE); 
        
        // =========================================================================
        // ✅ CÓDIGO DE VERIFICACIÓN REAL
        // -------------------------------------------------------------------------
        
        try {
            if (!CLIENT_ID_AUDIENCE) {
                // Mensaje de error más claro
                throw new Error('GOOGLE_CLIENT_ID no está configurada correctamente en el backend (revisa tu .env).'); 
            }
            
            // Llama a la API de Google para verificar el token
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: CLIENT_ID_AUDIENCE, // Asegura que el token sea para tu app
            });
            // Obtiene los datos del payload verificado
            const payload = ticket.getPayload();
            
            userData = {
                email: payload.email,
                name: payload.name
            };

        } catch (error) {
            console.error('Error verificando token de Google:', error.message);
            
            // Devuelve error 401 si Google reporta un token inválido
            return res.status(401).json({ message: 'Token de Google inválido o caducado.' });
        }
        
        // =========================================================================
        
        const email = userData.email.trim();
        const nombre = userData.name;

        // 2. Busca al usuario en la base de datos
        let user = await User.findOne({ where: { email } });

        if (!user) {
            // 3. Si el usuario no existe, crea la cuenta (primer login)
            const tempHashedPassword = bcrypt.hashSync(email, 10); 
            
            user = await User.create({
                nombre: nombre,
                email: email,
                password: tempHashedPassword, 
                rol: 'cliente', 
                loginMethod: 'google' 
            });
        }
        
        // 4. Genera el token JWT local (para mantener la sesión en la API)
        const token = jwt.sign(
            { user: { id: user.id, rol: user.rol } },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // PRUEBA: Token expira en 2 horas
        );

        // 5. Devuelve el éxito
        res.json({
            message: 'Login con Google exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en el login con Google:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el login con Google.' });
    }
};

// LOGIN admin or client
export const loginUser = async (req, res) => {

  try {
    const { email, password } = req.body;

// ... (código loginUser)
    // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
        }
    // Verificar si el usuario existe
    const user = await User.findOne({ where: { email } });

   if (!user) {
            // REQUISITO: Clear and consistent error messages for invalid credentials
            return res.status(401).json({ message: 'Credenciales inválidas (email o contraseña incorrectos).' });
        }
        
    // --- GOOGLE ACCOUNT HANDLING: PREVENT LOCAL LOGIN ---  
    // Si la cuenta fue creada con Google, debe usar el botón de Google.
    if (user.loginMethod === 'google') {
        return res.status(403).json({ 
            message: 'Esta cuenta fue registrada usando Google. Por favor, utiliza el botón "Iniciar sesión con Google".'
        });
    }
    // --------------------------------------------------------

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Credenciales inválidas (email o contraseña incorrectos).' }); // Unified message

    // Generar token JWT
    const token = jwt.sign(
      { user:{ id: user.id, rol: user.rol } },
      process.env.JWT_SECRET,
      { expiresIn: '2h' } // PRUEBA: Token expira en 2 horas
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

// OBTENER USUARIO LOGUEADO
export const getLoggedUser = async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findByPk(userId, {
            attributes: ['id', 'nombre', 'email', 'rol'],
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// GET ALL USERS (Admin only) 
export const getAllUsers = async (req, res) => {
  try {
    // 1. Get pagination parameters from query string (e.g., /admin/users?page=1&limit=10)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // 2. Use findAndCountAll to get users and total count
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] }, // Exclude password
      order: [['date_register', 'DESC']],
      limit: limit,
      offset: offset,
    });

    // 3. Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // 4. Send response with pagination data
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
// 5. Update a user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const {id}  = req.params; // ID of the user to edit
    const { nombre, email, rol } = req.body; // Data to update

    // Validate that the user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Update fields
    user.nombre = nombre || user.nombre;
    user.email = email || user.email;
    user.rol = rol || user.rol;

        await user.save();

    // Return the updated user (without password)
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(200).json({ message: 'Usuario actualizado correctamente', user: userResponse });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al actualizar usuario' });
  }
};
// 6. Delete a user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // ID of the user to delete

    // Validate that the user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Delete the user
    await user.destroy();

    res.status(200).json({ message: 'Usuario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor al eliminar usuario' });
  }
};
