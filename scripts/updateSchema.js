import { Product } from '../src/models/Product.js';

(async () => {
  try {
    await Product.sync({ alter: true }); // Actualiza el esquema de la tabla
    console.log('Esquema de la tabla actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar el esquema de la tabla:', error);
  }
})();