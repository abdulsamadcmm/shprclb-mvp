import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203052935 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "pricing_tier" ("id" text not null, "warehouse_price_id" text not null, "min_quantity" integer not null, "max_quantity" integer null, "unit_price" numeric not null, "raw_unit_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pricing_tier_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pricing_tier_deleted_at" ON "pricing_tier" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pricing_tier" cascade;`);
  }

}
