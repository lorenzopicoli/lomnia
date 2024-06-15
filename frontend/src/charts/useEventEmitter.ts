import {
  PointerEvent,
  FocusEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import { localPoint } from '@visx/event'
import { EventEmitterContext } from '@visx/xychart'

export type EventType =
  | 'pointermove'
  | 'pointerout'
  | 'pointerup'
  | 'pointerdown'
  | 'focus'
  | 'blur'

export type HandlerParams = {
  /** The react PointerEvent or FocusEvent. */
  event: PointerEvent | FocusEvent
  /** Position of the PointerEvent in svg coordinates. */
  svgPoint: ReturnType<typeof localPoint>
  /** The source of the event. This can be anything, but for this package is the name of the component which emitted the event. */
  source?: string
  emitterChartId?: string
  emitterNearestDatum?: {
    x: string | number | Date
    y: number
  }
}

export type Handler = (params?: HandlerParams) => void

/**
 * Hook for optionally subscribing to a specified EventType,
 * and returns emitter for emitting events.
 */
export default function useEventEmitter(params: {
  /** Type of event to subscribe to. */
  eventType?: EventType
  /** Handler invoked on emission of EventType event.  */
  handler?: Handler
  /** Optional valid sources for EventType subscription. */
  allowedSources?: string[]
  chartId?: string
  getNearestDatum?: (svgPoint: ReturnType<typeof localPoint>) => {
    x: string | number | Date
    y: number
  }
}) {
  const { eventType, handler, allowedSources, chartId, getNearestDatum } =
    params
  const emitter = useContext(EventEmitterContext)
  const allowedSourcesRef = useRef<string[] | undefined>()
  allowedSourcesRef.current = allowedSources // use ref so allowedSources[] can change without creating new handlers

  // wrap emitter.emit so we can enforce stricter type signature
  const emit = useCallback(
    (type: EventType, event: HandlerParams['event'], source?: string) => {
      if (emitter) {
        const svgPoint = localPoint(event)
        emitter.emit<HandlerParams>(type, {
          event,
          svgPoint,
          source,
          emitterChartId: chartId || 'unknown',
          emitterNearestDatum: getNearestDatum?.(svgPoint),
        })
      }
    },
    [chartId, emitter, getNearestDatum]
  )

  useEffect(() => {
    if (emitter && eventType && handler) {
      // register handler, with source filtering as needed
      const handlerWithSourceFilter: Handler = (params?: HandlerParams) => {
        if (
          !allowedSourcesRef.current ||
          (params?.source && allowedSourcesRef.current?.includes(params.source))
        ) {
          handler(params)
        }
      }
      emitter.on<HandlerParams>(eventType, handlerWithSourceFilter)
      return () =>
        emitter?.off<HandlerParams>(eventType, handlerWithSourceFilter)
    }
    return undefined
  }, [emitter, eventType, handler])

  return emitter ? emit : null
}
