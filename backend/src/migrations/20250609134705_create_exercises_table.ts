import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("exercises", (table) => {
    table.increments();
    table.integer("external_id").notNullable();
    table.integer("import_job_id").references("import_jobs.id").notNullable().index();
    table.enum("source", ["fitbit", "samsung_health"]).notNullable();
    table.timestamps();

    table
      .enum("activity_type", ["running", "biking", "walking", "swimming", "basketball", "weightlifting", "yoga"])
      .notNullable();

    table.integer("duration_ms").notNullable();
    table.timestamp("start_date").notNullable();
    table.timestamp("end_date").notNullable();

    table.text("title").nullable();
    table.text("notes").nullable();
    table.geography("start_location").nullable();
    table.float("min_altitude").nullable();
    table.float("max_altitude").nullable();
    table.float("max_speed").nullable();
    table.float("mean_heart_rate").nullable();
    table.float("avg_heart_rate").nullable();
    table.float("max_heart_rate").nullable();
    table.float("distance").nullable();
    table.integer("total_calories").nullable();
    table.integer("max_cadence").nullable();
    table.integer("timezone").nullable();
    table.float("altitude_gain").nullable();
    table.float("elevation_gain").nullable();
    table.float("altitude_loss").nullable();
    table.integer("sedentary_activity_level_minutes").nullable();
    table.integer("lightly_activity_level_minutes").nullable();
    table.integer("fairly_activity_level_minutes").nullable();
    table.integer("very_activity_level_minutes").nullable();

    table.text("source_device").nullable();
  });
  await knex.schema.createTable("exercise_measurements", (table) => {
    table.increments();
    table.integer("external_id").notNullable();
    table.integer("import_job_id").references("import_jobs.id").notNullable().index();
    table.integer("exercise_id").references("exercises.id").notNullable().index();
    table.enum("source", ["fitbit", "samsung_health"]).notNullable();
    table.timestamps();

    table.geography("start_location").nullable();
    table.integer("cadence").nullable();
    table.float("speed").nullable();
    table.float("distance").nullable();
    table.float("location_accuracy").nullable();
    table.float("calories").nullable();
    table.float("altitude").nullable();
    table.float("heart_rate").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("exercises");
  await knex.schema.dropTable("exercises_measurements");
}
