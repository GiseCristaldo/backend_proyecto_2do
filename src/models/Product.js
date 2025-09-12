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
        type: DataTypes.FLOAT,
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    imagenURL: {
    type: DataTypes.TEXT, // TEXT puede almacenar textos muy largos, como un Base64
    allowNull: false,
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