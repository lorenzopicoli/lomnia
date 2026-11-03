import type { DBTransaction } from "../../db/types";
import { Logger } from "../Logger";

export type IngestionRecord = { id?: string | null };

export abstract class Ingester<SchemaModel extends IngestionRecord, NewRowModel> {
  protected collected: NewRowModel[] = [];
  private collectedIndexById = new Map<string, number>();
  protected logger = new Logger("BaseIngester");
  constructor(
    public readonly importJobId: number,
    public readonly tx: DBTransaction,
    public readonly batchSize: number = 300,
  ) {}

  protected abstract isIngestable(raw: unknown): { isIngestable: boolean; parsed?: SchemaModel };
  protected abstract transform(raw: SchemaModel): NewRowModel;
  public abstract insertBatch(values: NewRowModel[]): Promise<void>;

  public async tryIngest(raw: unknown): Promise<{ wasIngested: boolean; insertedCount?: number }> {
    const { isIngestable, parsed } = this.isIngestable(raw);

    if (isIngestable && parsed) {
      const insertedCount = await this.ingest(parsed);
      return { wasIngested: true, insertedCount };
    }
    return { wasIngested: false };
  }

  /**
   * Returns how many rows were inserted in the DB.
   * Might be 0 if the ingestion was collected, but not yet
   * inserted in the database
   */
  protected async ingest(schemaRow: SchemaModel): Promise<number> {
    const transformed = this.transform(schemaRow);
    const existingIndex = schemaRow.id != null ? this.collectedIndexById.get(schemaRow.id) : undefined;

    // Avoids inserting duplicates in the same batch, which postgres doesn't like
    if (existingIndex !== undefined) {
      this.collected[existingIndex] = transformed;
    } else {
      if (schemaRow.id != null) {
        this.collectedIndexById.set(schemaRow.id, this.collected.length);
      }
      this.collected.push(transformed);
    }

    if (this.collected.length > this.batchSize) {
      return await this.commitInsertions();
    }
    return 0;
  }

  protected async commitInsertions() {
    try {
      if (this.collected.length > 0) {
        await this.insertBatch(this.collected);
      }
      const inserted = this.collected.length;
      this.collected = [];
      this.collectedIndexById.clear();

      return inserted;
    } catch (e) {
      this.logger.error("Failed to insert collected ingestions in DB", e);
      throw e;
    }
  }

  public async flush() {
    return await this.commitInsertions();
  }
}
