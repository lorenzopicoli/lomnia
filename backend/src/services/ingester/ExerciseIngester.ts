import { chunk } from "lodash";
import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExercise from "../../ingestionSchemas/IngestionExercise";
import { exercisesTable, type NewExercise } from "../../models/Exercise";
import { exerciseLapsTable, type NewExerciseLap } from "../../models/ExerciseLap";
import { exerciseMetricsTable, type NewExerciseMetrics } from "../../models/ExerciseMetrics";
import type { Exhaustive } from "../../types/exhaustive";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

type NewRow = {
  exercise: NewExercise;
  laps: Omit<NewExerciseLap, "exerciseId">[];
  metrics: Omit<NewExerciseMetrics, "exerciseId">[];
};
export class ExerciseIngester extends Ingester<IngestionExercise, NewRow> {
  protected logger = new Logger("SleepIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionExercise;
  } {
    const exercise = ingestionSchemas.exercise.safeParse(raw);
    return {
      isIngestable: exercise.success,
      parsed: exercise.data,
    };
  }

  transform(raw: IngestionExercise): NewRow {
    const {
      id,
      startedAt,
      endedAt,
      source,
      exerciseType,
      name,
      distance,
      avgPace,
      avgHeartRate,
      avgCadence,
      deviceId,
      timezone,
      feelScore,
      perceivedEffort,
      laps: rawLaps,
      metrics: rawMetrics,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const exercise: NewExercise = {
      externalId: id,

      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),

      source,
      exerciseType,
      name,
      distance,
      avgPace,
      avgHeartRate,
      avgCadence,
      feelScore,
      perceivedEffort,

      timezone,
      externalDeviceId: deviceId,

      importJobId: this.importJobId,
      createdAt: new Date(),
    };

    const laps: Required<NewRow["laps"]> = [];
    for (const rawLap of rawLaps ?? []) {
      const {
        id,
        startedAt,
        endedAt,
        maxPace,
        maxHeartRate,
        maxCadence,
        distance,
        avgCadence,
        avgPace,
        avgStepLength,
        avgStanceTime,
        avgVerticalOscillation,
        avgHeartRate,
        duration,
        ...rest
      } = rawLap;

      // ensure nothing left unmapped
      const _exhaustive: Exhaustive<typeof rest> = rest;
      void _exhaustive;

      const lap: NewRow["laps"][number] = {
        externalId: id,

        startedAt: new Date(startedAt),
        endedAt: new Date(endedAt),

        source,
        distance,
        avgPace,
        avgHeartRate,
        duration: duration ? Math.round(duration) : duration,
        timezone,

        maxPace,
        maxCadence,
        avgCadence,
        maxHeartRate,

        avgStepLength,
        avgStanceTime,
        avgVerticalOscillation,

        externalDeviceId: deviceId,

        importJobId: this.importJobId,
        createdAt: new Date(),
        updatedAt: null,
      };

      laps.push(lap);
    }

    const metrics: Required<NewRow["metrics"]> = [];
    for (const rawMetric of rawMetrics ?? []) {
      const {
        id,
        recordedAt,
        speed,
        distance,
        stepLength,
        stanceTime,
        pace,
        cadence,
        verticalOscillation,
        // Unused
        ...rest
      } = rawMetric;

      // ensure nothing left unmapped
      const _exhaustive: Exhaustive<typeof rest> = rest;
      void _exhaustive;

      const metric: NewRow["metrics"][number] = {
        recordedAt: new Date(recordedAt),
        externalId: id,
        speed,
        stepLength,
        stanceTime,
        pace,
        distance,
        cadence,
        verticalOscillation,

        importJobId: this.importJobId,
        createdAt: new Date(),
        updatedAt: null,
      };

      metrics.push(metric);
    }
    return { exercise, laps, metrics };
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(exercisesTable, ["importJobId", "createdAt"]);
    // Have to insert one exercise at a time to get the ID
    await Promise.all(
      this.collected.map(async (entry) => {
        const exercise = await this.tx
          .insert(exercisesTable)
          .values(entry.exercise)
          .onConflictDoUpdate({
            target: exercisesTable.externalId,
            set: updateOnConflict,
          })
          .returning({ id: exercisesTable.id });

        const exerciseId = exercise[0]?.id;

        if (!exerciseId) {
          throw new Error("Failed to get exercise ID");
        }

        if (entry.laps.length > 0) {
          const formattedLaps = entry.laps.map((l) => ({ ...l, exerciseId }));
          const chunks = chunk(formattedLaps, this.batchSize);
          for (const values of chunks) {
            await this.tx.insert(exerciseLapsTable).values(values).onConflictDoUpdate({
              target: exerciseLapsTable.externalId,
              set: updateOnConflict,
            });
          }
        }
        if (entry.metrics.length > 0) {
          const formattedMetrics = entry.metrics.map((l) => ({ ...l, exerciseId }));
          const chunks = chunk(formattedMetrics, this.batchSize);
          for (const values of chunks) {
            await this.tx.insert(exerciseMetricsTable).values(values).onConflictDoUpdate({
              target: exerciseMetricsTable.externalId,
              set: updateOnConflict,
            });
          }
        }
      }),
    );
  }
}
