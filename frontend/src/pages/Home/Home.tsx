import { Container, Paper } from "@mantine/core";
import { addDays, format, subDays } from "date-fns";
import { parse } from "date-fns/parse";
import { startOfDay } from "date-fns/startOfDay";
import { createSearchParams, useNavigate, useSearchParams } from "react-router-dom";
import { useConfig } from "../../contexts/ConfigContext";
import HomeMain from "./HomeMain";

function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlDayFormat = "yyyy-MM-dd";
  const daySearchParam = searchParams.get("day");
  const day = daySearchParam ? startOfDay(parse(daySearchParam, urlDayFormat, new Date())) : startOfDay(new Date());

  const handleNextDay = () => {
    const dayAfter = format(addDays(day, 1), urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day: dayAfter,
      }).toString(),
    });
  };
  const handleSetDay = (date: Date) => {
    const day = format(date, urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day,
      }).toString(),
    });
  };

  const handlePreviousDayClick = () => {
    const dayBefore = format(subDays(day, 1), urlDayFormat);
    navigate({
      pathname: "",
      search: createSearchParams({
        day: dayBefore,
      }).toString(),
    });
  };

  const { theme } = useConfig();
  return (
    <Paper component={Container} fluid h={"100vh"} bg={theme.colors.dark[9]}>
      <HomeMain onSetDay={handleSetDay} onPreviousDay={handlePreviousDayClick} onNextDay={handleNextDay} day={day} />
    </Paper>
  );
}

export default Home;
