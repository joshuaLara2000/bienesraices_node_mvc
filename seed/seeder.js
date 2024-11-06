import { exit } from 'node:process';
import categorias from './categorias.js';
import precios from './precios.js';
import usuarios from './usuarios.js';
import db from '../config/db.js';
import { Categoria, Precio, Usuario} from '../models/index.js';

const importarDatos = async () => {
    try{
        // Autenticar
        await db.authenticate();

        // Generar las columnas
        await db.sync();

        // Insertamos lo datos
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ]);

        console.log('Datos importados correctamente...');
        exit();

    } catch (error) {
        console.log(error);
        // process.exit(1); // Sin importar node:process
        exit(1);
    };
};

const eliminarDatos = async () => {
    try {
        // Aquí tenemos que escribir modelo por modelo y es más tardado
        // await Promise.all([
        //     Categoria.destroy({where: {}, truncate: true}),
        //     Precio.destroy({where: {}, truncate: true })
        // ]);

        // Otra forma de hacer lo mismo (Elimina las tablas y luego las vuleve a crear) Esta forma es más corta cuando se tienen muchos modelos
        await db.sync({force: true});

        // console.log('Datos eliminados correctamente...');
        exit();
    } catch (error) {
        console.log(error);
        exit(1);
    };
};

if(process.argv[2] === "-i") {
    importarDatos();
};

if(process.argv[2] === "-e") {
    eliminarDatos();
};

/*  
"db:importar": "node ./seed/seeder.js -i"

Este script que se encuentra en el package.json y que nosotros escribimos, forma parte del process de Node.js,
es decir, que es un proceso de Node.js. 

"argv" Quiere decir "arugumentos". Los argumentos son los que se encuentras después de los dos puntos (node ./seed/seeder.js -i)
y "argv" toma un arreglo, así que comparamos si la segunda posición del arreglo es igual a '-i', que fue lo que nosotros escribimos
en el comando, entonces si es igual se mandará llamar la función que nosotros escribimos.
*/