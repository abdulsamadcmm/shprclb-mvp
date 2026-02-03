import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260203041802 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "warehouse_price" ("id" text not null, "variant_id" text not null, "location_id" text not null, "base_price" numeric not null, "currency_code" text not null default 'INR', "backorder_enabled" boolean not null default false, "backorder_available_date" timestamptz null, "raw_base_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "warehouse_price_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_warehouse_price_deleted_at" ON "warehouse_price" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "warehouse_price" cascade;`);
  }

}
