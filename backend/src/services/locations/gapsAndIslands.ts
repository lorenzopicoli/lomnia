import { asc, avg, eq, getTableColumns, max, min, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "../../db/connection";
import { locationDetailsTable, locationsTable } from "../../models";
import type { DateRange } from "../../types/chartTypes";

/**
 * Returns gap and islands for a given period for any locationDetails property
 *
 * @param params.range the period to filter the location points
 * @param params.activityDurationFilterInMin the minimum amount of time that the user must be in the
 * given placeKey to be considered doing the activity.
 * For example:
 * activityDurationFilterInMin = 10 and placeKey = locationDetails.id
 *   -> user must be in the same locationDetails.id for 10min for it to be considered an activity
 * all points that appear for less than 10min are grouped into NULL
 *
 * activityDurationFilterInMin = 0 and placeKey = locationDetails.country
 *   -> user must be in the same country for 0min for it to be considered an activity
 * effectively returning a timeline of every country visited
 *
 * activityDurationFilterInMin = 60 and placeKey = locationDetailscity.
 *   -> user must be in the same city for one hour for it to be considered an activity
 * @param params.placeKey the property of locationDetails that we're grouping by
 */
export function getIslandsCte(params: {
  range: Partial<DateRange>;
  activityDurationFilterInMin: number;
  accuracyFilterInMeters: number;
  placeKey: PgColumn;
}) {
  const {
    range: { start, end },
    activityDurationFilterInMin,
    accuracyFilterInMeters,
    placeKey,
  } = params;
  const activityDurationFilterInSec = activityDurationFilterInMin * 60;
  const enrichedLocations = db.$with("enriched_locations").as((cte) =>
    cte
      .select({
        ...getTableColumns(locationsTable),
        placeKey: sql`${placeKey}`.as("place_key"),
      })
      .from(locationsTable)
      .innerJoin(locationDetailsTable, eq(locationDetailsTable.id, locationsTable.locationDetailsId))
      .where(
        sql`
            ${locationsTable.accuracy} < ${accuracyFilterInMeters}
            ${start ? sql`AND ${locationsTable.recordedAt} >= ${start.toISO()}` : sql``}
            ${end ? sql`AND  ${locationsTable.recordedAt} <= ${end.toISO()}` : sql``}
      `,
      ),
  );

  // Prepare the locations table to be groupped in gaps/islands. Also applies base filters
  // Gap and Islands https://stackoverflow.com/questions/55654156/group-consecutive-rows-based-on-one-column
  const baseLocations = db.$with("base_locations").as((cte) =>
    cte
      .with(enrichedLocations)
      .select({
        id: enrichedLocations.id,
        recordedAt: enrichedLocations.recordedAt,
        velocity: enrichedLocations.velocity,
        placeKey: enrichedLocations.placeKey,
        timezone: enrichedLocations.timezone,
        // Very important to use the id as a tie break since location fix can have duplicates
        // https://stackoverflow.com/questions/30877926/how-to-group-following-rows-by-not-unique-value/30880137#30880137
        totalSeq: sql`
            row_number() over (order by ${enrichedLocations.recordedAt} asc, ${enrichedLocations.id} asc)
        `.as("total_seq"),
        // Partition by the place key. This will split the islands by locationDetails key
        // ie. country, city or even ID if we're checking every "location" visited
        partitionSeq: sql`
            row_number() over (partition by ${enrichedLocations.placeKey}
                               order by ${enrichedLocations.recordedAt} asc, 
                                        ${enrichedLocations.id} asc,
                                        ${enrichedLocations.timezone} asc
                              )
        `.as("parition_seq"),
      })
      .from(enrichedLocations),
  );

  // Groups the gaps and islands
  const baseActivitiesIslands = db.$with("activities_islands").as((cte) =>
    cte
      .with(baseLocations)
      .select({
        startDate: min(baseLocations.recordedAt).as("ai_start_date"),
        endDate: max(baseLocations.recordedAt).as("ai_end_date"),
        duration: sql`EXTRACT(EPOCH FROM (
                ${max(baseLocations.recordedAt)} - 
                ${min(baseLocations.recordedAt)})
            )`.as("ai_duration"),
        velocity: avg(baseLocations.velocity).mapWith(Number).as("ai_velocity"),
        placeKey: baseLocations.placeKey,
        timezone: baseLocations.timezone,
      })
      .from(baseLocations)
      .orderBy(asc(min(baseLocations.recordedAt)))
      // The group by here must be the same as the partitionSeq in the previous CTE
      .groupBy(sql`${baseLocations.placeKey},
               (${baseLocations.totalSeq} - ${baseLocations.partitionSeq}),
               ${baseLocations.timezone}`),
  );

  // Now prepare to generate gaps and islands based on the duration of each activity
  // Short duration locations details are groupped together as "in transit". The locations details
  // are really precise so every few meters they'll change. We want to group them and find the ones
  // that are repeated for some time which means that the user stopped moving in a single location
  const activitiesIslands = db.$with("durations_islands").as((cte) =>
    cte
      .with(baseActivitiesIslands)
      .select({
        startDate: baseActivitiesIslands.startDate,
        endDate: baseActivitiesIslands.endDate,
        duration: baseActivitiesIslands.duration,
        velocity: baseActivitiesIslands.velocity,
        placeKey: baseActivitiesIslands.placeKey,
        timezone: baseActivitiesIslands.timezone,
        totalSeq: sql`
            row_number() over (
                order by ${baseActivitiesIslands.startDate} asc, 
                ${baseActivitiesIslands.placeKey} asc
            )
        `.as("di_total_seq"),
        // Partition based on the island duration and the filter passed. If the island clears
        // the threshold then we partition it based on the key, otherwise, set it to the "null"
        // bucked
        partitionSeq: sql`
            row_number() over (
                partition by 
                  CASE 
                    WHEN ${baseActivitiesIslands.duration} >= (${activityDurationFilterInSec}) 
                    THEN ${baseActivitiesIslands.placeKey}
                    ELSE NULL
                  END
                order by ${baseActivitiesIslands.startDate} asc, 
                ${baseActivitiesIslands.placeKey} asc,
                ${baseActivitiesIslands.timezone} asc
            )
        `.as("di_partition_seq"),
      })
      .from(baseActivitiesIslands),
  );

  const durationIslands = db.$with("durations_islands").as((cte) =>
    cte
      .with(activitiesIslands)
      .select({
        startDate: min(activitiesIslands.startDate).as("di_start_date"),
        endDate: max(activitiesIslands.endDate).as("di_end_date"),
        velocity: avg(activitiesIslands.velocity).mapWith(Number).as("di_velocity"),
        // If this island is a group of more than one placeKeys, then set it to NULL
        // otherwise return it
        placeKey: sql`
            CASE
              WHEN COUNT(DISTINCT ${activitiesIslands.placeKey}) > 1 THEN NULL
              ELSE MIN(${activitiesIslands.placeKey}) 
            END
        `.as("di_place_key"),
        duration: sql`
            EXTRACT(EPOCH FROM (
                ${max(activitiesIslands.endDate)} - 
                ${min(activitiesIslands.startDate)})
            )`.as("di_duration"),
        timezone: activitiesIslands.timezone,
      })
      .from(activitiesIslands)
      .groupBy(
        // group by the same keys we partition in the previous CTE
        sql`
            CASE 
              WHEN ${baseActivitiesIslands.duration} >= (${activityDurationFilterInSec}) 
              THEN ${baseActivitiesIslands.placeKey}
              ELSE NULL
            END,
            (${activitiesIslands.totalSeq} - ${activitiesIslands.partitionSeq}),
            ${activitiesIslands.timezone}`,
      )
      .orderBy(min(activitiesIslands.startDate)),
  );

  return durationIslands;
}
