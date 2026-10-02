import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * clock_timestamp(), not now(): now() is the transaction start time, so
   * every row written in one transaction would share it. createdAt is used
   * as the final tie-breaker when ordering events (see
   * LineupService.getGameRoster), so it must follow write order.
   */
  @Field()
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'clock_timestamp()',
  })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
