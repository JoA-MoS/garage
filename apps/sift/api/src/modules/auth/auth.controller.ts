import { Controller, Get, NotImplementedException } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('google')
  googleAuth() {
    // TODO: Implement with @nestjs/passport + passport-google-oauth20
    // Redirect to Google OAuth consent screen
    throw new NotImplementedException('Google OAuth is not yet implemented');
  }

  @Get('google/callback')
  googleCallback() {
    // TODO: Handle OAuth callback, issue JWT
    throw new NotImplementedException(
      'Google OAuth callback is not yet implemented',
    );
  }

  @Get('me')
  getMe() {
    // TODO: Protect with JWT guard and return current user
    throw new NotImplementedException('Auth is not yet implemented');
  }
}
