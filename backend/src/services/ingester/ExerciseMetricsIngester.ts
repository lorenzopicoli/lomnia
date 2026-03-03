import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExerciseMetrics from "../../ingestionSchemas/IngestionExerciseMetrics";
import { exerciseMetricsTable, type NewExerciseMetrics } from "../../models/ExerciseMetrics";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class ExerciseMetricIngester extends Ingester<IngestionExerciseMetrics, NewExerciseMetrics> {
  protected logger = new Logger("SleepIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionExerciseMetrics;
  } {
    const exerciseMetrics = ingestionSchemas.exerciseMetrics.safeParse(raw);
    return {
      isIngestable: exerciseMetrics.success,
      parsed: exerciseMetrics.data,
    };
  }

  transform(raw: IngestionExerciseMetrics): NewExerciseMetrics {
    const transformed: NewExerciseMetrics = {
      externalId: raw.id,

      recordedAt: new Date(raw.recordedAt),

      source: raw.source,
      speed: raw.speed,
      stepLength: raw.stepLength,
      stanceTime: raw.stanceTime,
      pace: raw.pace,
      cadence: raw.cadence,
      externalExerciseId: raw.exerciseId,

      timezone: null,
      externalDeviceId: raw.deviceId,

      importJobId: this.importJobId,
      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(exerciseMetricsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(exerciseMetricsTable).values(this.collected).onConflictDoUpdate({
      target: exerciseMetricsTable.externalId,
      set: updateOnConflict,
    });
  }
}
