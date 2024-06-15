import { useCallback } from 'react'
import useEventEmitter, { type HandlerParams } from './useEventEmitter'

export function useEventHandlers(
  listenerChartId: string,
  setCurrentDatum: (datum: { x: string | number | Date; y: number }) => void
) {
  //   const synchronizedContext = useContext(SynchronizedContext)
  const handlePointerMove = useCallback(
    (params?: HandlerParams) => {
      //   console.log(
      //     `onPointerMove being handled by ${listenerChartId}. The data is`
      //   )
      //   console.log(`emitterChartId: ${params?.emitterChartId}`)
      //   console.log(
      //     `emitterNearestDatum: ${JSON.stringify(
      //       params?.emitterNearestDatum,
      //       null,
      //       2
      //     )}`
      //   )

      setCurrentDatum(params?.emitterNearestDatum ?? { x: 0, y: 0 })
    },
    [setCurrentDatum]
  )
  const handlePointerUp = useCallback((params?: HandlerParams) => {
    //   console.log(
    //     `onPointerUp being handled by ${listenerChartId}. The data is`
    //   )
    //   console.log(`emitterChartId: ${params?.emitterChartId}`)
    //   console.log(
    //     `emitterNearestDatum: ${JSON.stringify(
    //       params?.emitterNearestDatum,
    //       null,
    //       2
    //     )}`
    //   )
  }, [])
  const handlePointerDown = useCallback((params?: HandlerParams) => {
    //   console.log(
    //     `onPointerDown being handled by ${listenerChartId}. The data is`
    //   )
    //   console.log(`emitterChartId: ${params?.emitterChartId}`)
    //   console.log(
    //     `emitterNearestDatum: ${JSON.stringify(
    //       params?.emitterNearestDatum,
    //       null,
    //       2
    //     )}`
    //   )
  }, [])
  const handleFocus = useCallback((params?: HandlerParams) => {
    //   console.log(`onFocus being handled by ${listenerChartId}. The data is`)
    //   console.log(`emitterChartId: ${params?.emitterChartId}`)
    //   console.log(
    //     `emitterNearestDatum: ${JSON.stringify(
    //       params?.emitterNearestDatum,
    //       null,
    //       2
    //     )}`
    //   )
  }, [])
  const handlePointerOut = useCallback((params?: HandlerParams) => {
    //   console.log(
    //     `onPointerOut being handled by ${listenerChartId}. The data is`
    //   )
    //   console.log(`emitterChartId: ${params?.emitterChartId}`)
    //   console.log(
    //     `emitterNearestDatum: ${JSON.stringify(
    //       params?.emitterNearestDatum,
    //       null,
    //       2
    //     )}`
    //   )
  }, [])
  const handleBlur = useCallback((params?: HandlerParams) => {
    //   console.log(`onBlur being handled by ${listenerChartId}. The data is`)
    //   console.log(`emitterChartId: ${params?.emitterChartId}`)
    //   console.log(`emitterNearestDatum: ${params?.emitterNearestDatum}`)
  }, [])

  useEventEmitter({ eventType: 'pointermove', handler: handlePointerMove })
  useEventEmitter({ eventType: 'pointerout', handler: handlePointerOut })
  useEventEmitter({ eventType: 'pointerup', handler: handlePointerUp })
  useEventEmitter({ eventType: 'pointerdown', handler: handlePointerDown })
  useEventEmitter({ eventType: 'focus', handler: handleFocus })
  useEventEmitter({ eventType: 'blur', handler: handleBlur })
}
