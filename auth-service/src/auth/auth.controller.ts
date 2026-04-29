import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    if (result.isErr()) {
      const { code, message } = result.error;
      if (code === 'EMAIL_IN_USE') throw new ConflictException(message);
    }
    return result._unsafeUnwrap();
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive access + refresh tokens' })
  @ApiOkResponse({ description: 'Returns access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    if (result.isErr()) throw new UnauthorizedException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and get new token pair' })
  @ApiOkResponse({ description: 'Returns new access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const result = await this.authService.refresh(dto);
    if (result.isErr()) throw new UnauthorizedException(result.error.message);
    return result._unsafeUnwrap();
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    const result = await this.authService.logout(dto);
    return result._unsafeUnwrap();
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user (protected route)' })
  @ApiOkResponse({ description: 'Returns decoded JWT payload' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  getMe(@CurrentUser() user: any) {
    return user;
  }
}
