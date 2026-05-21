import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import accountModel from '../accounts/account.model';
import refreshTokenModel from '../accounts/refresh-token.model';

const db: any = {};
export default db;

type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required for database configuration.`);
  }
  return value;
}

async function getDbConfig(): Promise<DbConfig> {
  if (process.env.NODE_ENV === 'production') {
    return {
      host: requiredEnv('DB_HOST'),
      port: parseInt(process.env.DB_PORT || '3306'),
      user: requiredEnv('DB_USER'),
      password: requiredEnv('DB_PASSWORD'),
      database: requiredEnv('DB_NAME')
    };
  }
  const config = await import('../config.json');
  return config.default.database as DbConfig;
}

async function initialize() {
  try {
    const { host, port, user, password, database } = await getDbConfig();

    console.log(`📡 Connecting to: ${host}:${port}/${database}`);

    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await connection.end();

    const sequelize = new Sequelize(database, user, password, {
      dialect: 'mysql',
      host,
      port,
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
    });

    await sequelize.authenticate();
    console.log('✅ Database connected');

    db.Account = accountModel(sequelize);
    db.RefreshToken = refreshTokenModel(sequelize);

    db.Account.hasMany(db.RefreshToken, { foreignKey: 'accountId', onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account, { foreignKey: 'accountId' });

    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Models synced');

  } catch (error) {
    console.error('❌ Database init failed:', error);
    throw error;
  }
}

initialize().catch(console.error);