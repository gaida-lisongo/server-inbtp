const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    constructor(user) {
        this.username = user.username;
        this.email = user.email;
        this.password = user.password;
        this.role = user.role;
    }

    static async create(newUser) {
        const hashedPassword = await bcrypt.hash(newUser.password, 8);
        const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        const connection = await pool.getConnection();
        
        try {
            const [result] = await connection.execute(sql, [
                newUser.username,
                newUser.email,
                hashedPassword,
                newUser.role
            ]);
            return result;
        } finally {
            connection.release();
        }
    }

    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const connection = await pool.getConnection();
        
        try {
            const [rows] = await connection.execute(sql, [email]);
            return rows[0];
        } finally {
            connection.release();
        }
    }
}

module.exports = User;
