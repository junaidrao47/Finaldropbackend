import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SwitchOrganizationDto, ForgotPasswordDto, ResetPasswordDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-auth.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user with: firstName, lastName, email, password, phoneNumber
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Login with email/phone and password
   * Supports "Remember me" for extended session
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/social
   * Social login with Google, Facebook, or Apple
   */
  @Post('social')
  @HttpCode(HttpStatus.OK)
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    return this.authService.socialLogin(socialLoginDto);
  }

  /**
   * POST /auth/google
   * Shortcut for Google login
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: { accessToken: string; deviceFingerprint?: string }) {
    return this.authService.socialLogin({
      provider: 'google' as any,
      accessToken: body.accessToken,
      deviceFingerprint: body.deviceFingerprint,
    });
  }

  /**
   * POST /auth/facebook
   * Shortcut for Facebook login
   */
  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  async facebookLogin(@Body() body: { accessToken: string; deviceFingerprint?: string }) {
    return this.authService.socialLogin({
      provider: 'facebook' as any,
      accessToken: body.accessToken,
      deviceFingerprint: body.deviceFingerprint,
    });
  }

  /**
   * POST /auth/apple
   * Shortcut for Apple Sign-In
   */
  @Post('apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() body: { accessToken: string; idToken: string; deviceFingerprint?: string }) {
    return this.authService.socialLogin({
      provider: 'apple' as any,
      accessToken: body.accessToken,
      idToken: body.idToken,
      deviceFingerprint: body.deviceFingerprint,
    });
  }

  /**
   * POST /auth/forgot-password
   * Request password reset link
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * POST /auth/reset-password
   * Reset password with token
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  /**
   * POST /auth/logout
   * Logout current session
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout() {
    return this.authService.logout();
  }

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  /**
   * POST /auth/switch-organization
   * Switch to a different organization (SEC-004)
   */
  @Post('switch-organization')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async switchOrganization(
    @Body() dto: SwitchOrganizationDto,
    @Request() req: any,
  ) {
    return this.authService.switchOrganization(req.user.id, dto.organizationId);
  }

  /**
   * GET /auth/me
   * Get current authenticated user
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Request() req: any) {
    return {
      success: true,
      user: req.user,
    };
  }
}