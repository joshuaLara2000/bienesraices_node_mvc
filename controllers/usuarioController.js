//   Revisa por un campo en especifico | Mantiene el resultado del a validación
import {check, validationResult} from 'express-validator';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import { generarId, generarJWT } from '../helpers/tokens.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js';

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    });
};

const autenticar = async (req, res) => {
    // Validación 
    await check('email').isEmail().withMessage('El Email es obligatorio').run(req);
    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vácio
    if(!resultado.isEmpty()){
        // Errores
        return res.render('auth/login', {
               pagina: 'Iniciar sesión',
               errores: resultado.array(),
               csrfToken: req.csrfToken()
        });
    };

    const { email, password} = req.body;

    // Comrpobar si el usurio existe
    const usuario = await Usuario.findOne({ where: {email} });

    if(!usuario){
        // Errores
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            errores: [{msg: 'El usuario no existe'}],
            csrfToken: req.csrfToken()
     });
    };

    // Comprobar si el ususrio esta confirmado
    if(!usuario.confirmado){
        // Errores
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}],
            csrfToken: req.csrfToken()
     });
    };

    // Revisar el password
    if(!usuario.verificarPassword(password)){
        // Errores
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            errores: [{msg: 'El Password es incorrecto'}],
            csrfToken: req.csrfToken()
     });
    };

    // Autenticar al usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre });
    
    // Alamacenar en un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        // secure: true,
        // sameSite: true
    }).redirect('/mis-propiedades')

};

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login');
};

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
    });
};

const registrar = async (req, res) => {
    // Vlaidación
    await check('nombre').notEmpty().withMessage('El Nombre no puede ir vácio').run(req);
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req);
    await check('password').isLength({ min: 6 }).withMessage('El Password debe ser de almenos 6 carácteres').run(req);
    await check('repetir_password').equals(req.body.password).withMessage('Los Passwords nos son iguales').run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vácio
    if(!resultado.isEmpty()){
        // Errores
        return res.render('auth/registro', {
               pagina: 'Crear Cuenta',
               errores: resultado.array(),
               usuario: {
                    nombre: req.body.nombre,
                    email: req.body.email
               },
               csrfToken: req.csrfToken()
        });
    };

    // Extraer los datos
    const {nombre, email, password} = req.body;

    // Verificar que el ususario no este duplicado
    const existeUsuario = await Usuario.findOne( { where: { email } } );
    
    if (existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            errores: [{msg: 'El usuario ya está registrado'}],
            usuario: {
                 nombre,
                 email
            },
            csrfToken: req.csrfToken()
     });
    };

    // Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    });

    // Envía email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    });

    // Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de confirmación, presiona en el enlace'
    });

    
};

// Función que comprueba una cuenta
const confirmar = async (req, res) => {

    const {token} = req.params;

    //  Verificar si el token es válido
    const usuario = await Usuario.findOne({ where: {token}});
    
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        });
    };

    // Confirmar la cuenta en caso de que sea correcto
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    // Mostrar la vista de confirmación
    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confrimó correctamente',
        error: false
    })
};

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken: req.csrfToken()
    });
};

const resetPassword = async (req, res) => {
    // Vlaidación
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req);

    let resultado = validationResult(req);
    // console.log(resultado.array());

    // Verificar que el resultado este vácio
    if(!resultado.isEmpty()){
        // Errores
        return res.render('auth/olvide-password', {
               pagina: 'Recupera tu acceso a Bienes Raices',
               errores: resultado.array(),
               csrfToken: req.csrfToken()
        });
    };

    // Buscar el usuario

    const {email} = req.body;

    const usuario = await Usuario.findOne({ where: {email} });

    if(!usuario){
        return res.render('auth/olvide-password', {
            pagina: 'Recupera tu acceso a Bienes Raices',
            errores: [{msg: 'El Email no pertenece a ningún usuario'}],
            csrfToken: req.csrfToken()
     });
    };

    // Generar un Token y envíar el Email
    usuario.token = generarId();
    await usuario.save();

    // Envíar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    });

    // Renderizar un mensaje
    res.render('templates/mensaje', {
        pagina: 'Reestablece tu Password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    });
};

const comprobarToken = async (req, res) => {

    const {token} = req.params;

    const usuario = await Usuario.findOne({ where: {token}});

    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al válidar tu información, intenta de nuevo',
            error: true
        });
    };

    // Mostrar formulario para modificar el Password
    res.render('auth/reset-password', {
        pagina: 'Reestablce Tu Password',
        csrfToken: req.csrfToken()
        
    })
};

const nuevoPassword = async (req, res) => {
    // Válidar el password
    await check('password').isLength({ min: 6 }).withMessage('El Password debe ser de almenos 6 carácteres').run(req);

    let resultado = validationResult(req);

    // Verificar que el resultado este vácio
    if(!resultado.isEmpty()){
        // Errores
        return res.render('auth/reset-password', {
               pagina: 'Reestablece tu Password',
               errores: resultado.array(),
               csrfToken: req.csrfToken()
        });
    };

    const {token} = req.params;
    const {password} = req.body;

    // Identificar quien hace el cambio
    const usuario = await Usuario.findOne({ where: {token} });

    // Hashear el nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    // Renderizar una vista
    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardó correctamente',
        error: false
    });
};


export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
};

