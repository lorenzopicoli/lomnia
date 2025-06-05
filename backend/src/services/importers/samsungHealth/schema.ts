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

    "com.samsung.health.heart_rate.client_data_ver": z.string().optional(),
    "com.samsung.health.heart_rate.client_data_id": z.string().optional(),
  })
  .strict()
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
  .strict()
  .transform(camelize);

export const SamsungHealthSleepCsvSchema = z
  .object({
    "com.samsung.health.sleep.start_time": z.string().min(1, "Start time is required"),
    "com.samsung.health.sleep.end_time": z.string().min(1, "End time is required"),
    "com.samsung.health.sleep.time_offset": z.string().min(1, "Time offset is required"),
    "com.samsung.health.sleep.datauuid": z.string().min(1, "Data UUID is required"),
    "com.samsung.health.sleep.deviceuuid": z.string().min(1, "Device UUID is required"),
    "com.samsung.health.sleep.comment": z.string().optional(),

    mental_recovery: z.union([z.string(), z.number()]).optional(),
    physical_recovery: z.union([z.string(), z.number()]).optional(),
    efficiency: z.union([z.string(), z.number()]).optional(),
    sleep_score: z.union([z.string(), z.number()]).optional(),
    sleep_cycles: z.union([z.string(), z.number()]).optional(),

    "com.samsung.health.sleep.create_sh_ver": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.custom": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.modify_sh_ver": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.update_time": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.create_time": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.client_data_id": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.client_data_ver": z.union([z.string(), z.number()]).optional(),
    "com.samsung.health.sleep.pkg_name": z.string().optional(),

    total_sleep_time_weight: z.union([z.string(), z.number()]).optional(),
    original_efficiency: z.union([z.string(), z.number()]).optional(),
    wake_score: z.union([z.string(), z.number()]).optional(),
    deep_score: z.union([z.string(), z.number()]).optional(),
    latency_weight: z.union([z.string(), z.number()]).optional(),
    has_sleep_data: z.union([z.string(), z.number(), z.boolean()]).optional(),
    bedtime_detection_delay: z.union([z.string(), z.number()]).optional(),
    sleep_efficiency_with_latency: z.union([z.string(), z.number()]).optional(),
    wakeup_time_detection_delay: z.union([z.string(), z.number()]).optional(),
    total_rem_duration: z.union([z.string(), z.number()]).optional(),
    sleep_type: z.union([z.string(), z.number()]).optional(),
    sleep_latency: z.union([z.string(), z.number()]).optional(),
    data_version: z.union([z.string(), z.number()]).optional(),
    latency_score: z.union([z.string(), z.number()]).optional(),
    deep_weight: z.union([z.string(), z.number()]).optional(),
    rem_weight: z.union([z.string(), z.number()]).optional(),
    original_wake_up_time: z.union([z.string(), z.number()]).optional(),
    movement_awakening: z.union([z.string(), z.number()]).optional(),
    is_integrated: z.union([z.string(), z.number(), z.boolean()]).optional(),
    original_bed_time: z.union([z.string(), z.number()]).optional(),
    goal_bed_time: z.union([z.string(), z.number()]).optional(),
    quality: z.union([z.string(), z.number()]).optional(),
    extra_data: z.string().optional(),
    wake_weight: z.union([z.string(), z.number()]).optional(),
    rem_score: z.union([z.string(), z.number()]).optional(),
    goal_wake_up_time: z.union([z.string(), z.number()]).optional(),
    sleep_cycle: z.union([z.string(), z.number()]).optional(),
    total_light_duration: z.union([z.string(), z.number()]).optional(),
    sleep_duration: z.union([z.string(), z.number()]).optional(),
    stage_analyzed_type: z.union([z.string(), z.number()]).optional(),
    total_sleep_time_score: z.union([z.string(), z.number()]).optional(),
    integrated_id: z.union([z.string(), z.number()]).optional(),
    combined_id: z.union([z.string(), z.number()]).optional(),

    factor_01: z.union([z.string(), z.number()]).optional(),
    factor_02: z.union([z.string(), z.number()]).optional(),
    factor_03: z.union([z.string(), z.number()]).optional(),
    factor_04: z.union([z.string(), z.number()]).optional(),
    factor_05: z.union([z.string(), z.number()]).optional(),
    factor_06: z.union([z.string(), z.number()]).optional(),
    factor_07: z.union([z.string(), z.number()]).optional(),
    factor_08: z.union([z.string(), z.number()]).optional(),
    factor_09: z.union([z.string(), z.number()]).optional(),
    factor_10: z.union([z.string(), z.number()]).optional(),
  })
  .strict()
  .transform((row) => {
    const {
      "com.samsung.health.sleep.start_time": startTime,
      "com.samsung.health.sleep.end_time": endTime,
      "com.samsung.health.sleep.time_offset": timeOffset,
      "com.samsung.health.sleep.datauuid": dataUuid,
      "com.samsung.health.sleep.deviceuuid": deviceUuid,
      "com.samsung.health.sleep.comment": comment,
      "com.samsung.health.sleep.create_sh_ver": createShVer,
      "com.samsung.health.sleep.custom": custom,
      "com.samsung.health.sleep.modify_sh_ver": modifyShVer,
      "com.samsung.health.sleep.update_time": updateTime,
      "com.samsung.health.sleep.create_time": createTime,
      "com.samsung.health.sleep.client_data_id": clientDataId,
      "com.samsung.health.sleep.client_data_ver": clientDataVer,
      "com.samsung.health.sleep.pkg_name": pkgName,
      ...nonPrefixedKeys
    } = row;

    return {
      startTime,
      endTime,
      timeOffset,
      dataUuid,
      deviceUuid,
      comment,

      createShVer,
      custom,
      modifyShVer,
      updateTime,
      createTime,
      clientDataId,
      clientDataVer,
      pkgName,

      ...camelize(nonPrefixedKeys),
    };
  });
