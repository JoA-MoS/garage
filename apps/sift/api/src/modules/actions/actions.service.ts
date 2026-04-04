import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action } from './action.entity';

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(Action)
    private readonly actionRepo: Repository<Action>,
  ) {}

  findAll(filters: { userId?: string; completed?: boolean }): Promise<Action[]> {
    const where: Record<string, unknown> = {};
    if (filters.userId) where['userId'] = filters.userId;
    if (filters.completed !== undefined) where['completed'] = filters.completed;

    return this.actionRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Action> {
    const action = await this.actionRepo.findOne({ where: { id } });
    if (!action) throw new NotFoundException(`Action ${id} not found`);
    return action;
  }

  async complete(id: string): Promise<Action> {
    const action = await this.findOne(id);
    action.completed = true;
    action.completedAt = new Date();
    return this.actionRepo.save(action);
  }
}
