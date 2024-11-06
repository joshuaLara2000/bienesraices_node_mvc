import bcrypt from 'bcrypt';

const usuarios = [
    {
        nombre: 'Joshua',
        email: 'joshua@joshua.com',
        confirmado: 1,
        password: bcrypt.hashSync('1234567', 10)
    }
];

export default usuarios;