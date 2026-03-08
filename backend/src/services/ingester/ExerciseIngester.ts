import { buildUpdateOnConflict } from "../../helpers/buildUpdateOnConflict";
import { ingestionSchemas } from "../../ingestionSchemas";
import type IngestionExercise from "../../ingestionSchemas/IngestionExercise";
import { exercisesTable, type NewExercise } from "../../models/Exercise";
import type { Exhaustive } from "../../types/exhaustive";
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
      selfEvaluation,
      // Unused
      entityType: _type,
      version: _version,
      ...rest
    } = raw;

    // ensure nothing left unmapped
    const _exhaustive: Exhaustive<typeof rest> = rest;
    void _exhaustive;

    const transformed: NewExercise = {
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
      selfEvaluation,

      timezone,
      externalDeviceId: deviceId,

      importJobId: this.importJobId,
      createdAt: new Date(),
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
