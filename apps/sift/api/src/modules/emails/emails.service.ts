import {
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Email, EmailStatus } from './email.entity';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

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

  async classify(_id: string): Promise<Email> {
    // TODO: Inject AnthropicService and implement Claude classification
    // IMPORTANT: Do NOT set classified=true until real classification is implemented.
    // Pre-marking emails as classified will cause them to be silently skipped
    // when the Anthropic integration is wired in.
    throw new NotImplementedException(
      'Email classification is not yet implemented',
    );
  }

  async sync(_accountId: string): Promise<{ synced: number }> {
    // TODO: Use Gmail API to fetch new messages for the account,
    // store them, then trigger classification for each
    throw new NotImplementedException('Gmail sync is not yet implemented');
  }

  async updateStatus(id: string, status: EmailStatus): Promise<Email> {
    const email = await this.findOne(id);
    email.status = status;
    try {
      return await this.emailRepo.save(email);
    } catch {
      this.logger.error(`Failed to update status for email ${id}`);
      throw new InternalServerErrorException('Failed to update email status');
    }
  }
}
