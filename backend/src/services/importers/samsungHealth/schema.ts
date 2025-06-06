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

export const SamsungHealthSleepStageCsvRowSchema = z
  .object({
    source: z.string().optional(),
    tag_id: z.number().optional(),
    "com.samsung.health.sleep_stage.create_sh_ver": z.number().optional(),
    "com.samsung.health.sleep_stage.start_time": z.string().optional(),
    "com.samsung.health.sleep_stage.end_time": z.string().optional(),
    "com.samsung.health.sleep_stage.time_offset": z.string().optional(),
    "com.samsung.health.sleep_stage.stage": z.number().optional(),
    "com.samsung.health.sleep_stage.sleep_id": z.string().optional(),
    "com.samsung.health.sleep_stage.datauuid": z.string().optional(),
    "com.samsung.health.sleep_stage.modify_sh_ver": z.string().or(z.number()).optional(),
    "com.samsung.health.sleep_stage.update_time": z.string().optional(),
    "com.samsung.health.sleep_stage.create_time": z.string().optional(),
    "com.samsung.health.sleep_stage.deviceuuid": z.string().optional(),
    "com.samsung.health.sleep_stage.comment": z.string().optional(),
    "com.samsung.health.sleep_stage.pkg_name": z.string().optional(),
    "com.samsung.health.sleep_stage.custom": z.string().optional(),
    "com.samsung.health.sleep_stage.client_data_ver": z.string().optional(),
    "com.samsung.health.sleep_stage.client_data_id": z.string().optional(),

    update_time: z.string().optional(),
    create_time: z.string().optional(),
    time_offset: z.string().optional(),
    datauuid: z.string().optional(),
    deviceuuid: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    pkg_name: z.string().optional(),
    custom: z.string().optional(),
    stage: z.number().optional(),
    sleep_id: z.string().optional(),
    create_sh_ver: z.number().optional(),
    modify_sh_ver: z.number().optional(),
  })
  .strict()
  .transform((raw) => {
    const csvColumnPrefix = "com.samsung.health.sleep_stage";
    return {
      source: raw.source,
      tagId: raw.tag_id,
      deviceUuid: raw[`${csvColumnPrefix}.deviceuuid`] || raw.deviceuuid,
      packageName: raw[`${csvColumnPrefix}.pkg_name`] || raw.pkg_name,
      dataUuid: raw[`${csvColumnPrefix}.datauuid`] || raw.datauuid,
      startTime: raw[`${csvColumnPrefix}.start_time`] || raw.start_time,
      endTime: raw[`${csvColumnPrefix}.end_time`] || raw.end_time,
      createTime: raw[`${csvColumnPrefix}.create_time`] || raw.create_time,
      updateTime: raw[`${csvColumnPrefix}.update_time`] || raw.update_time,
      timeOffset: raw[`${csvColumnPrefix}.time_offset`] || raw.time_offset,
      stage: raw[`${csvColumnPrefix}.stage`] || raw.stage,
      sleepId: raw[`${csvColumnPrefix}.sleep_id`] || raw.sleep_id,
      comment: raw[`${csvColumnPrefix}.comment`],
      custom: raw[`${csvColumnPrefix}.custom`] || raw.custom,
      createShVersion: raw[`${csvColumnPrefix}.create_sh_ver`],
      modifyShVersion: raw[`${csvColumnPrefix}.modify_sh_ver`],
      clientDataVersion: raw[`${csvColumnPrefix}.client_data_ver`],
      clientDataId: raw[`${csvColumnPrefix}.client_data_id`],
    };
  });

