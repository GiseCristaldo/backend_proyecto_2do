// src/models/Order.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    // user_id será la clave foránea definida en index.js a través de las asociaciones
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // La fecha de la orden será la fecha actual por defecto
        allowNull: false
    },
    state: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'cancelado'), // Estados posibles de la orden
        defaultValue: 'pendiente',
        allowNull: false
    },
    total: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'orders', // Nombre de la tabla en la base de datos (plural)
    timestamps: false
});