import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Email, EmailImportance, EmailStatus } from './email.entity';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(Email)
    private readonly emailRepo: Repository<Email>,
  ) {}

  findAll(filters: {
    accountId?: string;
    status?: EmailStatus;
    importance?: string;
  }): Promise<Email[]> {
    const where: Record<string, unknown> = {};
    if (filters.accountId) where['accountId'] = filters.accountId;
    if (filters.status) where['status'] = filters.status;
    if (filters.importance) where['importance'] = filters.importance;

    return this.emailRepo.find({
      where,
      order: { receivedAt: 'DESC' },
      take: 100,
    });
  }

  async findOne(id: string): Promise<Email> {
    const email = await this.emailRepo.findOne({ where: { id } });
    if (!email) throw new NotFoundException(`Email ${id} not found`);
    return email;
  }

  async classify(id: string): Promise<Email> {
    const email = await this.findOne(id);

    // AI classification via Anthropic Claude
    // TODO: inject AnthropicService and call claude here
    // For now, mark as medium importance as placeholder
    email.importance = EmailImportance.MEDIUM;
    email.importanceReason = 'Classification pending Anthropic integration';
    email.classified = true;

    return this.emailRepo.save(email);
  }

  async sync(accountId: string): Promise<{ synced: number }> {
    // TODO: Use Gmail API to fetch new messages for the account
    // Store them, then trigger classification for each
    console.log(`Sync requested for account ${accountId}`);
    return { synced: 0 };
  }

  async updateStatus(id: string, status: EmailStatus): Promise<Email> {
    const email = await this.findOne(id);
    email.status = status;
    return this.emailRepo.save(email);
  }
}
