export interface JwtPayload {
  email: string;
  sub: number; // User ID
  organizationId?: number; // Current organization context
  warehouseId?: number; // Current warehouse context (for multi-warehouse orgs)
}
