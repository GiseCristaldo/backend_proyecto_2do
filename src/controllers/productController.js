import { Product, Category } from '../models/index.js';
import { Op } from 'sequelize';

// --- Obtener todos los productos ---
export const getProducts = async (req, res) => {
    try {
        const { name, category, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        let whereClause = { active: true };

        if (name) {
            whereClause.name = { [Op.like]: `%${name}%` };
        }
        if (category) {
            whereClause.categoryId = category;
        }

        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['name', 'ASC']],
            include: [{
                model: Category,
                as: 'category',
                attributes: ['name']
            }]
        });

        // Formatear las rutas de imagen para la respuesta paginada
        const productsWithFormattedImages = rows.map(product => {
            const productJson = product.toJSON();
            // Lógica para construir la URL completa de la imagen
            productJson.imagenPath = product.imagenPath
                ? `http://localhost:3001/${product.imagenPath}`
                : 'https://placehold.co/400x200/4a4a4a/f0f0f0?text=No+Image';
            return productJson;
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            products: productsWithFormattedImages,
            totalItems: count,
            totalPages: totalPages,
            currentPage: parseInt(page),
        });

    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los productos.' });
    }
};

// --- Obtener Detalle de un Producto por ID ---
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['name']
            }]
        });

        if (!product || !product.active) {
            return res.status(404).json({ message: 'Producto no encontrado o no disponible.' });
        }

        const productResponse = product.toJSON();

        // Construir la URL completa de la imagen para el frontend
        productResponse.imagenPath = product.imagenPath
            ? `http://localhost:3001/${product.imagenPath}`
            : 'https://placehold.co/400x400/4a4a4a/f0f0f0?text=No+Image';
        
        // Formatear el precio
        productResponse.price = parseFloat(product.price).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        });

        // Eliminar el campo 'imagenURL' si aún existe para evitar confusiones
        delete productResponse.imagenURL;

        res.json(productResponse);

    } catch (error) {
        console.error('Error al obtener el producto por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el producto.' });
    }
};

// --- Crear un nuevo producto ---
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, offer, discount } = req.body;
        const imagenPath = req.file ? req.file.path : null;

        if (!name || !description || !price || stock === undefined || !categoryId) {
            return res.status(400).json({ message: 'Todos los campos (nombre, descripción, precio, stock, categoryId) son obligatorios.' });
        }
        if (price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Precio debe ser mayor a 0 y stock no puede ser negativo.' });
        }
        if (discount !== undefined && (discount < 0 || discount > 100)) {
            return res.status(400).json({ message: 'El descuento debe ser un valor entre 0 y 100.' });
        }

        const categoryExists = await Category.findByPk(categoryId);
        if (!categoryExists) {
            return res.status(400).json({ message: 'La categoría especificada no existe.' });
        }

        const newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            imagenPath, // Ahora se usa el path de la imagen
            categoryId,
            active: true,
            offer: offer || false,
            discount: discount || 0
        });

        res.status(201).json({ message: 'Producto creado exitosamente.', product: newProduct });

    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el producto.' });
    }
};

// --- Actualizar un producto existente ---
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, categoryId, active, offer, discount } = req.body;
        
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Si se subió un nuevo archivo, usar su path; si no, mantener el path existente.
        const imagenPath = req.file ? req.file.path : product.imagenPath;

        const updateData = {
            name,
            description,
            price,
            stock,
            categoryId,
            active,
            offer,
            discount,
            imagenPath,
        };

        await product.update(updateData);

        res.json({ message: 'Producto actualizado exitosamente.', product });
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el producto.' });
    }
};

// --- Eliminar lógicamente un producto ---
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        await product.update({ active: false });

        res.status(200).json({ message: 'Producto eliminado lógicamente (desactivado) exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el producto.' });
    }
};