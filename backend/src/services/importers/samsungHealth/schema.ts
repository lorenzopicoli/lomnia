import z from "zod";
import { camelize } from "../../../helpers/camelize";

export const SamsungHeartRateCsvRowSchema = z
  .object({
    source: z.string().optional(),
    tag_id: z.number().optional(),
    "com.samsung.health.heart_rate.create_sh_ver": z.number().optional(),
    "com.samsung.health.heart_rate.heart_beat_count": z.number().optional(),
    "com.samsung.health.heart_rate.start_time": z.string(),
    "com.samsung.health.heart_rate.custom": z.string().optional(),
    "com.samsung.health.heart_rate.binning_data": z.string().optional(),
    "com.samsung.health.heart_rate.modify_sh_ver": z.string().or(z.number()).optional(),
    "com.samsung.health.heart_rate.update_time": z.string().optional(),
    "com.samsung.health.heart_rate.create_time": z.string().optional(),
    "com.samsung.health.heart_rate.max": z.coerce.number(),
    "com.samsung.health.heart_rate.min": z.coerce.number(),
    /**
     * offset in string format UTC-0400
     */
    "com.samsung.health.heart_rate.time_offset": z.string(),
    "com.samsung.health.heart_rate.deviceuuid": z.string().optional(),
    "com.samsung.health.heart_rate.comment": z.string().optional(),
    "com.samsung.health.heart_rate.pkg_name": z.string().optional(),
    "com.samsung.health.heart_rate.end_time": z.string(),
    "com.samsung.health.heart_rate.datauuid": z.string(),
    "com.samsung.health.heart_rate.heart_rate": z.coerce.number(),
  })
  .transform((raw) => {
    const csvColumnPrefix = "com.samsung.health.heart_rate";

    return {
      source: raw.source,
      tagId: raw.tag_id,
      deviceUuid: raw[`${csvColumnPrefix}.deviceuuid`],
      packageName: raw[`${csvColumnPrefix}.pkg_name`],
      dataUuid: raw[`${csvColumnPrefix}.datauuid`],

      startTime: raw[`${csvColumnPrefix}.start_time`],
      endTime: raw[`${csvColumnPrefix}.end_time`],
      createTime: raw[`${csvColumnPrefix}.create_time`],
      updateTime: raw[`${csvColumnPrefix}.update_time`],
      timeOffset: raw[`${csvColumnPrefix}.time_offset`],

      heartRate: raw[`${csvColumnPrefix}.heart_rate`],
      heartRateMax: raw[`${csvColumnPrefix}.max`],
      heartRateMin: raw[`${csvColumnPrefix}.min`],
      heartBeatCount: raw[`${csvColumnPrefix}.heart_beat_count`],

      binningData: raw[`${csvColumnPrefix}.binning_data`],
      comment: raw[`${csvColumnPrefix}.comment`],
      custom: raw[`${csvColumnPrefix}.custom`],

      createShVersion: raw[`${csvColumnPrefix}.create_sh_ver`],
      modifyShVersion: raw[`${csvColumnPrefix}.modify_sh_ver`],
    };
  });

export const SamsungHeartRateBinnedDataSchema = z
  .object({
    start_time: z.number(), // Unix timestamp in milliseconds
    end_time: z.number(), // Unix timestamp in milliseconds
    heart_rate: z.number(),
    heart_rate_max: z.number(),
    heart_rate_min: z.number(),
  })
  .transform(camelize);
