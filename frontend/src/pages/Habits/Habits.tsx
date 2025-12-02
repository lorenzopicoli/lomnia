import { ActionIcon, Button, Container, Flex, Input, Paper, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconPlus, IconSearch, IconTable, IconTransform } from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { StringParam, useQueryParams } from "use-query-params";
import { HabitsFeaturesTable } from "../../containers/HabitsFeaturesTable";
import { RawHabitsTable } from "../../containers/RawHabitsTable";
import { useConfig } from "../../contexts/ConfigContext";

export function HabitsPage() {
  const { theme } = useConfig();
  const navigate = useNavigate();
  const [params, setParams] = useQueryParams({
    search: StringParam,
  });

  const search = params.search ?? "";
  const [debouncedParams] = useDebouncedValue(params, 300);
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setParams({ search: event.currentTarget.value });
  };

  return (
    <Paper component={Container} fluid bg={theme.colors.dark[9]}>
      <Stack pt={"md"} h="100vh" style={{ overflow: "hidden" }}>
        <Flex w={"100%"} direction={"row"} justify={"space-between"} align={"center"} p={0}>
          <Container p={0} m={0} flex={1}>
            <Input
              flex={1}
              onChange={handleSearchChange}
              value={search}
              placeholder="Search"
              leftSection={<IconSearch size={16} />}
              maw={400}
            />
          </Container>
          <Routes>
            <Route
              index
              element={
                <Button
                  variant="subtle"
                  leftSection={<IconTransform size={16} />}
                  component={Link}
                  to="/habits/features"
                >
                  Habits Features
                </Button>
              }
            />
            <Route
              path={"features"}
              element={
                <Flex p={0} m={0} align={"center"} gap={"lg"}>
                  <ActionIcon m={0} variant="filled" size="lg" radius={"xl"} component={Link} to="/habits/features/add">
                    <IconPlus />
                  </ActionIcon>
                  <Button variant="subtle" leftSection={<IconTable size={16} />} component={Link} to="/habits">
                    Raw Habits
                  </Button>
                </Flex>
              }
            />
          </Routes>
        </Flex>

        <Routes>
          <Route index element={<RawHabitsTable search={debouncedParams.search ?? undefined} />} />
          <Route path={"features"} element={<HabitsFeaturesTable search={debouncedParams.search ?? undefined} />} />
        </Routes>
      </Stack>
    </Paper>
  );
}
