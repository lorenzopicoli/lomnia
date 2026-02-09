select 
  ST_X(locations.location::geometry) as lng,
  ST_Y(locations.location::geometry) as lat
from locations
where location_details_id = 757

