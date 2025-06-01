import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("step_counts", (table) => {
    table.increments();
    table.timestamp("start_time").notNullable().index();
    table.timestamp("end_time").notNullable().index();
    table.integer("walk_step").notNullable();
    table.integer("run_step").notNullable();
    table.integer("step_count").notNullable();
    table.float("speed");
    table.float("distance");
    table.float("calories");
    table.string("timezone").notNullable();

    table.string("data_export_id").notNullable();

    table.integer("import_job_id").references("import_jobs.id").notNullable().index();

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("step_counts");
}
