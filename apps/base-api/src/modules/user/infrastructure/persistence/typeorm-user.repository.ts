import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/user.repository.interface.js';
import { UserProps } from '../../domain/user.types.js';
import { UserEntity } from './user.entity.js';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserProps | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<UserProps | null> {
    const entity = await this.repository.findOne({
      where: { email: email.toLowerCase() },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(props: UserProps): Promise<UserProps> {
    const entity = this.repository.create({
      email: props.email.toLowerCase(),
      passwordHash: props.passwordHash,
      emailVerified: props.emailVerified ?? false,
      fullName: props.fullName,
      status: props.status,
    });
    const saved = await this.repository.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, props: Partial<UserProps>): Promise<UserProps> {
    await this.repository.update(id, {
      passwordHash: props.passwordHash,
      emailVerified: props.emailVerified,
      fullName: props.fullName,
      status: props.status,
    });
    const updated = await this.repository.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  private toDomain(entity: UserEntity): UserProps {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      emailVerified: entity.emailVerified,
      fullName: entity.fullName,
      status: entity.status,
    };
  }
}
