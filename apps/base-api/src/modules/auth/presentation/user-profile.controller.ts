import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, type AuthenticatedUser } from '@app/common';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  UpdateUserProfileDto,
  UploadUserAvatarDto,
  UserProfileResponseDto,
} from '../../user/application/dto/user-profile.dto.js';
import type { UploadedAssetFile } from '../../tenant/application/uploaded-asset-file.js';
import { UserProfileService } from '../application/user-profile.service.js';

@ApiTags('User Profile')
@ApiBearerAuth()
@Controller('user/me')
export class UserProfileController {
  constructor(private readonly profileService: UserProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user.userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserProfileDto) {
    return this.profileService.updateProfile(user, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadUserAvatarDto })
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedAssetFile,
  ) {
    return this.profileService.uploadAvatar(user.userId, file);
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  removeAvatar(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.removeAvatar(user.userId);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for the current user' })
  @ApiOkResponse({ type: ChangePasswordResponseDto })
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(user.userId, dto);
  }
}
