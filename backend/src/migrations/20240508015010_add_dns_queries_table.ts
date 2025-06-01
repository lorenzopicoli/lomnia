import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("dns_queries", (table) => {
    table.increments();
    table.integer("external_id").notNullable();
    table.timestamp("query_timestamp").notNullable();

    table.integer("import_job_id").references("import_jobs.id").notNullable();
    table.string("domain").notNullable();
    table.string("client").notNullable();
    table.integer("reply_time").comment("In milliseconds");
    table.integer("type").notNullable();
    table.integer("reply_type").notNullable();
    table.integer("status").notNullable();
    table.integer("dnssec");
    table.string("forward");
    table.jsonb("additional_info");

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("dns_queries");
}
