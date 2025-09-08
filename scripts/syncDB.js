import { sequelize } from "../src/config/database.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";
import { OrderDetail } from "../src/models/OrderDetail.js";
import { Category } from "../src/models/Category.js";

(async () => {
  try {
    await sequelize.sync({ alter: true }); // alter actualiza la tabla si hay cambios
    console.log('Base de datos sincronizada correctamente');
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
  } finally {
    await sequelize.close();
  }
})();
