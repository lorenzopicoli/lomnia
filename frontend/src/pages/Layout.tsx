import { AppShell } from "@mantine/core";
import { Route, Routes } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { useConfig } from "../contexts/ConfigContext";
import { AddHabitFeature } from "./AddHabitFeature/AddHabitFeature";
import { Explore } from "./Explore/Explore";
import { HabitsPage } from "./Habits/Habits";
import Home from "./Home/Home";

function Layout() {
  const config = useConfig();
  const { theme } = useConfig();

  const handleChangePrivateMode = (mode: boolean) => config.updateConfig({ privateMode: mode });

  return (
    <AppShell navbar={{ width: { sm: 70, lg: 70 }, breakpoint: "sm" }} withBorder={false}>
      <AppShell.Navbar style={{ borderRadius: 0 }} bg={theme.colors.dark[9]}>
        <Navbar onChangePrivateMode={handleChangePrivateMode} privateMode={config.privateMode} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route index element={<Home />} />
          <Route path={"/dashboard/*"} element={<Explore />} />
          <Route path={"/habits/features/add"} element={<AddHabitFeature />} />
          <Route path="/habits/features/edit/:featureId" element={<AddHabitFeature />} />
          <Route path={"/habits/*"} element={<HabitsPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;
