// Re-export Drizzle types for backward compatibility
import { UserSelect, UserInsert } from '../../db/schema/users';
import { UserWithRelations } from '../../drizzle/repositories/users.repository';

// Legacy type alias for backward compatibility
export type User = UserWithRelations;
export type { UserSelect, UserInsert, UserWithRelations };