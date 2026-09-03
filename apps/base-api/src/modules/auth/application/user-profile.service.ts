import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedUser } from '@app/common';
import { RbacService } from '../../rbac/application/rbac.service.js';
import {
  FILE_STORAGE,
  type IFileStorageService,
} from '../../storage/domain/storage.service.interface.js';
import {
  extensionForMimeType,
} from '../../tenant/application/asset-upload.validation.js';
import type { UploadedAssetFile } from '../../tenant/application/uploaded-asset-file.js';
import { USER_REPOSITORY } from '../../user/domain/user.repository.interface.js';
import type { IUserRepository } from '../../user/domain/user.repository.interface.js';
import type { ChangePasswordDto, UpdateUserProfileDto } from '../../user/application/dto/user-profile.dto.js';
import { UserVerificationService } from './user-verification.service.js';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

@Injectable()
export class UserProfileService {
  constructor(
    private readonly config: ConfigService,
    private readonly rbacService: RbacService,
    private readonly verificationService: UserVerificationService,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(FILE_STORAGE) private readonly storage: IFileStorageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user?.id) {
      throw new NotFoundException('User not found');
    }

    const access = await this.rbacService.getUserAccess(userId);
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified ?? false,
      status: user.status,
      avatarUrl: user.avatarUrl ? await this.storage.resolveUrl(user.avatarUrl) : undefined,
      roles: access.roles,
      permissions: access.permissions,
    };
  }

  async updateProfile(user: AuthenticatedUser, dto: UpdateUserProfileDto) {
    const existing = await this.userRepository.findById(user.userId);
    if (!existing?.id) {
      throw new NotFoundException('User not found');
    }

    const updates: { fullName?: string; email?: string; emailVerified?: boolean } = {};

    if (dto.fullName !== undefined) {
      updates.fullName = dto.fullName.trim();
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();
      if (email !== existing.email) {
        const taken = await this.userRepository.findByEmail(email);
        if (taken && taken.id !== existing.id) {
          throw new ConflictException('Email is already registered');
        }
        updates.email = email;
        updates.emailVerified = false;
      }
    }

    if (Object.keys(updates).length === 0) {
      return this.getProfile(user.userId);
    }

    const updated = await this.userRepository.update(existing.id, updates);

    if (updates.emailVerified === false) {
      await this.verificationService.issueEmailVerificationForUser(updated.id!);
    }

    return this.getProfile(user.userId);
  }

  async uploadAvatar(userId: string, file: UploadedAssetFile | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }

    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed');
    }

    const maxBytes = this.config.get<number>('storage.upload.maxImageBytes', 5_242_880);
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.round(maxBytes / (1024 * 1024))}MB`,
      );
    }

    const existing = await this.userRepository.findById(userId);
    if (!existing?.id) {
      throw new NotFoundException('User not found');
    }

    const extension = extensionForMimeType(file.mimetype);
    const objectKey = `users/${userId}/avatar/${randomUUID()}.${extension}`;

    await this.storage.upload({
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    if (existing.avatarUrl) {
      const oldKey = this.storage.extractKey(existing.avatarUrl);
      if (oldKey) {
        await this.storage.delete(oldKey).catch(() => undefined);
      }
    }

    await this.userRepository.update(userId, { avatarUrl: objectKey });

    return this.getProfile(userId);
  }

  async removeAvatar(userId: string) {
    const existing = await this.userRepository.findById(userId);
    if (!existing?.id) {
      throw new NotFoundException('User not found');
    }

    if (existing.avatarUrl) {
      const key = this.storage.extractKey(existing.avatarUrl);
      if (key) {
        await this.storage.delete(key).catch(() => undefined);
      }
      await this.userRepository.update(userId, { avatarUrl: null });
    }

    return this.getProfile(userId);
  }

  changePassword(userId: string, dto: ChangePasswordDto) {
    return this.verificationService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
