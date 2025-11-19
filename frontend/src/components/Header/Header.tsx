import { ActionIcon, Button, Center, Code, Container, Flex, Input } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconEye, IconEyeOff, IconSearch } from "@tabler/icons-react";
import { format } from "date-fns/format";
import { isToday } from "date-fns/isToday";
import { useConfig } from "../../contexts/ConfigContext";

type HeaderProps = {
  onPreviousDay: () => void;
  onNextDay: () => void;
  onSearch: (query: string) => void;
  onChangePrivateMode: (privateMode: boolean) => void;
  onGoToExplore: () => void;
  onGoToHome: () => void;
  currentDate: Date;
  privateMode: boolean;
};

function Header(props: HeaderProps) {
  const formattedDate = format(props.currentDate, "MMMM do, yyyy");
  const { theme } = useConfig();

  const handlePrivateModeChange = () => {
    props.onChangePrivateMode(!props.privateMode);
  };

  return (
    <Flex component={Container} fluid justify={"space-between"} align={"center"} bg={theme.colors.dark[9]} h={"100%"}>
      <Flex component={Container} justify={"center"} align={"center"} bg={theme.colors.dark[9]} h={"100%"}>
        <Button variant="subtle" onClick={props.onGoToHome}>
          Home
        </Button>
        <Button variant="subtle" onClick={props.onGoToExplore}>
          Explore
        </Button>
      </Flex>
      <Flex flex={1} component={"h2"} gap={"lg"} justify={"center"} align={"center"}>
        <Button onClick={props.onPreviousDay} variant="subtle">
          <Center>
            <IconChevronLeft />
          </Center>
        </Button>
        {formattedDate}
        <Button onClick={props.onNextDay} disabled={isToday(props.currentDate)} variant="subtle">
          <Center>
            <IconChevronRight />
          </Center>
        </Button>
      </Flex>
      <Flex align={"center"} gap="md">
        <Input
          radius={10}
          placeholder="Search..."
          leftSection={<IconSearch size={16} />}
          rightSection={<Code>⌘ + K</Code>}
          rightSectionWidth={80}
        />
        <ActionIcon
          variant={!props.privateMode ? "light" : "light"}
          size="lg"
          onClick={handlePrivateModeChange}
          mr={"lg"}
        >
          {!props.privateMode ? <IconEye /> : <IconEyeOff />}
        </ActionIcon>
      </Flex>
    </Flex>
  );
}

export default Header;
