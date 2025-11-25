import { Injectable } from '@nestjs/common';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class PolicyService {
    private policies: Map<string, Set<string>> = new Map();

    constructor(private readonly rolesService: RolesService) {
        this.initializePolicies();
    }

    private initializePolicies() {
        // Define your policies here
        this.policies.set('admin', new Set(['create', 'read', 'update', 'delete']));
        this.policies.set('user', new Set(['read']));
        this.policies.set('organization_admin', new Set(['create', 'read', 'update']));
    }

    public canPerformAction(role: Role | string, action: string, organization?: Organization): boolean {
        const roleName = typeof role === 'string' ? role : role?.name;
        if (!roleName) return false;
        // Prefer DB-backed permissions if available
        // Synchronously check an in-memory cache first
        const allowedActions = this.policies.get(roleName);
        if (allowedActions && allowedActions.has(action)) return true;

        // If not found in memory, attempt to read role permissions from DB
        // Note: synchronous function signature — use a quick blocking lookup via rolesService (which is async).
        // To keep the signature, we'll attempt to read cached policies only. If DB-backed enforcement is required,
        // consider making this method async and loading role permissions from RolesService.
        if (organization) {
            // Organization-specific logic could be added here.
        }

        return allowedActions ? allowedActions.has(action) : false;
    }

    public isUserAuthorized(user: User, action: string, organization?: Organization): boolean {
                // Support single-role (`user.role`) or array (`user.roles`) shapes
                const rolesArr: string[] = [];
                if ((user as any).role && (user as any).role.name) {
                    rolesArr.push((user as any).role.name);
                }
                if (Array.isArray((user as any).roles)) {
                    rolesArr.push(...(user as any).roles);
                }
                return rolesArr.some(role => this.canPerformAction(role, action, organization));
    }
}