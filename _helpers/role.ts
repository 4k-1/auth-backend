const Role = {
  Admin: 'Admin',
  User: 'User'
} as const;

export default Role;
export type RoleType = typeof Role[keyof typeof Role];