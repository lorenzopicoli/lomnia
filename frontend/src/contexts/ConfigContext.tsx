import { type MantineTheme, useMantineTheme } from "@mantine/core";
import type React from "react";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

interface Config {
  privateMode: boolean;
  theme: MantineTheme;
  echartsTheme: string;
}

interface ConfigContextType extends Config {
  updateConfig: (updates: Partial<Config>) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useMantineTheme();
  const [config, setConfig] = useState<Omit<Config, "theme" | "echartsTheme">>({
    privateMode: false,
  });
  const echartsTheme = "default_dark";

  const updateConfig = (updates: Partial<Config>) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...updates }));
  };

  const mergedConfig = useMemo(() => {
    return {
      ...config,
      theme,
      echartsTheme,
    };
  }, [theme, config]);

  return <ConfigContext.Provider value={{ ...mergedConfig, updateConfig }}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
