import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Product = sequelize.define('Product', {
    name:{
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imagenPath: {
        type: DataTypes.TEXT, // Cambiado de STRING a TEXT para permitir datos más largos
        allowNull: true, // Permitir null para productos sin imagen
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categories', // Nombre de la tabla de categorías
            key: 'id'
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }, 
    ofert: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    discount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        validate: {
            min:0,
            max:100
        }
    }
}, {
        tableName: 'products',
        timestamps: false,
    }
);