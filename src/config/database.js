const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auth_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to initialize database and create tables
async function initializeDatabase() {
    let connection;
    try {
        // First connect without database to create it if needed
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'auth_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' checked/created`);
        
        // Use the database
        await connection.query(`USE \`${dbName}\``);
        
        // Create users table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME
    )
        `);
        console.log('Users table checked/created');
        
        console.log('✅ Database initialized successfully');
        
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// Export both the pool and initialization function
module.exports = {
    pool,
    initializeDatabase
};