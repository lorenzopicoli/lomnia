import { DateTime } from "luxon";
import z from "zod";

export const LuxonDateTime = z.iso.datetime().transform((s) => DateTime.fromISO(s, { zone: "UTC" }));
