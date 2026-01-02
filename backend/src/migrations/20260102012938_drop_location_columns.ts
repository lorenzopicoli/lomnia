import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", async (table) => {
    table.dropColumn("battery");
    table.dropColumn("battery_status");
    table.dropColumn("wifi_ssid");
    table.dropColumn("connection_status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", async (table) => {
    table.integer("battery").nullable().comment("in percent");
    table.enum("battery_status", ["unknown", "unplugged", "charging", "full"]).notNullable();
    table.enum("connection_status", ["wifi", "offline", "data"]);
    table.string("wifi_ssid");
  });
}
