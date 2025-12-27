import type { DBTransaction } from "../../db/types";

export abstract class Ingester<SchemaModel> {
  constructor(public readonly importJobId: number) {}

  public abstract isIngestable(raw: unknown): { isIngestable: boolean; parsed?: SchemaModel };

  public abstract ingest(tx: DBTransaction, raw: SchemaModel): Promise<boolean>;
  public async tryIngest(tx: DBTransaction, raw: unknown): Promise<boolean> {
    const { isIngestable, parsed } = this.isIngestable(raw);

    if (isIngestable && parsed) {
      return await this.ingest(tx, parsed);
    }
    return false;
  }
}
