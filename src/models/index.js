// src/models/index.js
import { sequelize } from '../config/database.js';
import { Category } from './Category.js';
import { Product } from './Product.js';
import { User } from './User.js'; 
import { Order } from './Order.js'; 
import { OrderDetail } from './OrderDetail.js'; 


// --- Definición de Relaciones (Asociaciones) ---

// Relaciones para Product y Category 
Category.hasMany(Product, {
  foreignKey: 'categoryId', // Clave foránea en la tabla 'products'
  as: 'products' // Alias para incluir  productos desde Category
});

Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category' // Alias para incluir categoría desde Product
});

// Relación entre User y Order: Un usuario puede tener muchas órdenes (1:N)
User.hasMany(Order, {
  foreignKey: 'userId', // Clave foránea en la tabla 'orders' que apunta al ID del usuario
  as: 'orders'
});

Order.belongsTo(User, {
  foreignKey: 'userId', // Clave foránea en la tabla 'orders' que apunta al ID del usuario
  as: 'user'
});

// Relación entre Order y OrderDetail: Una orden contiene muchos detalles de orden (1:N)
Order.hasMany(OrderDetail, {
  foreignKey: 'orderId', // Clave foránea en la tabla 'order_details' que apunta al ID de la orden
  as: 'details'
});

OrderDetail.belongsTo(Order, {
  foreignKey: 'orderId', // Clave foránea en la tabla 'order_details' que apunta al ID de la orden
  as: 'order'
});

// Relación entre Product y OrderDetail: Un producto puede estar en muchos detalles de orden (1:N, pero OrderDetail se refiere a un Product)
Product.hasMany(OrderDetail, {
  foreignKey: 'productId', // Clave foránea en la tabla 'order_details' que apunta al ID del producto
  as: 'orderDetails' // Un producto puede tener muchos detalles de orden
});

OrderDetail.belongsTo(Product, {
  foreignKey: 'productId', // Clave foránea en la tabla 'order_details' que apunta al ID del producto
  as: 'product'
});

// Exportar todos los modelos y la instancia de sequelize
export {
  sequelize,
  Category,
  Product,
  User, // 
  Order, 
  OrderDetail,
};