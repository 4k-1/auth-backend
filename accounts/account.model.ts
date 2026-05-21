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
    passwordHash: {                    // ✅ Keep as passwordHash
      type: DataTypes.STRING,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(10),
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
    acceptTerms: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'User'
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verified: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordReset: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true
    }
  };

  const options = {
    timestamps: false,
    tableName: 'accounts',    // ✅ CHANGE FROM 'users' TO 'accounts'
    defaultScope: {
      attributes: { exclude: ['passwordHash'] }
    },
    scopes: {
      withHash: { attributes: {} }
    }
  };

  return sequelize.define('Account', attributes, options);
}