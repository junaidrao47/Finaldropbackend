import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const email = (loginDto as any).email || (loginDto as any).username;
    const user = await this.validateUserByCredentials(email, loginDto.password);
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findByEmail(payload.email);
  }

  async validateUserByCredentials(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    // NOTE: password comparison is plain-text here. In production use hashed passwords.
    if (user.password !== password) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  // Token helpers used by AuthGuard and controllers
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;
      return this.validateUser(payload as JwtPayload);
    } catch (err) {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string } | null> {
    // For now, treat refresh token as a JWT containing same payload; in production
    // store refresh tokens and validate them.
    try {
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;
      const accessToken = this.jwtService.sign({ email: payload.email, sub: payload.sub });
      return { accessToken };
    } catch (err) {
      return null;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    // No-op placeholder; implement token revocation as needed.
    return { success: true };
  }
}