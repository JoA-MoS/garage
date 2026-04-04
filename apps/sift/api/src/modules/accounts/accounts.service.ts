import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAccount, AccountProvider } from './email-account.entity';

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
    const account = await this.accountRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  create(data: { email: string; provider: string; userId: string }): Promise<EmailAccount> {
    const account = this.accountRepo.create({
      email: data.email,
      provider: (data.provider as AccountProvider) ?? AccountProvider.GMAIL,
      userId: data.userId,
    });
    return this.accountRepo.save(account);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    account.isActive = false;
    await this.accountRepo.save(account);
  }
}
