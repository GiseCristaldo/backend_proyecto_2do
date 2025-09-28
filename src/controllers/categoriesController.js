import { Category } from '../models/index.js';

//Obtener todas las categorias activas

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({where: {active: true}});
        res.json(categories);
    } catch (error) {
        console.error('Error al obtener las categorías:', error);
        res.status(500).json({nessage: 'Error al obtener las categorias'});
    }
};

//Obtener categorias por ID

export const getCategoriesById = async (req, res) => {
    try {
        const {id} = req.params;
        const category = await Category.findByPk(id);
        if(!category) {
            return res.status(404).json({message: 'Categoria no encontrada'});
        }
        res.json(category);
    } catch (error) {
    console.error('Error al obtener la categoría:', error);
    res.status(500).json({ message: 'Error al obtener la categoría' });
  }
};

//Crear una categoria

  export const createCategory = async (req, res) => {
    try {
        const { name, imagenURL } = req.body;
        
        // Si no se proporciona imagenURL, usar una URL por defecto
        const imageUrl = imagenURL || 'https://via.placeholder.com/200x200?text=Categoria';
        
        const newCategory = await Category.create({ 
          name, 
          imagenURL: imageUrl 
        });
        
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error al crear la categoría:', error);
        res.status(500).json({ message: 'Error al crear la categoría' });
    }
  };

  //Actualizar una categoria
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, imagenURL, active } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        category.name = name || category.name;
        category.imagenURL = imagenURL || category.imagenURL;
        category.active = active !== undefined ? active : category.active;

        await category.save();
        res.json(category);
    } catch (error) {
        console.error('Error al actualizar la categoría:', error);
        res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
};
