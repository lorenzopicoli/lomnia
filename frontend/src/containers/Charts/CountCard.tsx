import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { trpc } from '../../api/trpc'
import type { CountCardChartProps } from '../../charts/types'
import { TextCardChart } from '../../components/TextCardChart/TextCardChart'
import { formatCompactNumber } from '../../utils/formatCompactNumber'

export function CountCard(props: CountCardChartProps) {
  const { countKey, compactNumbers } = props
  const { data } = useQuery(
    trpc.charts.counts.getCounts.queryOptions({
      // The key wil be validated at run time
      countKey: countKey as any,
    })
  )
  const formattedData = useMemo(() => {
    if (!data) {
      return '-'
    }
    if (compactNumbers) {
      return formatCompactNumber(data)
    }
    return data
  }, [data, compactNumbers])
  return <TextCardChart {...props} value={formattedData} />
}
