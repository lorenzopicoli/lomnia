import type { DBTransaction } from "../../db/types";

export abstract class Ingester<SchemaModel> {
  constructor(public readonly importJobId: number) {}

  public abstract isIngestable(raw: unknown): { isIngestable: boolean; parsed?: SchemaModel };

  public abstract ingest(tx: DBTransaction, raw: SchemaModel): Promise<void>;
  public async tryIngest(tx: DBTransaction, raw: unknown): Promise<void> {
    const { isIngestable, parsed } = this.isIngestable(raw);

    if (isIngestable && parsed) {
      await this.ingest(tx, parsed);
    }
  }
}
