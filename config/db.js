import Sequelize from "sequelize";
import dotenv from 'dotenv';
dotenv.config({path: '.env'});

                        // Base de datos         nombre de usuario     password               objeto de configuración
const db = new Sequelize(process.env.DB_NOMBRE, process.env.DB_USER, process.env.DB_PASS ?? '', {
    host: process.env.DB_HOST,
    port: 3306,
    dialect: 'mysql',
    define: {
        timestamp: true // Cuando un usuario se registra agrega dos columnas extras a la tabla de usuario (cuando fue creado/actualizado)
    },
    pool: { // Configura como va a ser el comportamiento para conexiones nuevas o existentes
        max: 5, // Máximo de conexiones de mantener
        min: 0, // Minimo de concexiones a mantener
        acquire: 30000, // Los segundos que va a pasar tratando de elaborar una conexión antes de marcar un error
        idle: 10000 // Los segundos en lo que ve que no hay nada de movimiento, si no hay visitas da 10s para que la conexión finalice
    },
    operatorAliases: false // Era algo que se utlizaba hace tiempo, pero ya no se usan, pero para asegurar que no los use, lo marcamos como false
});

export default db;
