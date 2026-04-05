import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EmailAccount } from './email-account.entity';
import { AccountProvider } from '@garage/sift/types';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(EmailAccount)
    private readonly accountRepo: Repository<EmailAccount>,
  ) {}

  findAll(): Promise<EmailAccount[]> {
    return this.accountRepo.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<EmailAccount> {
    const account = await this.accountRepo.findOne({
      where: { id, isActive: true },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async create(data: {
    email: string;
    provider: AccountProvider;
    userId: string;
  }): Promise<EmailAccount> {
    const account = this.accountRepo.create(data);
    try {
      return await this.accountRepo.save(account);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { code: string }).code === '23505'
      ) {
        throw new ConflictException(
          `An account for ${data.email} with provider ${data.provider} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create account');
    }
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    account.isActive = false;
    try {
      await this.accountRepo.save(account);
    } catch {
      throw new InternalServerErrorException('Failed to deactivate account');
    }
  }
}
