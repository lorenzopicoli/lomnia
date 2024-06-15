import { createContext, useState, type ReactNode } from 'react'
import { useEventHandlers } from './useEventHandlers'

export type SynchronizedContextType = {
  isHovering: boolean
  setIsHovering: (isHovering: boolean) => void
  currentDatum?: {
    x: string | number | Date
    y: number
  }
  setCurrentDatum: (datum: { x: string | number | Date; y: number }) => void
}
export const SynchronizedContext =
  createContext<SynchronizedContextType | null>(null)

export const SynchronizedProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [currentDatum, setCurrentDatum] = useState<{
    x: string | number | Date
    y: number
  }>()

  useEventHandlers('synchronized', setCurrentDatum)
  return (
    <SynchronizedContext.Provider
      value={{ isHovering, setIsHovering, currentDatum, setCurrentDatum }}
    >
      {children}
    </SynchronizedContext.Provider>
  )
}
