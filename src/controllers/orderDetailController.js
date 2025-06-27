// src/controllers/OrderDetailController.js
import { OrderDetail, Product, Order } from '../models/index.js'; // Importamos modelos necesarios

//Obtener todos los detalles de orden (solo para admin, no probado, no tengo front)
export const getAllOrderDetails = async (req, res) => {
    try {
        const orderDetails = await OrderDetail.findAll({
            include: [
                { model: Order, as: 'order', attributes: ['id', 'userId', 'date', 'total'] },
                { model: Product, as: 'product', attributes: ['name', 'price'] }
            ]
        });
        res.json(orderDetails);
    } catch (error) {
        console.error('Error al obtener todos los detalles de orden:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener detalles de orden.' });
    }
};

// Obtener detalle de orden por ID
export const getOrderDetailById = async (req, res) => {
    try {
        const { id } = req.params;
        const orderDetail = await OrderDetail.findByPk(id, {
            include: [
                { model: Order, as: 'order', attributes: ['id', 'userId', 'date', 'total'] },
                { model: Product, as: 'product', attributes: ['name', 'price', 'imageURL'] }
            ]
        });

        if (!orderDetail) {
            return res.status(404).json({ message: 'Detalle de orden no encontrado.' });
        }

        res.json(orderDetail);
    } catch (error) {
        console.error('Error al obtener detalle de orden por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener detalle de orden.' });
    }
};
