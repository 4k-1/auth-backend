import { DataTypes } from 'sequelize';

export default function model(sequelize: any) {
  const attributes = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'account_id'  // ✅ matches your column
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'  // ✅ matches your column
    },
    revoked: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'  // ✅ matches your column
    },
    replacedByToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'replaced_by_token'  // ✅ matches your column
    },
    // Virtual fields (not in database)
    isExpired: {
      type: DataTypes.VIRTUAL,
      get(this: any) {
        return Date.now() >= new Date(this.expires).getTime();
      }
    },
    isActive: {
      type: DataTypes.VIRTUAL,
      get(this: any) {
        return !this.revoked && !this.isExpired;
      }
    }
  };
  
  const options = {
    timestamps: false,
    tableName: 'refresh_tokens'  // ✅ matches your table name
  };
  
  return sequelize.define('RefreshToken', attributes, options);
}