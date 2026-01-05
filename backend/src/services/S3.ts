import * as fs from "node:fs";
import * as os from "node:os";
import path from "node:path";
import type { Readable } from "node:stream";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { EnvVar, getEnvVarOrError } from "../helpers/envVars";

export class S3 {
  private static instance: S3 | undefined = undefined;
  private s3: S3Client;

  private constructor() {
    this.s3 = new S3Client({
      endpoint: getEnvVarOrError(EnvVar.S3_SERVER_URL),
      region: getEnvVarOrError(EnvVar.S3_REGION),
      credentials: {
        accessKeyId: getEnvVarOrError(EnvVar.S3_ACCESS_KEY_ID),
        secretAccessKey: getEnvVarOrError(EnvVar.S3_SECRET_ACCESS_KEY),
      },
      forcePathStyle: true,
    });
  }

  static init() {
    if (S3.instance) {
      return S3.instance;
    }
    S3.instance = new S3();
    return S3.instance;
  }

  /**
   * Download a file into a temporary folder
   * @param bucket the bucket to download from
   * @param key the file key to download
   * @returns the path to the downloaded file
   */
  public async downloadTmp(bucket: string, key: string) {
    const tempDirPrefix = path.join(os.tmpdir(), "lomnia-");
    const tmpDir = fs.mkdtempSync(tempDirPrefix);
    const filePath = path.join(tmpDir, path.basename(key));

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3.send(command);

    const body = response.Body as Readable;
    const fileStream = fs.createWriteStream(filePath);

    return new Promise<string>((resolve, reject) => {
      body
        .pipe(fileStream)
        .on("error", reject)
        .on("finish", () => resolve(filePath));
    });
  }
}
