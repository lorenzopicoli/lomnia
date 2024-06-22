import { useCallback } from 'react'
import useEventEmitter, { type HandlerParams } from './useEventEmitter'

export function useEventHandlers(
  setCurrentDatum: (datum: { x: string | number | Date; y: number }) => void
) {
  const handlePointerMove = useCallback(
    (params?: HandlerParams) => {
      setCurrentDatum(params?.emitterNearestDatum ?? { x: 0, y: 0 })
    },
    [setCurrentDatum]
  )

  useEventEmitter({ eventType: 'pointermove', handler: handlePointerMove })

  //   const handlePointerUp = useCallback((params?: HandlerParams) => {
  //   }, [])
  //   const handlePointerDown = useCallback((params?: HandlerParams) => {
  //   }, [])
  //   const handleFocus = useCallback((params?: HandlerParams) => {
  //   }, [])
  //   const handlePointerOut = useCallback((params?: HandlerParams) => {
  //   }, [])
  //   const handleBlur = useCallback((params?: HandlerParams) => {
  //   }, [])

  //   useEventEmitter({ eventType: 'pointerout', handler: handlePointerOut })
  //   useEventEmitter({ eventType: 'pointerup', handler: handlePointerUp })
  //   useEventEmitter({ eventType: 'pointerdown', handler: handlePointerDown })
  //   useEventEmitter({ eventType: 'focus', handler: handleFocus })
  //   useEventEmitter({ eventType: 'blur', handler: handleBlur })
}
