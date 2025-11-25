import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // If no roles are required, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user; // Assuming user is attached to the request

    // Support single-role users stored as `role: Role` on the User entity
    if (!user || (!(user as any).role && !(user as any).roles)) {
      throw new ForbiddenException('Access denied. User not found or roles not assigned.');
    }

    const userRoles: string[] = [];
    if ((user as any).role && (user as any).role.name) {
      userRoles.push((user as any).role.name);
    }
    if (Array.isArray((user as any).roles)) {
      userRoles.push(...(user as any).roles);
    }

    const hasRole = userRoles.some(role => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Access denied. Insufficient permissions.');
    }

    return true;
  }
}