import { Sequelize } from 'sequelize'
import { Precio, Categoria, Propiedad } from '../models/index.js'

const inicio = async (req, res) => {

    const [categorias, precios, casas, departamentos] = await Promise.all([
        Categoria.findAll({raw: true}), // {raw: true} Imprime solo lo necesario de la DB
        Precio.findAll({raw: true}),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 1
            },
            include: [
                {
                    model: Precio, as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: 2
            },
            include: [
                {
                    model: Precio, as: 'precio'
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        })
    ]);
    //console.log(categorias);
    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken()
    })
};

const categoria = async (req, res) => {
    const { id } = req.params;

    // Comprobar que la categoría exista
    const categoria = await Categoria.findByPk(id);

    if(!categoria){
        return res.redirect('/404')
    };

    // Obtener las propiedades de la categoría
    const propiedades = await Propiedad.findAll({
        where: {
            categoriaId: id
        },
        include: [
            {model: Precio, as: 'precio'}
        ]
    });

    res.render('categoria', {
        pagina: `${categoria.nombre}s en venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
};

const noEncontrado = (req, res) => {
    res.render('404', {
        pagina: 'No Encontrada',
        csrfToken: req.csrfToken()
    });
};

const buscador = async (req, res) => {
    const { termino } = req.body;
    
    // Validar que termino no este vácio
    if(!termino.trim()){
        return res.redirect('back')
    };

    // Consultar las propiedades
    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                [Sequelize.Op.like] : '%' + termino + '%'
            }
        },
        include: [
            {model: Precio, as: 'precio'}
        ]
    });

    res.render('busqueda', {
        pagina: 'Resultados de la busqueda',
        propiedades,
        csrfToken: req.csrfToken()
    })

};

export {
    inicio,
    categoria,
    noEncontrado,
    buscador
}