import { Container } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../api/trpc";
import { ReadonlyPoiMap } from "../components/PoiMaps/ReadonlyPoiMap";

export function PlaceOfInterestMapContainer(props: { search?: string }) {
  const { data: allPOIsGeoJSONs } = useQuery(
    trpc.placesOfInterest.getAllGeoJSON.queryOptions({ search: props.search }),
  );
  return (
    <Container style={{ overflow: "clip" }} bdrs={"lg"} h={"100%"} w={"100%"} fluid p={0}>
      <ReadonlyPoiMap
        readonlyPolygons={allPOIsGeoJSONs?.map((poi) => ({ name: poi.name, feature: poi.geoJson as any }))}
      />
    </Container>
  );
}
