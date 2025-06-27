// src/models/OrderDetail.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const OrderDetail = sequelize.define('OrderDetail', {
    id: { 
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    // order_id y product_id serán claves foráneas definidas en index.js 
    amount: { // Cantidad del producto en la orden
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit_price: { // Precio del producto en el momento de la compra (puede variar en el futuro)
        type: DataTypes.FLOAT,
        allowNull: false
    },
    subtotal: { // Subtotal de esta línea (cantidad * precio_unitario)
        type: DataTypes.FLOAT,
        allowNull: false
    }
}, {
    tableName: 'order_details', // Nombre de la tabla en la base de datos (plural y con guion bajo)
    timestamps: false
});
