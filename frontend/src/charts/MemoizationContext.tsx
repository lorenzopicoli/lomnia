import { createContext, useCallback, useMemo, type ReactNode } from 'react'
import { datumAccessors } from './useChartData'

export type MemoizedGetNearestDatumParams = {
  data: { x: string | Date | number; y: number }[]
  dataHash: string
  datumXAccessorKey: keyof typeof datumAccessors
  datumYAccessorKey: keyof typeof datumAccessors
  point: {
    x: string | number | Date
  }
}

export type MemoizedGetNearestDatumReturn = {
  x: string | number | Date
  y: number
  //   datum: { x: string | Date | number; y: number }
} | null

export type MemoizationContextType = {
  memoizedGetNearestDatum: (
    params: MemoizedGetNearestDatumParams
  ) => MemoizedGetNearestDatumReturn
}
export const MemoizationContext = createContext<MemoizationContextType | null>(
  null
)

export const MemoizationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const memoizedGetNearestDatum = useCallback(() => {
    const cache: Record<string, MemoizedGetNearestDatumReturn> = {}
    const cacheKey = (params: MemoizedGetNearestDatumParams) =>
      `${params.dataHash}-${params.datumXAccessorKey}-${params.point.x}-${params.datumYAccessorKey}`

    const func = (
      params: MemoizedGetNearestDatumParams
    ): MemoizedGetNearestDatumReturn => {
      const key = cacheKey(params)
      if (cache[key]) {
        return cache[key]
      }

      let currentClosest = Infinity
      let currentClosestDatum: { x: string | Date | number; y: number } | null =
        null
      const { data, datumXAccessorKey, point, datumYAccessorKey } = params
      const getX = datumAccessors[datumXAccessorKey]
      for (const d of data) {
        const x = +getX(d)
        const distance = Math.abs(x - +point.x)
        if (distance < currentClosest) {
          currentClosest = distance
          currentClosestDatum = d
        }
      }
      if (!currentClosestDatum) {
        return null
      }
      const xY = {
        x: getX(currentClosestDatum),
        y: +datumAccessors[datumYAccessorKey](currentClosestDatum),
      }
      cache[key] = xY

      return xY
    }

    return func
  }, [])
  const values = useMemo(
    () => ({
      memoizedGetNearestDatum: memoizedGetNearestDatum(),
    }),
    [memoizedGetNearestDatum]
  )

  return (
    <MemoizationContext.Provider value={values}>
      {children}
    </MemoizationContext.Provider>
  )
}
