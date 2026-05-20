const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool - NO SSL for freesqldatabase.com
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auth_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 30000,
    enableKeepAlive: true,
});

async function initializeDatabase() {
    let connection;
    try {
        console.log('📡 Attempting to connect to database...');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Database: ${process.env.DB_NAME}`);
        
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            connectTimeout: 30000
        };
        
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to MySQL server');

        const dbName = process.env.DB_NAME || 'auth_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' checked/created`);
        
        await connection.query(`USE \`${dbName}\``);
        
        // Create users table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(10),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            is_verified BOOLEAN DEFAULT FALSE,
            verification_token TEXT,
            reset_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME
          )
        `);
        console.log('✅ Users table checked/created');
        
        // Create refresh_tokens table
        await connection.query(`
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            account_id INT NOT NULL,
            token VARCHAR(500) NOT NULL UNIQUE,
            expires DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            revoked_at DATETIME NULL,
            replaced_by_token VARCHAR(500),
            FOREIGN KEY (account_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
        console.log('✅ Refresh tokens table checked/created');
        
        console.log('✅ Database initialized successfully');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

module.exports = {
    pool,
    initializeDatabase
};