import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

// Try to load .env from multiple possible locations
const possiblePaths = [
  path.resolve(__dirname, '../.env'),      // When running from dist/
  path.resolve(process.cwd(), '.env'),     // When running from root
  path.resolve(__dirname, '../../.env'),   // One level up
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ No .env file found, using existing environment variables');
}

console.log('📁 Database configuration:');
console.log('   DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('   DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('   DB_NAME:', process.env.DB_NAME || 'NOT SET');

const db: any = {};
export default db;

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

async function getDbConfig() {
  // First try environment variables
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    console.log('✅ Using database config from environment variables');
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
  }
  
  // Fallback to config.json
  try {
    const configPath = path.resolve(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ Using database config from config.json');
      return config.database;
    }
  } catch (error) {
    console.error('Failed to load config.json:', error);
  }
  
  throw new Error('No database configuration found. Please set environment variables or create config.json');
}

async function initialize() {
  try {
    const { host, port, user, password, database } = await getDbConfig();
    
    console.log(`📡 Connecting to: ${host}:${port}/${database}`);
    
    // Create connection without database selected
    const connection = await mysql.createConnection({ 
      host, 
      port, 
      user, 
      password,
      connectTimeout: 30000
    });
    
    // Create DB if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`✅ Database '${database}' checked/created`);
    
    await connection.end();
    
    // Connect to DB with Sequelize
    const sequelize = new Sequelize(database, user, password, {
      dialect: 'mysql',
      host,
      port,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Init models
    db.Account = accountModel(sequelize);
    db.RefreshToken = refreshTokenModel(sequelize);
    
    // Define relationships
    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });
    
    // Sync models with database
    const alterDb = process.env.NODE_ENV !== 'production';
    await sequelize.sync({ alter: alterDb });
    console.log('✅ Database models synced');
    
  } catch (error) {
    console.error('❌ Database init failed:', error);
    throw error;
  }
}

// Initialize the database
initialize().catch(console.error);