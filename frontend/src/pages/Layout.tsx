import { AppShell, Burger, Drawer, useMantineTheme } from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { Route, Routes } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { AddHabitFeature } from "./AddHabitFeature/AddHabitFeature";
import { AddPlaceOfInterestPage } from "./AddPlaceOfInterest/AddPlaceOfInterestPage";
import { Explore } from "./Explore/Explore";
import { HabitsPage } from "./Habits/Habits";
import { PlacesOfInterestPage } from "./PlacesOfInterest/PlacesOfInterestPage";
import ActivityTimelinePage from "./Timeline/ActivityTimelinePage";

export default function Layout() {
  const theme = useMantineTheme();
  const [opened, { toggle, close }] = useDisclosure(false);

  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);

  return (
    <>
      <AppShell
        withBorder={false}
        navbar={
          isDesktop
            ? {
                width: 180,
                breakpoint: "md",
              }
            : undefined
        }
        header={{ height: isDesktop ? 0 : 30 }}
      >
        {!isDesktop ? (
          <AppShell.Header bg={theme.colors.dark[9]}>
            <Burger opened={opened} onClick={toggle} size="sm" m="sm" />
          </AppShell.Header>
        ) : null}

        {isDesktop && (
          <AppShell.Navbar bg={theme.colors.dark[9]}>
            <Navbar />
          </AppShell.Navbar>
        )}

        <AppShell.Main>
          <Routes>
            <Route index element={<ActivityTimelinePage />} />
            <Route path={"/dashboard/*"} element={<Explore />} />
            <Route path={"/habits/features/add"} element={<AddHabitFeature />} />
            <Route path="/habits/features/edit/:featureId" element={<AddHabitFeature />} />
            <Route path={"/habits/*"} element={<HabitsPage />} />
            <Route path={"/poi/add"} element={<AddPlaceOfInterestPage />} />
            <Route path={"/poi/:poiId/edit"} element={<AddPlaceOfInterestPage />} />
            <Route path={"/poi/*"} element={<PlacesOfInterestPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>

      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        withCloseButton={false}
        p={0}
        styles={{
          body: {
            padding: 0,
            height: "100%",
          },
          content: { backgroundColor: theme.colors.dark[9] },
        }}
      >
        <Navbar onNavigate={close} />
      </Drawer>
    </>
  );
}
