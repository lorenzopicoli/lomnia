import cs from "classnames";
import type { ReactNode } from "react";
import { useConfig } from "../../contexts/ConfigContext";
import styles from "./Anonymize.module.css";

export function Anonymize({ children }: { children: ReactNode }) {
  const config = useConfig();
  return <span className={cs({ [styles.hidden]: config.privateMode })}>{children}</span>;
}
