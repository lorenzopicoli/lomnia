import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExerciseMetrics from "../../ingestionSchemas/IngestionExerciseMetrics";
import { exerciseMetricsTable, type NewExerciseMetrics } from "../../models/ExerciseMetrics";
import type { Exhaustive } from "../../types/exhaustive";
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
    const {
      id,
      recordedAt,
      source,
      speed,
      stepLength,
      stanceTime,
      pace,
      cadence,
      exerciseId,
      deviceId,
      timezone,
      verticalOscillation,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewExerciseMetrics = {
      externalId: id,

      recordedAt: new Date(recordedAt),

      source,
      speed,
      stepLength,
      stanceTime,
      pace,
      cadence,
      externalExerciseId: exerciseId,
      verticalOscillation,

      timezone,
      externalDeviceId: deviceId,

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
