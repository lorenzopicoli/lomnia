import { isValid, parse } from 'date-fns'
import { isNotNull, sql } from 'drizzle-orm'
import { db } from '../../db/connection'
import { anonymize } from '../../helpers/anonymize'
import { habitsTable, type Habit } from '../../models/Habit'
import type { HabitKeys } from '../importers/obsidian/personal'
import { habitLabel, habitTransformers } from './personal'
import type { DateTime } from 'luxon'

export const formatHabitResponse = (
  habits: Habit[],
  shouldAnonymize: boolean
): (Habit & { label: string })[] => {
  return habits
    .filter((h) => !!h.value)
    .map((h) => {
      const key = h.key as HabitKeys
      const transformer = habitTransformers[key]
      const value = transformer ? transformer(h.value) : h.value
      const label = habitLabel[h.key as HabitKeys]

      return {
        ...h,
        key: shouldAnonymize ? anonymize(key) : key,
        value: shouldAnonymize ? anonymize(value) : value,
        label: shouldAnonymize ? anonymize(label) : label,
      }
    })
}

export async function getHabits(params: { day: string; privateMode: boolean }) {
  const { day, privateMode } = params
  if (!isValid(parse(day, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid day')
  }
  const entries = await db.query.habitsTable.findMany({
    where: sql`date::date = ${day}`,
  })

  return formatHabitResponse(entries, privateMode)
}

export async function getHabitsAnalyticsKeys() {
  const keys = await db
    .select({
      key: habitsTable.key,
    })
    .from(habitsTable)
    .where(isNotNull(habitsTable.key))
    .groupBy(habitsTable.key)

  return keys.map((k) => ({ key: k.key, description: k.key }))
}
export async function getHabitsAnalytics(params: {
  startDate: DateTime
  endDate: DateTime
  keys: string[]
}) {
  const data = await db
    .select({
      date: habitsTable.date,
      entry: sql`jsonb_object_agg(${habitsTable.key}, ${habitsTable.value})`,
    })
    .from(habitsTable)
    .where(
      sql`
      ${habitsTable.key} IN ${params.keys}
      AND
      ${
        habitsTable.date
      } >= (${params.startDate.toISO()} AT TIME ZONE 'America/Toronto')::date 
      AND ${
        habitsTable.date
      } <= (${params.endDate.toISO()} AT TIME ZONE 'America/Toronto')::date`
    )
    .groupBy(habitsTable.date)

  return data as { date: string; entry: Record<string, unknown> }[]
}
