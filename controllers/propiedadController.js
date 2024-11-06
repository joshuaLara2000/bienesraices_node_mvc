import { unlink } from 'node:fs/promises';
import { validationResult } from 'express-validator'
import {Precio, Categoria, Propiedad, Mensaje, Usuario} from '../models/index.js';
import { esVendedor, formatearFecha } from '../helpers/index.js';

const admin = async (req, res) => {

    // Leer QueryString
    const { pagina: paginaActual } = req.query; 
    
    const expresion = /^[1-9]$/;

    if(!expresion.test(paginaActual)){
        return res.redirect('/mis-propiedades?pagina=1')
    };

    try {
        const { id } = req.usuario;

        // Limites y Offset para el paginador
        const limit = 10;
        const offset = ((paginaActual * limit) - limit);

        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit: limit,   // Esto es algo interno de Node para la paginación
                offset: offset,
                where: {
                    usuarioId: id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'}
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId: id
                }
            })
        ]);

        // console.log(total);

        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            propiedades,
            csrfToken: req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            offset,
            limit
        });
    } catch (error) {
        console.log(error);
    }   
};

// Formulario para crear una nueva propiedad
const crear = async (req, res) => {
    // Consultar Modelo de Preco y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ]);

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    });
};

const guardar = async (req, res) => {
    // Validación
    let resultado = validationResult(req);

    if(!resultado.isEmpty()) {
        // Consultar Modelo de Preco y Categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        console.log(req.body);

        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    };

    // Crear un registro
    
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body;

    const {id: usuarioId} = req.usuario;

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: ''
        });

        const { id } = propiedadGuardada;

        res.redirect(`/propiedades/agregar-imagen/${id}`);

    } catch (error) {
        console.log(error);
    };

};

const agregarImagen = async (req, res) => {

    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    };

    // Válidar que la propiedad no este públicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades');
    };
    
    // Que la propiead pertenece a quien visita esta página
        // console.log(typeof req.usuario.id.toString());
        // console.log(typeof propiedad.usuarioId.toString());

    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades');
    };
    
    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar imagen: ${propiedad.titulo}`,
        propiedad,
        csrfToken: req.csrfToken(),
    });
};

const almacenarImagen = async (req, res, next) => {
    
    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    };

    // Válidar que la propiedad no este públicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades');
    };
    
    // Que la propiead pertenece a quien visita esta página

    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades');
    };

    try {
        // console.log(req.file);

        // Almacenar la imagen y publicar propiedad
        propiedad.imagen = req.file.filename;
        propiedad.publicado = 1;

        await propiedad.save();

        next();

    } catch (error) {
        console.log(error);
    };

};

const editar = async (req, res) => {

    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiead = await Propiedad.findByPk(id);

    if(!propiead){
        return res.redirect('/mis-propiedades');
    };

    // Revisar que quien visita la URL es quien creo la propiedad
    if(propiead.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades');
    };


    // Consultar Modelo de Preco y Categorias
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ]);

    res.render('propiedades/editar', {
        pagina: `Editar Propiedad: ${propiead.titulo}`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiead 
    });
};

const guardarCambios = async (req, res) => {

    // Verificar la validación
    let resultado = validationResult(req);

    if(!resultado.isEmpty()) {
        // Consultar Modelo de Preco y Categorias
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        console.log(req.body);

        return res.render('propiedades/editar', {
            pagina: 'Editar Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body 
        });
    };
    
    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiead = await Propiedad.findByPk(id);

    if(!propiead){
        return res.redirect('/mis-propiedades');
    };

    // Revisar que quien visita la URL es quien creo la propiedad
    if(propiead.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades');
    };

    // Reescribir el objeto y actualizarlo
    
    try {
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body;

        propiead.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId
        });
        
        await propiead.save();

        res.redirect('/mis-propiedades');

    } catch (error) {
        console.log(error);
    }
};

const eliminar = async (req, res) => {

    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    };

    // Revisar que quien visita la URL es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades');
    };

    // Eliminar imagen
    await unlink(`public/uploads/${propiedad.imagen}`);
    console.log(`Se eliminó la imagen - ${propiedad.imagen}`);

    // Eliminar la propiedad
    await propiedad.destroy();
    res.redirect('/mis-propiedades');
};

//Modifica el estado de la propiedad 
const cambiarEstado = async (req, res) => {
    
    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if(!propiedad){
        return res.redirect('/mis-propiedades');
    };

    // Actualizar
    propiedad.publicado = !propiedad.publicado;

    // if(propiedad.publicado){      // Otra forma de hacerlo
    //     propiedad.publicado = 0
    // } else {
    //     propiedad.publicado = 1;
    // }

    await propiedad.save();

    res.json({
        resultado: true
    });
};

// Muestra una prpiedad
const mostrarPropiedad = async (req, res) => {

    const {id} = req.params;
    console.log(req.usuario);
    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'}
        ]
    });

    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404');
    }

    //console.log(esVendedor(req.usuario?.id, propiedad.usuarioId));

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    });
};

const enviarMensaje = async (req, res) => {
    const {id} = req.params;

    // Comprobar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'}
        ]
    });

    if(!propiedad){
        return res.redirect('/404');
    }

    // Renderizar los errores

    let resultado = validationResult(req);

    if(!resultado.isEmpty()) {
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        });
    };

    // Almacenar el mensaje
    
    // console.log(req.body);     // Viene de lo que el usuario ingresa en el formulario
    // console.log(req.params);   // Son los datos de la URL
    // console.log(req.usuario);  // Es la instancia local que creamos para el almacenar el token

    const { mensaje } = req.body;
    const { id: propiedadId} = req.params;
    const { id: usuarioId } = req.usuario;

    await Mensaje.create({
        mensaje: mensaje,
        propiedadId: propiedadId,
        usuarioId: usuarioId
    });

    // res.render('propiedades/mostrar', {
    //     propiedad,
    //     pagina: propiedad.titulo,
    //     csrfToken: req.csrfToken(),
    //     usuario: req.usuario,
    //     esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
    //     enviado: true
    // });

    res.redirect('/');
};

// Leer mensajes recibidos

const verMensajes = async (req, res) => {

    const { id } = req.params;

    // Válidar que la propiedad exista
    const propiead = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes', // Cruzamos propiedad con mensajes
                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'} // Cruzamos mensajes con los usuarios
                ]
            }
        ]
    });

    if(!propiead){
        return res.redirect('/mis-propiedades');
    };

    // Revisar que quien visita la URL es quien creo la propiedad
    if(propiead.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades');
    };

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiead.mensajes,
        formatearFecha: formatearFecha

    });
};


export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
};