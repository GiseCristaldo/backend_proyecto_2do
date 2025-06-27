// src/controllers/OrderController.js
import { Order, OrderDetail, User, Product } from '../models/index.js'; // Importo todos los modelos que necesito

// Crear una Orden (Checkout)
export const createOrder = async (req, res) => {
    try {
        // req.user.id viene del middleware de autenticación, que asegura que el usuario está logueado
        const userId = req.user.id;
        const { items } = req.body; // 'items' trae un array de { productId, amount, unitPrice }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El carrito está vacío. No se puede crear una orden sin productos.' });
        }

        // Calcular el total de la orden
        let total = 0;
        // Validar stock y calcular subtotal para cada item
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (!product || product.stock < item.amount) {
                return res.status(400).json({ message: `Stock insuficiente para el producto: ${item.productId}` });
            }
            // me aseguro de que el unitPrice enviado sea el precio actual del producto en la DB
            // para evitar manipulaciones de precio desde el frontend.
            item.unitPrice = product.price;
            item.subtotal = item.amount * item.unitPrice;
            total += item.subtotal;
        }

        // 1. Crear la orden principal
        const newOrder = await Order.create({
            userId,
            date: new Date(), // Usar la fecha actual del servidor
            state: 'pendiente', // Estado inicial de la orden
            total
        });

        // 2. Crear los detalles de la orden
        const orderDetails = items.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            amount: item.amount,
            unit_price: item.unitPrice,
            subtotal: item.subtotal
        }));

        await OrderDetail.bulkCreate(orderDetails); // con este método insertamos todos los detalles de la orden en bloque

        // 3. Reducir el stock de los productos
          console.log('Iniciando reducción de stock'); //prueba para ver si funciona 
        for (const item of items) {
            try { 
            const product = await Product.findByPk(item.productId);
            if (product) {
                    const oldStock = product.stock;
                    const newStock = product.stock - item.amount;
                    console.log(`Producto ID: ${item.productId}, Nombre: ${product.name}`); // prueba
                    console.log(`Stock anterior: ${oldStock}, Cantidad comprada: ${item.amount}, Nuevo stock esperado: ${newStock}`); // prueba

                    await product.update({ stock: newStock });
                    console.log(`Stock actualizado para ${product.name}. Nuevo stock: ${product.stock}`); // prueba: Stock después de la actualización

                } else {
                    console.warn(`WARN: Producto con ID ${item.productId} no encontrado durante la reducción de stock.`); // prueba
                }
            } catch (updateError) {
                console.error(`ERROR: Fallo al actualizar stock para producto ${item.productId}:`, updateError); // prueba 
            }
        }
        console.log('Reducción de stock finalizada'); // prueba final
        

        // 4. Simulación de Pasarela de Pago (investigando aún no probada)
        // Por ahora o se gestionará en el front o la orden queda 'pendiente'.
        // Si hay una lógica de pago backend: podemos usar esta función consultarlo ******

        // const paymentResult = await processPayment(total, paymentInfo);
        // if (paymentResult.success) {
        //     await newOrder.update({ state: 'pagado' });
        // } else {
        //     // Manejar fallo de pago, quizás poner estado 'cancelado' o loguear
        // }

       res.status(201).json({
            message: 'Orden creada exitosamente. Estado: Pendiente de pago/confirmación.',
           order: newOrder,
            details: orderDetails
       });

   } catch (error) {
      console.error('Error al crear la orden:', error);
     res.status(500).json({ message: 'Error interno del servidor al crear la orden.' });
   }
};

// --- Obtener Órdenes del Usuario Logueado (Historial) ---
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id; // guardamos el ID del usuario del token

        const orders = await Order.findAll({
            where: { userId: userId  },
            include: [
                    {
                        model: User, // Incluimos el modelo User para obtener el nombre/email del usuario
                        as: 'user',
                        attributes: ['nombre', 'email'] // solo estos
                    },
                    {
                        model: OrderDetail, // Incluir los detalles de la orden
                        as: 'details', // Alias para los detalles de la orden
                        include: [
                            {
                                model: Product, // Incluir el producto asociado a cada detalle
                                as: 'product', // Alias para el producto
                                attributes: ['name', 'imagenURL', 'price'] // Atributos del producto que queremos ver
                            }
                        ]
            }],
            order: [['date', 'DESC']] // Ordenar por fecha descendente
        });
    if (!orders || orders.length === 0) {
                return res.status(200).json([]); // Devuelve un array vacío si no hay órdenes
            }

        res.json(orders);

    } catch (error) {
        console.error('Error al obtener las órdenes del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener las órdenes.' });
    }
};

// --- Obtener Todas las Órdenes (Solo Admin) --- (no probado, no tengo front de admin)
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{
                model: User,
                as: 'user', // Alias definido en index.js
                attributes: ['nombre', 'email'] // atributos del usuario
            }, {
                model: OrderDetail,
                as: 'details',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['name']
                }]
            }],
            order: [['date', 'DESC']]
        });

        res.json(orders);

    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener todas las órdenes.' });
    }
};

// --- Ver Detalle de una Orden Específica (Admin y/o Usuario si es su orden) (solo probado con usuario)
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByPk(id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['nombre', 'email']
            }, {
                model: OrderDetail,
                as: 'details',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['name', 'price', 'imagenURL']
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        // Los usuarios solo pueden ver sus propias órdenes
        if (req.user.rol !== 'admin' && order.userId !== req.user.id) {
            return res.status(403).json({ message: 'Acceso denegado. No tienes permisos para ver esta orden.' });
        }

        res.json(order);

    } catch (error) {
        console.error('Error al obtener la orden por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la orden.' });
    }
};

// --- Actualizar Estado de una Orden (Solo Admin) (no probado, no tengo front de admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { state } = req.body; // Nuevo estado (ej. 'pagado', 'enviado', 'cancelado')

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        // Validar que el nuevo estado sea uno permitido
        const allowedStates = ['pendiente', 'pagado', 'enviado', 'cancelado'];
        if (!allowedStates.includes(state)) {
            return res.status(400).json({ message: 'Estado de orden inválido.' });
        }

        await order.update({ state });
        res.json({ message: 'Estado de la orden actualizado exitosamente.', order });

    } catch (error) {
        console.error('Error al actualizar el estado de la orden:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado de la orden.' });
    }
};