import type React from "react";
import { createContext, type ReactNode, useContext, useState } from "react";

interface Config {
  privateMode: boolean;
}

interface ConfigContextType extends Config {
  updateConfig: (updates: Partial<Config>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Config>({
    privateMode: false,
  });

  const updateConfig = (updates: Partial<Config>) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...updates }));
  };

  return <ConfigContext.Provider value={{ ...config, updateConfig }}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
