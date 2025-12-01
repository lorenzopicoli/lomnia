import { ActionIcon, Container, Flex, Space, Stack } from "@mantine/core";
import { IconChecklist, IconEye, IconEyeOff, IconHome, IconLayoutDashboard, IconSettings } from "@tabler/icons-react";
import { useLocation } from "react-router-dom";
import { cardDarkBackground } from "../../themes/mantineThemes";

type HeaderProps = {
  onChangePrivateMode: (privateMode: boolean) => void;
  onGoToExplore: () => void;
  onGoToHome: () => void;
  onGoToSettings: () => void;
  onGoToHabits: () => void;
  privateMode: boolean;
};

export default function Navbar(props: HeaderProps) {
  const location = useLocation();

  const handlePrivateModeChange = () => {
    props.onChangePrivateMode(!props.privateMode);
  };

  const MainPages = () => {
    const isHome = location.pathname === "/";
    const isExplore = location.pathname.startsWith("/explore");
    const isHabits = location.pathname.startsWith("/habits");

    return (
      <Stack gap={"lg"}>
        <ActionIcon bdrs={"lg"} size={"lg"} variant={isHome ? "light" : "transparent"} onClick={props.onGoToHome}>
          <IconHome />
        </ActionIcon>

        <ActionIcon bdrs={"lg"} size={"lg"} variant={isExplore ? "light" : "transparent"} onClick={props.onGoToExplore}>
          <IconLayoutDashboard />
        </ActionIcon>

        <ActionIcon bdrs={"lg"} size={"lg"} variant={isHabits ? "light" : "transparent"} onClick={props.onGoToHabits}>
          <IconChecklist />
        </ActionIcon>
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
        <ActionIcon
          bdrs={"lg"}
          size={"lg"}
          variant={isSettings ? "light" : "transparent"}
          onClick={props.onGoToSettings}
        >
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
      <Space h={"xl"} />
      <Flex flex={1} direction={"column"} component={Container} p={0}>
        <MainPages />
      </Flex>
      <Flex direction={"column"} component={Container} p={0} gap={"md"}>
        <Settings />
      </Flex>
      <Space h={"lg"} />
    </Flex>
  );
}
