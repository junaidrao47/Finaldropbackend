// Re-export Drizzle types for backward compatibility
import { MembershipSelect, MembershipInsert } from '../db/schema/memberships';
import { MembershipWithRelations } from '../drizzle/repositories/memberships.repository';

// Legacy type alias for backward compatibility
export type Membership = MembershipWithRelations;
export type { MembershipSelect, MembershipInsert, MembershipWithRelations };
