const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool with SSL for freesqldatabase.com
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'auth_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Add SSL for freesqldatabase.com (required for external connections)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false  // For freesqldatabase.com
    } : false,
    // Add connection timeout
    connectTimeout: 30000,
    // Enable keep-alive
    enableKeepAlive: true
});

// Function to initialize database and create tables
async function initializeDatabase() {
    let connection;
    try {
        console.log('📡 Attempting to connect to database...');
        console.log(`Host: ${process.env.DB_HOST}`);
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        
        // Create connection config for initial connection
        const connectionConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            connectTimeout: 30000
        };
        
        // Add SSL for production
        if (process.env.NODE_ENV === 'production') {
            connectionConfig.ssl = { rejectUnauthorized: false };
        }
        
        // First connect without database to create it if needed
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'auth_db';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' checked/created`);
        
        // Use the database
        await connection.query(`USE \`${dbName}\``);
        console.log(`✅ Using database '${dbName}'`);
        
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
        console.error('Error details:', error.message);
        throw error;
    } finally {
        if (connection) await connection.end();
    }
}

// Test connection function
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database pool connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database pool connection failed:', error);
        return false;
    }
}

// Export both the pool and initialization function
module.exports = {
    pool,
    initializeDatabase,
    testConnection
};