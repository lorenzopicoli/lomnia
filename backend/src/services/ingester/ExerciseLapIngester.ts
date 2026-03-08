import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExerciseLap from "../../ingestionSchemas/IngestionExerciseLap";
import { exerciseLapsTable, type NewExerciseLap } from "../../models/ExerciseLap";
import type { Exhaustive } from "../../types/exhaustive";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class ExerciseLapIngester extends Ingester<IngestionExerciseLap, NewExerciseLap> {
  protected logger = new Logger("SleepIngester");

  public isIngestable(raw: unknown): {
    isIngestable: boolean;
    parsed?: IngestionExerciseLap;
  } {
    const exerciseLap = ingestionSchemas.exerciseLap.safeParse(raw);
    return {
      isIngestable: exerciseLap.success,
      parsed: exerciseLap.data,
    };
  }
  transform(raw: IngestionExerciseLap): NewExerciseLap {
    const {
      id,
      startedAt,
      endedAt,
      source,
      distance,
      avgPace,
      avgHeartRate,
      duration,
      exerciseId,
      deviceId,
      timezone,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewExerciseLap = {
      externalId: id,

      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),

      source,
      distance,
      avgPace,
      avgHeartRate,
      duration,
      externalExerciseId: exerciseId,
      timezone,

      externalDeviceId: deviceId,

      importJobId: this.importJobId,
      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(exerciseLapsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(exerciseLapsTable).values(this.collected).onConflictDoUpdate({
      target: exerciseLapsTable.externalId,
      set: updateOnConflict,
    });
  }
}
