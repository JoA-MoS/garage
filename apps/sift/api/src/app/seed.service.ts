import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import {
  AccountProvider,
  EmailImportance,
  EmailStatus,
} from '@garage/sift/types';

import { Email } from '../modules/emails/email.entity';
import { EmailAccount } from '../modules/accounts/email-account.entity';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

const MOCK_ACCOUNT = {
  userId: DEV_USER_ID,
  email: 'dev@example.com',
  provider: AccountProvider.GMAIL,
  displayName: 'Dev User',
  isActive: true,
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

const MOCK_EMAILS = (accountId: string): DeepPartial<Email>[] => [
  {
    accountId,
    gmailMessageId: 'mock-001',
    subject: 'School field trip permission slip due Friday',
    fromAddress: 'teacher@lincolnelementary.edu',
    fromName: 'Mrs. Johnson',
    bodySnippet:
      'Please return the signed permission slip by Friday for the upcoming Natural History Museum visit. Students should bring a bag lunch and wear comfortable shoes.',
    receivedAt: hoursAgo(2),
    importance: EmailImportance.HIGH,
    importanceReason: 'Time-sensitive action required by Friday',
    status: EmailStatus.UNREAD,
    classified: true,
    actionItems: [
      {
        description: 'Sign and return permission slip by Friday',
        completed: false,
      },
    ],
  },
  {
    accountId,
    gmailMessageId: 'mock-002',
    subject: 'Soccer practice cancelled tomorrow',
    fromAddress: 'coach@sunrisesoccerclub.com',
    fromName: 'Coach Martinez',
    bodySnippet:
      'Due to the weather forecast, practice scheduled for Tuesday is cancelled. Next session is Monday at the usual time. Please confirm you received this message.',
    receivedAt: hoursAgo(6),
    importance: EmailImportance.MEDIUM,
    importanceReason: 'Schedule change requiring acknowledgement',
    status: EmailStatus.UNREAD,
    classified: true,
    actionItems: [
      {
        description: 'Reply to coach confirming attendance Monday',
        completed: false,
      },
    ],
  },
  {
    accountId,
    gmailMessageId: 'mock-003',
    subject: 'Your Amazon order has shipped',
    fromAddress: 'shipment-tracking@amazon.com',
    fromName: 'Amazon',
    bodySnippet:
      'Your package is on its way! Estimated delivery: Thursday by 8pm. Track your shipment in the Amazon app.',
    receivedAt: hoursAgo(4),
    importance: EmailImportance.LOW,
    importanceReason: 'Informational shipping notification, no action needed',
    status: EmailStatus.READ,
    classified: true,
    actionItems: [],
  },
  {
    accountId,
    gmailMessageId: 'mock-004',
    subject: 'Dentist appointment reminder — April 9th at 2:00 PM',
    fromAddress: 'reminders@brightsmiledental.com',
    fromName: 'Bright Smile Dental',
    bodySnippet:
      'This is a reminder for your upcoming appointment on Wednesday, April 9th at 2:00 PM. Reply CONFIRM to confirm or CANCEL to cancel.',
    receivedAt: daysAgo(1),
    importance: EmailImportance.HIGH,
    importanceReason: 'Appointment confirmation required',
    status: EmailStatus.UNREAD,
    classified: true,
    actionItems: [
      {
        description: 'Confirm or cancel dentist appointment for April 9th',
        completed: false,
      },
    ],
  },
  {
    accountId,
    gmailMessageId: 'mock-005',
    subject: 'HOA Newsletter — April 2026',
    fromAddress: 'newsletter@oakhillshoa.org',
    fromName: 'Oak Hills HOA',
    bodySnippet:
      'Welcome to the April edition of the Oak Hills community newsletter. This month: spring landscaping tips, pool opening schedule, and the annual block party date announcement.',
    receivedAt: daysAgo(2),
    importance: EmailImportance.LOW,
    importanceReason: 'General newsletter, no personal action required',
    status: EmailStatus.READ,
    classified: true,
    actionItems: [],
  },
  {
    accountId,
    gmailMessageId: 'mock-006',
    subject: 'Re: Vacation rental — availability question',
    fromAddress: 'host@coastalretreat.com',
    fromName: 'Coastal Retreat',
    bodySnippet:
      'Hi! Thanks for your inquiry. The beachhouse is available July 4–11. The rate is $250/night with a 3-night minimum. Let me know if you want to proceed with a reservation.',
    receivedAt: daysAgo(1),
    importance: EmailImportance.MEDIUM,
    importanceReason: 'Awaiting decision on vacation booking',
    status: EmailStatus.UNREAD,
    classified: true,
    actionItems: [
      {
        description: 'Decide on beach house rental and reply to host',
        completed: false,
      },
    ],
  },
  {
    accountId,
    gmailMessageId: 'mock-007',
    subject: 'New login from Chrome on macOS',
    fromAddress: 'security-noreply@google.com',
    fromName: 'Google',
    bodySnippet:
      'We noticed a new sign-in to your Google Account from Chrome on macOS. If this was you, no action is needed. If not, secure your account immediately.',
    receivedAt: hoursAgo(1),
    importance: EmailImportance.MEDIUM,
    importanceReason: 'Security notification worth reviewing',
    status: EmailStatus.UNREAD,
    classified: true,
    actionItems: [
      {
        description: 'Review Google security notification and verify sign-in',
        completed: false,
      },
    ],
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Email)
    private readonly emailRepo: Repository<Email>,
    @InjectRepository(EmailAccount)
    private readonly accountRepo: Repository<EmailAccount>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('NODE_ENV') === 'production') return;

    const existingCount = await this.emailRepo.count();
    if (existingCount > 0) {
      this.logger.log(
        `Seed skipped — ${existingCount} email(s) already in database`,
      );
      return;
    }

    this.logger.log('Seeding development data...');

    let account = await this.accountRepo.findOne({
      where: { email: MOCK_ACCOUNT.email },
    });

    if (!account) {
      account = this.accountRepo.create(MOCK_ACCOUNT);
      account = await this.accountRepo.save(account);
      this.logger.log(`Created mock account: ${account.email} (${account.id})`);
    }

    const emails = MOCK_EMAILS(account.id).map((data) =>
      this.emailRepo.create(data),
    );
    await this.emailRepo.save(emails);
    this.logger.log(`Seeded ${emails.length} mock email(s)`);
  }
}
