import { Button, Container, Flex, Group, Space, Stack, Text } from "@mantine/core";
import {
  IconChecklist,
  IconEye,
  IconEyeOff,
  IconLayoutDashboard,
  IconMapStar,
  IconSettings,
  IconTimeline,
  type ReactNode,
} from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import { cardDarkBackground } from "../../themes/mantineThemes";
import { Logo } from "../Logo";

type HeaderProps = {
  onChangePrivateMode: (privateMode: boolean) => void;

  privateMode: boolean;
};

export default function Navbar(props: HeaderProps) {
  const location = useLocation();

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

        <NavButton to="/" label="Timeline" icon={<IconTimeline size={20} />} active={isTimeline} />
        <NavButton to="/dashboard" label="Explore" icon={<IconLayoutDashboard size={20} />} active={isExplore} />
        <NavButton to="/habits/features" label="Habits" icon={<IconChecklist size={20} />} active={isHabits} />
        <NavButton to="/poi" label="Places" icon={<IconMapStar size={20} />} active={isPoi} />
      </Stack>
    );
  };

  const Settings = () => {
    const isSettings = location.pathname.startsWith("/settings");

    return (
      <Stack gap={"xs"}>
        <NavButton
          to="/"
          label="Hide"
          icon={!props.privateMode ? <IconEye /> : <IconEyeOff />}
          active={props.privateMode}
        />
        <NavButton to={"/settings"} label="Settings" icon={<IconSettings />} active={isSettings} />
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

export function NavButton(props: { to: string; icon: ReactNode; label: string; active?: boolean }) {
  const { to, icon, label, active } = props;
  return (
    <Button
      component={Link}
      to={to}
      leftSection={icon}
      justify="flex-start"
      p="xs"
      variant={active ? "light" : "subtle"}
    >
      {label}
    </Button>
  );
}
