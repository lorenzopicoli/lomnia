select 
  ST_X(locations.location::geometry) as lng,
  ST_Y(locations.location::geometry) as lat
from locations
inner join location_details
  on location_details.id = locations.location_details_id
where exists (
  select 1 
  from places_of_interest 
  where places_of_interest.location_details_id = location_details.id
)

