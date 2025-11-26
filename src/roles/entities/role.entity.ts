// Re-export Drizzle types for backward compatibility
import { RoleSelect, RoleInsert } from '../../db/schema/roles';
import { RoleWithRelations } from '../../drizzle/repositories/roles.repository';

// Legacy type alias for backward compatibility
export type Role = RoleWithRelations;
export type { RoleSelect, RoleInsert, RoleWithRelations };