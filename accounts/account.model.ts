import { DataTypes } from 'sequelize';

export default function model(sequelize: any) {
  const attributes = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {                    // ✅ Changed from passwordHash to password
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'User'
    },
    verificationToken: {
      type: DataTypes.STRING
    },
    verified: {
      type: DataTypes.DATE
    },
    resetToken: {
      type: DataTypes.STRING
    },
    resetTokenExpires: {
      type: DataTypes.DATE
    },
    passwordReset: {
      type: DataTypes.DATE
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated: {
      type: DataTypes.DATE
    }
  };

  const options = {
    timestamps: false,
    tableName: 'users'
  };

  return sequelize.define('Account', attributes, options);
}