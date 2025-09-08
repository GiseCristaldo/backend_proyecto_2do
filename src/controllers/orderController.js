// src/controllers/OrderController.js
import { Order, OrderDetail, User, Product } from '../models/index.js'; // Importo todos los modelos que necesito
import { sequelize } from '../config/database.js';

// Crear una Orden (Checkout)
export const createOrder = async (req, res) => {
    // Iniciar una transacción
    const t = await sequelize.transaction();

    try {
        const userId = req.user.id;
        const { items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'El carrito está vacío.' });
        }

        let total = 0;
        const productChecks = [];

        for (const item of items) {
            productChecks.push(Product.findByPk(item.productId));
        }
        const products = await Promise.all(productChecks);

        for (let i = 0; i < items.length; i++) {
            const product = products[i];
            const item = items[i];
            if (!product || product.stock < item.amount) {
                await t.rollback(); // Revertir transacción si hay error
                return res.status(400).json({ message: `Stock insuficiente para el producto: ${product?.name || item.productId}` });
            }
            item.unitPrice = product.price;
            item.subtotal = item.amount * item.unitPrice;
            total += item.subtotal;
        }

        const newOrder = await Order.create({
            userId,
            state: 'pendiente',
            total
        }, { transaction: t }); // Pasar la transacción

        const orderDetails = items.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            amount: item.amount,
            unit_price: item.unitPrice,
            subtotal: item.subtotal
        }));

        await OrderDetail.bulkCreate(orderDetails, { transaction: t }); // Pasar la transacción

        for (const item of items) {
            await Product.decrement('stock', {
                by: item.amount,
                where: { id: item.productId },
                transaction: t // Pasar la transacción
            });
        }

        // Si todo fue bien, confirmar la transacción
        await t.commit();

        res.status(201).json({
            message: 'Orden creada exitosamente.',
            order: newOrder
        });

    } catch (error) {
        // Si algo falló, revertir la transacción
        await t.rollback();
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

// --- Obtener Todas las Órdenes (Solo Admin) --- VERSIÓN CON PAGINACIÓN
export const getAllOrders = async (req, res) => {
    try {
        // 1. Obtener parámetros de paginación de la query
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // 2. Usar findAndCountAll para obtener órdenes y el conteo total
        const { count, rows } = await Order.findAndCountAll({
            limit: limit,
            offset: offset,
            include: [{
                model: User,
                as: 'user',
                attributes: ['nombre', 'email']
            }],
            order: [['date', 'DESC']]
        });

        // 3. Calcular el total de páginas
        const totalPages = Math.ceil(count / limit);

        // 4. Enviar la respuesta con los datos de paginación
        res.json({
            orders: rows,
            totalItems: count,
            totalPages: totalPages,
            currentPage: page,
        });

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