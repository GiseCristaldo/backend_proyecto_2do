import { Product, Category } from '../models/index.js'; // Importa los modelos Product y Category desde index.js
import { Op } from 'sequelize'; // Necesario para operadores de Sequelize como `Op.or` para la búsqueda

// --- Obtener todos los productos (Público y Admin) ---
export const getProducts = async (req, res) => {
    try {
        const { name, category, page= 1 , limit = 10 } = req.query; // Para búsqueda y paginación
        const offset = (page - 1) * limit; // Cálculo del offset para paginación
        let whereClause = { active: true }; // Por defecto, solo mostrar productos activos

        // Filtrar por nombre o categoría (HU1.3)
        if (name) {
            whereClause.name = { [Op.like]: `%${name}%` };
        }
        if (category) {
            whereClause.categoryId = category;
        }

 // Usamos findAndCountAll para la paginación
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

        const totalPages = Math.ceil(count / limit);

        res.json({
            products: rows,
            totalItems: count,
            totalPages: totalPages,
            currentPage: parseInt(page),
        });

    } catch (error) {

        console.error('Error al obtener los productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los productos.' });
    }
};

// Obtener Detalle de un Producto por ID (Público y Admin) (HU1.2)
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id, {
            include: [{ // Incluir la categoría para mostrar su nombre en el detalle
                model: Category,
                as: 'category',
                attributes: ['name']
            }]
        });

        // HU1.2.3: Manejo de Producto No Encontrado
        if (!product || !product.active) { // También verifica si está activo para el público
            return res.status(404).json({ message: 'Producto no encontrado o no disponible.' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error al obtener el producto por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el producto.' });
    }
};


//Crear un nuevo producto (Solo Admin) (HU4.1)
export const createProduct = async (req, res) => {
    try {
        // Añadimos ofert y discount
        const { name, description, price, stock, imagenURL, categoryId, ofert, discount } = req.body;

        // Validaciones básicas
        if (!name || !description || !price || stock === undefined || !imagenURL || !categoryId) {
            return res.status(400).json({ message: 'Todos los campos (nombre, descripción, precio, stock, imageURL, categoryId) son obligatorios.' });
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
            imagenURL,
            categoryId,
            active: true,
            ofert: ofert || false,
            discount: discount || 0
        });

        res.status(201).json({ message: 'Producto creado exitosamente.', product: newProduct });

    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el producto.' });
    }
};

// Actualizar un producto existente (Solo Admin) (HU4.1)
export const updateProduct = async (req, res) => {
    try {
         const { id } = req.params;
        
        // --- CORRECCIÓN ---
        // 1. Desestructuramos explícitamente TODOS los campos que esperamos del body.
        const { name, description, price, stock, imagenURL, categoryId, active, ofert, discount } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // (Las validaciones existentes están bien y pueden quedarse)
        if (price !== undefined && price <= 0) {
            return res.status(400).json({ message: 'Precio debe ser mayor a 0.' });
        }
        if (stock !== undefined && stock < 0) {
            return res.status(400).json({ message: 'Stock no puede ser negativo.' });
        }
        if (discount !== undefined && (discount < 0 || discount > 100)) {
            return res.status(400).json({ message: 'El descuento debe ser un valor entre 0 y 100.' });
        }
        if (categoryId !== undefined) {
            const categoryExists = await Category.findByPk(categoryId);
            if (!categoryExists) {
                return res.status(400).json({ message: 'La categoría especificada no existe.' });
            }
        }

        // 2. Creamos un objeto 'updateData' solo con los campos que nos interesan.
        //    Esto evita que cualquier campo extra en req.body cause problemas.
        const updateData = {
            name,
            description,
            price,
            stock,
            imagenURL,
            categoryId,
            active,
            ofert,
            discount
        };

        // 3. Usamos este objeto limpio y seguro para la actualización.
        await product.update(updateData);

        res.json({ message: 'Producto actualizado exitosamente.', product });

    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar el producto.' });
    }

};


//Eliminar lógicamente un producto (Solo Admin) (HU4.1)(no probado, no tengo front de admin)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // HU4.1.5: Eliminación lógica (cambiar 'active' a false)
        await product.update({ active: false });

        res.status(200).json({ message: 'Producto eliminado lógicamente (desactivado) exitosamente.' }); // HU4.1.6

    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar el producto.' });
    }
}
