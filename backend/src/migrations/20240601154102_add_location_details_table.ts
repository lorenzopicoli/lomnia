import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("location_details", function (table) {
    table.increments("id").primary().index();
    table.geography("location").notNullable().index();

    table.text("place_id");
    table.text("licence");
    table.text("osm_type");
    table.text("osm_id");
    table.integer("place_rank");
    table.text("category");
    table.text("type");
    table.decimal("importance");
    table.text("address_type");
    table.text("neighbourhood");
    table.text("suburb");
    table.text("city");
    table.text("display_name");
    table.text("house_number");
    table.text("name").notNullable();
    table.text("road");
    table.text("village");
    table.text("state_district");
    table.text("state");
    table.text("postcode");
    table.text("county");
    table.text("region");
    table.text("iso3166_2_lvl4");
    table.text("country");
    table.text("country_code");
    table.jsonb("extra_tags");
    table.jsonb("name_details");

    table.enum("source", ["userPOIJson", "external"]).notNullable().index();
    table.integer("import_job_id").references("import_jobs.id").notNullable().index();
  });

  await knex.schema.alterTable("locations", (table) => {
    table.integer("location_details_id").references("location_details.id").index();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("locations", (table) => {
    table.dropColumn("location_details_id");
  });
  await knex.schema.dropTable("location_details");
}
