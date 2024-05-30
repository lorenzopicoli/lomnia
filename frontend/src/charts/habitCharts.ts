import type { RouterOutputs } from '../api/trpc'
import { getKeys } from '../utils/getKeys'
import { getMinMax } from '../utils/getMinMax'
import type { Chart, LineData } from './charts'

export type HabitAnalytics = RouterOutputs['getHabitAnalytics'][number]

export function getHabitLineChart(
  habitsData: HabitAnalytics[],
  chart: Chart
): { data: HabitAnalytics[]; lines: LineData<HabitAnalytics>[] } {
  const habitMinMax =
    habitsData && habitsData.length > 0
      ? getMinMax<HabitAnalytics, Record<string, number>>(
          habitsData,
          'entry',
          getKeys(habitsData[0].entry)
        )
      : null
  return {
    data: habitsData ?? [],
    lines: [
      {
        id: chart.id,
        max: habitMinMax?.max[chart.id].entry,
        min: habitMinMax?.min[chart.id].entry,
        accessors: {
          getX: (data: HabitAnalytics) => new Date(data.date),
          // TODO: Assuming number here
          getY: (data: HabitAnalytics) => data.entry[chart.id] as number,
        },
        labels: {
          description: chart.title,
          showMaxLabel: true,
          showMinLabel: true,
          maxLabel: (value: number, unit: string) =>
            `Highest point: ${value}${unit}`,
          minLabel: (value: number, unit: string) =>
            `Lowest point: ${value}${unit}`,
          unit: '',
        },
      },
    ],
  }
}
