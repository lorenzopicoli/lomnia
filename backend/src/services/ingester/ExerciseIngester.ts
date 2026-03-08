import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExercise from "../../ingestionSchemas/IngestionExercise";
import { exercisesTable, type NewExercise } from "../../models/Exercise";
import { Logger } from "../Logger";
import { Ingester } from "./BaseIngester";

export class ExerciseIngester extends Ingester<IngestionExercise, NewExercise> {
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

  transform(raw: IngestionExercise): NewExercise {
    const transformed: NewExercise = {
      externalId: raw.id,

      startedAt: new Date(raw.startedAt),
      endedAt: new Date(raw.endedAt),

      source: raw.source,
      exerciseType: raw.exerciseType,
      name: raw.name,
      distance: raw.distance,
      avgPace: raw.avgPace,
      avgHeartRate: raw.avgHeartRate,
      avgCadence: raw.avgCadence,

      timezone: null,
      externalDeviceId: raw.deviceId,

      importJobId: this.importJobId,
      createdAt: new Date(),
      updatedAt: null,
    };

    return transformed;
  }

  public async insertBatch(): Promise<void> {
    const updateOnConflict = buildUpdateOnConflict(exercisesTable, ["importJobId", "createdAt"]);
    await this.tx.insert(exercisesTable).values(this.collected).onConflictDoUpdate({
      target: exercisesTable.externalId,
      set: updateOnConflict,
    });
  }
}
