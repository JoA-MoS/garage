import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Foundation for the live-game event outbox
 * (apps/soccer-stats/docs/event-outbox.md):
 * - applied_actions: idempotency receipts for client actions
 * - game_events.occurredAt: client wall-clock time of the action
 */
export class AddAppliedActionsAndOccurredAt1790100000000
  implements MigrationInterface
{
  name = 'AddAppliedActionsAndOccurredAt1790100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "applied_actions" (
        "actionId" uuid NOT NULL,
        "gameId" uuid NOT NULL,
        "recordedByUserId" uuid NOT NULL,
        "kind" character varying(50) NOT NULL,
        "resultEventIds" uuid array NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_applied_actions_actionId" PRIMARY KEY ("actionId")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_applied_actions_gameId" ON "applied_actions" ("gameId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "applied_actions" ADD CONSTRAINT "FK_applied_actions_gameId" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "game_events" ADD "occurredAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "game_events" DROP COLUMN "occurredAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applied_actions" DROP CONSTRAINT "FK_applied_actions_gameId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_applied_actions_gameId"`);
    await queryRunner.query(`DROP TABLE "applied_actions"`);
  }
}
