import type React from 'react'
import { type ReactNode, createContext, useState } from 'react'

interface Config {
  privateMode: boolean
}

export interface ConfigContextType extends Config {
  updateConfig: (updates: Partial<Config>) => void
}

export const ConfigContext = createContext<ConfigContextType | undefined>(
  undefined
)

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<Config>({
    privateMode: false,
  })

  const updateConfig = (updates: Partial<Config>) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...updates }))
  }

  return (
    <ConfigContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}
