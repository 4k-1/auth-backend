import { DataTypes } from 'sequelize';

export default function model(sequelize: any) {
  const attributes = {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: { 
      type: DataTypes.STRING 
    },
    accountId: {  // ✅ ADD THIS - required for foreign key
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'account_id'  // Map to snake_case column in database
    },
    expires: { 
      type: DataTypes.DATE 
    },
    created: { 
      type: DataTypes.DATE, 
      allowNull: false, 
      defaultValue: DataTypes.NOW,
      field: 'created_at'  // Map to snake_case
    },
    createdByIp: { 
      type: DataTypes.STRING,
      field: 'created_by_ip' 
    },
    revoked: { 
      type: DataTypes.DATE 
    },
    revokedByIp: { 
      type: DataTypes.STRING,
      field: 'revoked_by_ip' 
    },
    replacedByToken: { 
      type: DataTypes.STRING,
      field: 'replaced_by_token' 
    },
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
    tableName: 'refresh_tokens'  // ✅ ADD THIS - matches your database table name
  };
  
  return sequelize.define('RefreshToken', attributes, options);
}