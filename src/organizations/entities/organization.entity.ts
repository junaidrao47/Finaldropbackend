// Re-export Drizzle types for backward compatibility
import { OrganizationSelect, OrganizationInsert } from '../../db/schema/organizations';
import { OrganizationWithRelations } from '../../drizzle/repositories/organizations.repository';

// Legacy type alias for backward compatibility
export type Organization = OrganizationWithRelations;
export type { OrganizationSelect, OrganizationInsert, OrganizationWithRelations };