export class CreateUserDto {
  username: string;
  password: string;
  email: string;
  organizationId?: string;
  role?: string;
}