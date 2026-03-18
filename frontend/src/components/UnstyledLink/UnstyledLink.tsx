import { Link, type LinkProps } from "react-router-dom";

export function UnstyledLink(props: LinkProps) {
  return <Link style={{ color: "inherit", textDecoration: "none" }} {...props} />;
}
