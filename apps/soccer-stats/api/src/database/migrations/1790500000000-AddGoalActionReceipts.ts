import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoalActionReceipts1790500000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE goal_action_receipts (
      "userId" uuid NOT NULL,
      "actionId" uuid NOT NULL,
      payload text NOT NULL,
      result jsonb NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY ("userId", "actionId"),
      UNIQUE ("actionId")
    )`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE goal_action_receipts');
  }
}
