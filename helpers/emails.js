import nodemailer from 'nodemailer';

const emailRegistro = async(datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    
    const {email, nombre, token} = datos;

    // Envíar el email
    await transport.sendMail({
      from: 'BienesRaíces.com',
      to: email,
      subject: 'Confirma tu cuenta en BienesRaíces.com',
      text: 'Confirma tu cuenta en BienesRaíces.com',
      html: `
        <p>Hola ${nombre}, comprueba tu cuenta en BienesRaíces.com</p>

        <p>Tu cuenta ya está lista, solo debes confirmarla en el siguinte enlace:
        <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar cuenta</a> </p> 
         
        <p> Si tu no creaste esta cuenta puedes ignorar el mensaje </p>
      `
    });
};

const emailOlvidePassword = async(datos) => {
  const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  
  const {email, nombre, token} = datos;

  // Envíar el email
  await transport.sendMail({
    from: 'BienesRaíces.com',
    to: email,
    subject: 'Reestablece tu Password en BienesRaíces.com',
    text: 'Reestablece tu Password en BienesRaíces.com',
    html: `
      <p>Hola ${nombre}, has solicitado resstablecer tu Password en BienesRaíces.com</p>

      <p>Sigue el siguiente enlace para generar un Password nuevo:
      <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Reestablecer Password</a></p> 
       
      <p> Si tu no solicitaste el cambio de password, puedes ignorar este mensaje </p>
    `
  });
};

export {
    emailRegistro,
    emailOlvidePassword
};