export const SamsungHealthSnoringCsvRowSchema = z
  .object({
    source: z.string().optional(),
    tag_id: z.number().optional(),
    // A lot of things aren't really expected to be optional, but samsung is samsung
    create_sh_ver: z.number().optional(),
    "com.samsung.shealth.sleep_snoring.start_time": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.end_time": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.time_offset": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.datauuid": z.string().optional(),

    "com.samsung.shealth.sleep_snoring.create_sh_ver": z.number().optional(),
    "com.samsung.shealth.sleep_snoring.modify_sh_ver": z.string().or(z.number()).optional(),

    modify_sh_ver: z.string().or(z.number()).optional(),
    "com.samsung.shealth.sleep_snoring.update_time": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.create_time": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.deviceuuid": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.comment": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.pkg_name": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.custom": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.client_data_ver": z.string().optional(),
    "com.samsung.shealth.sleep_snoring.client_data_id": z.string().optional(),

    duration: z.number(),
    update_time: z.string().optional(),
    create_time: z.string().optional(),
    time_offset: z.string().optional(),
    datauuid: z.string().optional(),
    deviceuuid: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    pkg_name: z.string().optional(),
    custom: z.string().optional(),
  })
  .strict()
  .transform((raw) => {
    const csvColumnPrefix = "com.samsung.shealth.sleep_snoring";
    return {
      source: raw.source,
      tagId: raw.tag_id,
      deviceUuid: raw[`${csvColumnPrefix}.deviceuuid`] || raw.deviceuuid,
      packageName: raw[`${csvColumnPrefix}.pkg_name`] || raw.pkg_name,
      dataUuid: raw[`${csvColumnPrefix}.datauuid`] || raw.datauuid,
      startTime: raw[`${csvColumnPrefix}.start_time`] || raw.start_time,
      endTime: raw[`${csvColumnPrefix}.end_time`] || raw.end_time,
      createTime: raw[`${csvColumnPrefix}.create_time`],
      updateTime: raw[`${csvColumnPrefix}.update_time`],
      timeOffset: raw[`${csvColumnPrefix}.time_offset`] || raw.time_offset,
      comment: raw[`${csvColumnPrefix}.comment`],
      custom: raw[`${csvColumnPrefix}.custom`] || raw.custom,
      createShVersion: raw[`${csvColumnPrefix}.create_sh_ver`] || raw.create_sh_ver,
      modifyShVersion: raw[`${csvColumnPrefix}.modify_sh_ver`] || raw.modify_sh_ver,
      clientDataVersion: raw[`${csvColumnPrefix}.client_data_ver`],
      clientDataId: raw[`${csvColumnPrefix}.client_data_id`],
    };
  });

export const SamsungHealthStepCountCsvRowSchema = z
  .object({
    source: z.string().optional(),
    tag_id: z.number().optional(),
    run_step: z.coerce.number(),
    walk_step: z.coerce.number(),
    "com.samsung.health.step_count.create_sh_ver": z.number().optional(),
    "com.samsung.health.step_count.start_time": z.string(),
    "com.samsung.health.step_count.end_time": z.string(),
    "com.samsung.health.step_count.count": z.coerce.number(),
    "com.samsung.health.step_count.speed": z.coerce.number().optional(),
    "com.samsung.health.step_count.distance": z.coerce.number().optional(),
    "com.samsung.health.step_count.calorie": z.coerce.number().optional(),
    "com.samsung.health.step_count.time_offset": z.string(),
    "com.samsung.health.step_count.deviceuuid": z.string().optional(),
    "com.samsung.health.step_count.datauuid": z.string(),
    "com.samsung.health.step_count.modify_sh_ver": z.string().or(z.number()).optional(),
    "com.samsung.health.step_count.update_time": z.string().optional(),
    "com.samsung.health.step_count.create_time": z.string().optional(),
    "com.samsung.health.step_count.comment": z.string().optional(),
    "com.samsung.health.step_count.pkg_name": z.string().optional(),
    "com.samsung.health.step_count.custom": z.string().optional(),
    "com.samsung.health.step_count.client_data_ver": z.string().optional(),
    "com.samsung.health.step_count.client_data_id": z.string().optional(),
    "com.samsung.health.step_count.sample_position_type": z.string().optional(),
    version_code: z.number().optional(),
    duration: z.number().optional(),
  })
  .strict()
  .transform((raw) => {
    const csvColumnPrefix = "com.samsung.health.step_count";
    return {
      source: raw.source,
      tagId: raw.tag_id,
      runStep: raw.run_step,
      walkStep: raw.walk_step,
      deviceUuid: raw[`${csvColumnPrefix}.deviceuuid`],
      packageName: raw[`${csvColumnPrefix}.pkg_name`],
      dataUuid: raw[`${csvColumnPrefix}.datauuid`],
      startTime: raw[`${csvColumnPrefix}.start_time`],
      endTime: raw[`${csvColumnPrefix}.end_time`],
      createTime: raw[`${csvColumnPrefix}.create_time`],
      updateTime: raw[`${csvColumnPrefix}.update_time`],
      timeOffset: raw[`${csvColumnPrefix}.time_offset`],
      stepCount: raw[`${csvColumnPrefix}.count`],
      speed: raw[`${csvColumnPrefix}.speed`],
      distance: raw[`${csvColumnPrefix}.distance`],
      calories: raw[`${csvColumnPrefix}.calorie`],
      comment: raw[`${csvColumnPrefix}.comment`],
      custom: raw[`${csvColumnPrefix}.custom`],
      createShVersion: raw[`${csvColumnPrefix}.create_sh_ver`],
      modifyShVersion: raw[`${csvColumnPrefix}.modify_sh_ver`],
      clientDataVersion: raw[`${csvColumnPrefix}.client_data_ver`],
      clientDataId: raw[`${csvColumnPrefix}.client_data_id`],
      versionCode: raw.version_code,
      duration: raw.duration,
      positionType: raw["com.samsung.health.step_count.sample_position_type"],
    };
  });
