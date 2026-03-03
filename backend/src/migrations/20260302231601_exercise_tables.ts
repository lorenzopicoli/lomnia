import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("exercises", (table) => {
    table.increments();

    table.text("external_id").notNullable().index().unique();
    table.text("source").notNullable();

    table.timestamp("started_at").notNullable().index();
    table.timestamp("ended_at").notNullable().index();

    table.text("exercise_type").notNullable();

    table.text("name").notNullable();

    table.float("distance");
    table.float("avg_pace");
    table.float("avg_heart_rate");

    table.integer("self_evaluation");

    table.text("timezone");
    table.string("external_device_id").index();

    table.integer("import_job_id").references("import_jobs.id").notNullable();
    table.timestamps();
  });

  await knex.schema.createTable("exercise_laps", (table) => {
    table.increments();

    table.text("exercise_id").references("external_id").inTable("exercises").notNullable();

    table.timestamp("started_at").notNullable().index();
    table.timestamp("ended_at").notNullable().index();

    table.text("external_id").notNullable().index().unique();
    table.text("source").notNullable();

    table.float("distance");
    table.integer("duration");
    table.float("avg_pace");
    table.float("avg_heart_rate");

    table.text("timezone");
    table.string("external_device_id").index();
    table.integer("import_job_id").references("import_jobs.id").notNullable();

    table.timestamps();
  });

  await knex.schema.createTable("exercise_metrics", (table) => {
    table.increments();

    table.text("exercise_id").references("external_id").inTable("exercises").notNullable();

    table.text("external_id").notNullable().index().unique();
    table.text("source").notNullable();

    table.float("pace");
    table.float("cadence");
    table.float("vertical_oscillation");
    table.float("speed");
    table.float("step_length");
    table.float("stance_time");

    table.timestamp("recorded_at").notNullable();

    table.text("timezone");
    table.string("external_device_id").index();
    table.integer("import_job_id").references("import_jobs.id").notNullable();

    table.timestamps();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("exercise_metrics");
  await knex.schema.dropTableIfExists("exercise_laps");
  await knex.schema.dropTableIfExists("exercises");
}
