import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExerciseLap from "../../ingestionSchemas/IngestionExerciseLap";
import { exerciseLapsTable, type NewExerciseLap } from "../../models/ExerciseLap";
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
    const transformed: NewExerciseLap = {
      externalId: raw.id,

      startedAt: new Date(raw.startedAt),
      endedAt: new Date(raw.endedAt),

      source: raw.source,
      distance: raw.distance,
      avgPace: raw.avgPace,
      avgHeartRate: raw.avgHeartRate,
      duration: raw.duration,
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
    const updateOnConflict = buildUpdateOnConflict(exerciseLapsTable, ["importJobId", "createdAt"]);
    await this.tx.insert(exerciseLapsTable).values(this.collected).onConflictDoUpdate({
      target: exerciseLapsTable.externalId,
      set: updateOnConflict,
    });
  }
}
