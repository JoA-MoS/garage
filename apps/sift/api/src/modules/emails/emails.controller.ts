import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Patch,
  Body,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailStatus } from './email.entity';
import { UpdateEmailStatusDto } from './dto/update-email-status.dto';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  findAll(
    @Query('accountId') accountId?: string,
    @Query('status') status?: EmailStatus,
    @Query('importance') importance?: string,
  ) {
    return this.emailsService.findAll({ accountId, status, importance });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailsService.findOne(id);
  }

  @Post(':id/classify')
  classify(@Param('id') id: string) {
    return this.emailsService.classify(id);
  }

  @Post('sync')
  sync(@Body() body: { accountId: string }) {
    return this.emailsService.sync(body.accountId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateEmailStatusDto) {
    return this.emailsService.updateStatus(id, body.status);
  }
}
