import { ActionIcon, Button, Container, Flex, Group, Space, Stack, Text } from "@mantine/core";
import {
  IconChecklist,
  IconEye,
  IconEyeOff,
  IconHome,
  IconLayoutDashboard,
  IconMapStar,
  IconSettings,
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

  const handlePrivateModeChange = () => {
    props.onChangePrivateMode(!props.privateMode);
  };

  const MainPages = () => {
    const isHome = location.pathname === "/";
    const isExplore = location.pathname.startsWith("/dashboard");
    const isHabits = location.pathname.startsWith("/habits");
    const isPoi = location.pathname.startsWith("/poi");

    return (
      <Stack gap={"xs"}>
        <Group p={"xs"}>
          <Logo width={30} height={30} />
          <Text fs={"italic"} size={"sm"} opacity={0.4}>
            Lomnia
          </Text>
        </Group>
        <Button
          leftSection={<IconHome size={20} />}
          component={Link}
          justify="flex-start"
          to="/"
          p={"xs"}
          variant={isHome ? "light" : "subtle"}
        >
          Home
        </Button>

        <Button
          leftSection={<IconLayoutDashboard size={20} />}
          component={Link}
          justify="flex-start"
          to="/dashboard"
          m={0}
          p={"xs"}
          variant={isExplore ? "light" : "subtle"}
        >
          Explore
        </Button>

        <Button
          leftSection={<IconChecklist size={20} />}
          component={Link}
          justify="flex-start"
          to="/habits/features"
          m={0}
          p={"xs"}
          variant={isHabits ? "light" : "subtle"}
        >
          Habits
        </Button>

        <Button
          leftSection={<IconMapStar size={20} />}
          component={Link}
          justify="flex-start"
          to="poi"
          m={0}
          p={"xs"}
          variant={isPoi ? "light" : "subtle"}
        >
          Places
        </Button>
      </Stack>
    );
  };

  const Settings = () => {
    const isSettings = location.pathname.startsWith("/settings");

    return (
      <>
        <ActionIcon variant={"transparent"} onClick={handlePrivateModeChange}>
          {!props.privateMode ? <IconEye /> : <IconEyeOff />}
        </ActionIcon>
        <ActionIcon bdrs={"lg"} variant={isSettings ? "light" : "transparent"} component={Link} to="/settings">
          <IconSettings />
        </ActionIcon>
      </>
    );
  };

  return (
    <Flex
      component={Container}
      p={0}
      w={"100%"}
      direction={"column"}
      fluid
      style={{ borderTopRightRadius: 20, borderBottomRightRadius: 20 }}
      bg={cardDarkBackground}
      h={"100%"}
    >
      <Space h={"lg"} />
      <Flex flex={1} m={0} direction={"column"} component={Container} p={0}>
        <MainPages />
      </Flex>
      <Flex direction={"column"} m={"xs"} component={Container} p={0} gap={"md"}>
        <Settings />
      </Flex>
      <Space h={"lg"} />
    </Flex>
  );
}
