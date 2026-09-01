import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@app/common';
import { AuthService } from '../application/auth.service.js';
import { AuthTokenResponseDto, LoginDto, RegisterDto } from '../application/dto/auth.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register platform user' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT' })
  @ApiCreatedResponse({ type: AuthTokenResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
