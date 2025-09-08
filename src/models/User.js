import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // El email debe ser único para cada usuario
        validate: {
            isEmail: true // Validación de formato de email
        }
    },
    password: {
        type: DataTypes.STRING(100), // Aquí se almacenará el hash de la contraseña
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('cliente', 'admin'), // Definimos los roles posibles
        defaultValue: 'cliente', // El rol por defecto será 'cliente'
        allowNull: false
    },
    date_register: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Fecha de registro por defecto a la fecha actual
        allowNull: false
    }
}, {
    tableName: 'users', // Nombre de la tabla en la base de datos (plural)
    timestamps: false // No queremos que Sequelize maneje automáticamente `createdAt` y `updatedAt`
});
