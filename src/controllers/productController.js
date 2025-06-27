import { Product, Category } from '../models/index.js'; // Importa los modelos Product y Category desde index.js
import { Op } from 'sequelize'; // Necesario para operadores de Sequelize como `Op.or` para la búsqueda

// --- Obtener todos los productos (Público y Admin) ---
export const getProducts = async (req, res) => {
    try {
        const { name, category, limit = 10, offset = 0 } = req.query; // Para búsqueda y paginación
        let whereClause = { active: true }; // Por defecto, solo mostrar productos activos

        // Filtrar por nombre o categoría (HU1.3)
        if (name) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${name}%` } }, // Búsqueda insensible a mayúsculas/minúsculas para nombre
            ];
        }
        if (category) {
            // 'category' es el ID de la categoría para un filtro exacto
            whereClause.categoryId = category;
        }

        const products = await Product.findAll({
            where: whereClause,
            limit: parseInt(limit), // Convertir a entero para paginación
            offset: parseInt(offset), // Convertir a entero para paginación
            order: [['name', 'ASC']], // Ordenamiento predeterminado (HU1.1.4)
            include: [{ // Incluir la categoría para mostrar su nombre
                model: Category,
                as: 'category',
                attributes: ['name']
            }]
        });

        // HU1.1.3: Si no hay stock, esto ya se refleja en la `stock` del objeto producto.
        // La visualización 'sin stock' se manejaría en el frontend.

        // Manejo de "Sin Resultados" (HU1.3.3)
        if (products.length === 0 && (name || category)) {
            return res.status(200).json({ message: 'No se encontraron productos para tu búsqueda o filtros aplicados.' });
        }

        res.json(products);
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

//Crear un nuevo producto (Solo Admin) (HU4.1) (no probado, no tengo front de admin)
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, imagenURL, categoryId } = req.body;

        // Validaciones básicas (HU4.1.3)
        if (!name || !description || !price || stock === undefined || !imagenURL || !categoryId) {
            return res.status(400).json({ message: 'Todos los campos (nombre, descripción, precio, stock, imageURL, categoryId) son obligatorios.' });
        }
        if (price <= 0 || stock < 0) {
            return res.status(400).json({ message: 'Precio debe ser mayor a 0 y stock no puede ser negativo.' });
        }
        if (descuento < 0 || descuento > 100) {
            return res.status(400).json({ message: 'El descuento debe ser un valor entre 0 y 100.' });
        }
        // Verificar si la categoría existe (opcional, pero buena práctica)
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
            active: true, // Por defecto activo al crearlo (HU4.1.5)
            ofert,
            discount
        });

        res.status(201).json({ message: 'Producto creado exitosamente.', product: newProduct }); // HU4.1.6

    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el producto.' });
    }
};

// Actualizar un producto existente (Solo Admin) (HU4.1) (no probado, no tengo front de admin)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, imagenURL, categoryId, active } = req.body;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        // Validaciones para los campos actualizados (HU4.1.4)
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

        // Actualizar solo los campos que se proporcionen en el body
        await product.update({
            name: name !== undefined ? name : product.name,
            description: description !== undefined ? description : product.description,
            price: price !== undefined ? price : product.price,
            stock: stock !== undefined ? stock : product.stock,
            imagenURL: imagenURL !== undefined ? imagenURL : product.imagenURL,
            categoryId: categoryId !== undefined ? categoryId : product.categoryId,
            active: active !== undefined ? active : product.active, // Permite activar/desactivar (eliminación lógica)
        });

        res.json({ message: 'Producto actualizado exitosamente.', product }); // HU4.1.6

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
};
