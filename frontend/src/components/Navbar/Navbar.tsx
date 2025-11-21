import { ActionIcon, Container, Flex, Space, Stack } from "@mantine/core";
import {
  IconEye,
  IconEyeOff,
  IconHome,
  IconHomeFilled,
  IconLayoutDashboard,
  IconLayoutDashboardFilled,
  IconSettings,
  IconSettingsFilled,
} from "@tabler/icons-react";
import { Route, Routes } from "react-router-dom";
import { cardDarkBackground } from "../../themes/mantineThemes";

type HeaderProps = {
  onChangePrivateMode: (privateMode: boolean) => void;
  onGoToExplore: () => void;
  onGoToHome: () => void;
  onGoToSettings: () => void;
  privateMode: boolean;
};

export default function Navbar(props: HeaderProps) {
  const handlePrivateModeChange = () => {
    props.onChangePrivateMode(!props.privateMode);
  };

  const MainPages = () => {
    return (
      <Stack gap={"lg"}>
        <ActionIcon variant="transparent" onClick={props.onGoToHome}>
          <Routes>
            <Route path={"/"} element={<IconHomeFilled />} />
            <Route path={"*"} element={<IconHome />} />
          </Routes>
        </ActionIcon>
        <ActionIcon variant="transparent" onClick={props.onGoToExplore}>
          <Routes>
            <Route path={"/explore/*"} element={<IconLayoutDashboardFilled />} />
            <Route path={"*"} element={<IconLayoutDashboard />} />
          </Routes>
        </ActionIcon>
      </Stack>
    );
  };

  const Settings = () => {
    return (
      <>
        <ActionIcon variant={"transparent"} onClick={handlePrivateModeChange}>
          {!props.privateMode ? <IconEye /> : <IconEyeOff />}
        </ActionIcon>
        <ActionIcon variant="transparent" onClick={props.onGoToSettings}>
          <Routes>
            <Route path={"/settings/*"} element={<IconSettingsFilled />} />
            <Route path={"*"} element={<IconSettings />} />
          </Routes>
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
