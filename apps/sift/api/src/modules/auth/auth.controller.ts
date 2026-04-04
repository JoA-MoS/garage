import { Controller, Get, Redirect } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('google')
  @Redirect()
  googleAuth() {
    // TODO: Redirect to Google OAuth consent screen
    // Implement with @nestjs/passport + passport-google-oauth20
    return { url: '/api/auth/google/callback' };
  }

  @Get('google/callback')
  googleCallback() {
    // TODO: Handle OAuth callback, issue JWT
    return { message: 'Google OAuth callback — implement with Passport.js' };
  }

  @Get('me')
  getMe() {
    // TODO: Return current user from JWT
    return { message: 'Implement with JWT guard' };
  }
}
