import type { RouterOutputs } from "../../api/trpc";
import { formatCadence } from "../../utils/formatCadence";
import { formatDistance } from "../../utils/formatDistance";
import { formatHeartRate } from "../../utils/formatHeartRate";
import { formatPace } from "../../utils/formatPace";
import { Table, type TableColumn } from "../Table/Table";

type ExerciseLap = NonNullable<Required<RouterOutputs["exercise"]["getById"]["laps"]>>[number];
export function ExerciseLapsTable({ laps }: { laps: ExerciseLap[] }) {
  const columns: TableColumn<ExerciseLap>[] = [
    {
      key: "distance",
      header: "Distance",
      render: (lap) => formatDistance(lap.distance ?? 0),
    },
    {
      key: "avgPace",
      header: "Avg Pace",
      render: (lap) => formatPace(lap.avgPace),
    },
    {
      key: "maxPace",
      header: "Max Pace",
      render: (lap) => formatPace(lap.maxPace),
    },
    {
      key: "avgHR",
      header: "Avg HR",
      render: (lap) => formatHeartRate(lap.avgHeartRate ?? 0),
    },
    {
      key: "maxHR",
      header: "Max HR",
      render: (lap) => formatHeartRate(lap.maxHeartRate ?? 0),
    },
    {
      key: "cadence",
      header: "Cadence",
      render: (lap) => formatCadence(lap.avgCadence ?? 0),
    },
    {
      key: "maxCadence",
      header: "Max Cad",
      render: (lap) => formatCadence(lap.maxCadence ?? 0),
    },
    {
      key: "stepLength",
      header: "Step Len",
      render: (lap) => `${lap.avgStepLength} cm`,
    },
    {
      key: "stanceTime",
      header: "Ground Contact",
      render: (lap) => `${lap.avgStanceTime} ms`,
    },
    {
      key: "verticalOsc",
      header: "Vert Osc",
      render: (lap) => `${lap.avgVerticalOscillation} cm`,
    },
  ];

  return <Table data={laps} columns={columns} getRowKey={(lap) => lap.id} />;
}
