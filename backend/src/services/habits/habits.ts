import { isValid, parse } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '../../db/connection'
import { anonymize } from '../../helpers/anonymize'
import type { Habit } from '../../models/Habit'
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
