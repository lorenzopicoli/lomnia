import { db } from "../../db/connection";
import type { DBTransaction } from "../../db/types";
import { Logger } from "../Logger";

export class BaseEnricher {
  protected logger = new Logger("BaseEnricher");

  public isEnabled(): boolean {
    return false;
  }

  public async run() {
    const timer = this.logger.timer("enricher", "info");

    await db
      .transaction(async (tx) => {
        await this.enrich(tx);
        this.logger.info("Finished enriching");
      })
      .catch((e) => {
        timer.endWithError(e);
      });
    timer.end();
  }

  public async enrich(_tx: DBTransaction): Promise<void> {
    throw new Error("Enrich not implemented");
  }
}
