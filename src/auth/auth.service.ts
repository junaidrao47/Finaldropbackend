import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserWithRelations } from '../drizzle/repositories/users.repository';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserWithRelations> {
    const hashedPassword = await bcrypt.hash(registerDto.password, SALT_ROUNDS);
    return this.usersService.create({ ...registerDto, password: hashedPassword });
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const email = (loginDto as any).email || (loginDto as any).username;
    const user = await this.validateUserByCredentials(email, loginDto.password);
    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_EXPIRES }),
    };
  }

  async validateUser(payload: JwtPayload): Promise<UserWithRelations | null> {
    return this.usersService.findByEmail(payload.email);
  }

  async validateUserByCredentials(email: string, password: string): Promise<UserWithRelations> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  // Token helpers used by AuthGuard and controllers
  async validateToken(token: string): Promise<UserWithRelations | null> {
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