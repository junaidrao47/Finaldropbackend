export class LoginDto {
  // support either username or email for legacy reasons
  username?: string;
  email?: string;
  password: string;
}