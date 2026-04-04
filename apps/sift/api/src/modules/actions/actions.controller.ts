import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ActionsService } from './actions.service';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  findAll(@Query('userId') userId?: string, @Query('completed') completed?: string) {
    return this.actionsService.findAll({
      userId,
      completed: completed !== undefined ? completed === 'true' : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.actionsService.complete(id);
  }
}
