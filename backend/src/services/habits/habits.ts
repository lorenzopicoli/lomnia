import { isValid, parse } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '../../db/connection'
import type { Habit } from '../../db/schema'
import { anonymize } from '../../helpers/anonymize'
import type { GetHabitEntriesParams } from '../../routes/habits'
import type { HabitKeys } from '../importers/obsidian/personal'
import { habitLabel, habitTransformers } from './personal'

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

export async function getHabits(params: GetHabitEntriesParams) {
  const { startDate, endDate, privateMode } = params
  if (!isValid(parse(startDate, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid startDate')
  }
  if (!isValid(parse(endDate, 'yyyy-MM-dd', new Date()))) {
    throw new Error('Invalid endDate')
  }
  const entries = await db.query.habitsTable.findMany({
    where: sql`date::date >= ${startDate} AND date::date <= ${endDate}`,
  })

  return {
    habitEntries: formatHabitResponse(entries, privateMode),
  }
}
