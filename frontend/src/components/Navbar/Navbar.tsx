import { Button, Container, Flex, Group, Space, Stack, Text } from "@mantine/core";
import {
  IconChecklist,
  IconEye,
  IconLayoutDashboard,
  IconMapStar,
  IconSettings,
  IconTimeline,
} from "@tabler/icons-react";

import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { Logo } from "../logos/Logo";

type HeaderProps = {
  // onChangePrivateMode: (privateMode: boolean) => void;
  // privateMode: boolean;
  onNavigate?: () => void;
};

export default function Navbar(props: HeaderProps) {
  const location = useLocation();
  const { onNavigate } = props;

  // const handlePrivateModeChange = () => {
  //   props.onChangePrivateMode(!props.privateMode);
  // };

  const MainPages = () => {
    const isTimeline = location.pathname === "/";
    const isExplore = location.pathname.startsWith("/dashboard");
    const isHabits = location.pathname.startsWith("/habits");
    const isPoi = location.pathname.startsWith("/poi");

    return (
      <Stack gap={"xs"}>
        <Group p="xs">
          <Logo width={30} height={30} />
          <Text fs="italic" size="sm" opacity={0.4}>
            Lomnia
          </Text>
        </Group>

        <NavButton to="/" label="Timeline" icon={<IconTimeline size={20} />} active={isTimeline} onClick={onNavigate} />
        <NavButton
          to="/dashboard"
          label="Explore"
          icon={<IconLayoutDashboard size={20} />}
          active={isExplore}
          onClick={onNavigate}
        />
        <NavButton
          to="/habits/features"
          label="Habits"
          icon={<IconChecklist size={20} />}
          active={isHabits}
          onClick={onNavigate}
        />
        <NavButton to="/poi" label="Places" icon={<IconMapStar size={20} />} active={isPoi} onClick={onNavigate} />
      </Stack>
    );
  };

  const Settings = () => {
    const isSettings = location.pathname.startsWith("/settings");

    return (
      <Stack gap={"xs"}>
        <NavButton to="/" label="Hide" icon={<IconEye />} active={false} onClick={onNavigate} />
        <NavButton to={"/settings"} label="Settings" icon={<IconSettings />} active={isSettings} onClick={onNavigate} />
      </Stack>
    );
  };

  return (
    <Flex component={Container} p={0} w={"100%"} direction={"column"} fluid bg={cardDarkBackground} h={"100%"}>
      <Space h={"lg"} />
      <Flex flex={1} m={0} direction={"column"} component={Container} p={0}>
        <MainPages />
      </Flex>
      <Flex justify={"flex-end"} flex={1} m={0} direction={"column"} component={Container} p={0}>
        <Settings />
      </Flex>
      <Space h={"lg"} />
    </Flex>
  );
}

export function NavButton(props: {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const { to, icon, label, active, onClick } = props;
  return (
    <Button
      component={Link}
      to={to}
      leftSection={icon}
      justify="flex-start"
      p="xs"
      variant={active ? "light" : "subtle"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
