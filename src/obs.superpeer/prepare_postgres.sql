-- View: cow.allfeats

-- DROP VIEW cow.allfeats;

CREATE OR REPLACE VIEW ontw.allfeats AS 
 SELECT items._id AS gid,
    st_setsrid(st_geomfromgeojson((items.data -> 'feature'::text) ->> 'geometry'::text), 4326) AS geom,
    ((items.data -> 'feature'::text) -> 'properties'::text) ->> 'stroke'::text AS stroke,
    ((items.data -> 'feature'::text) -> 'properties'::text) ->> 'fill'::text AS fill,
    ((items.data -> 'feature'::text) -> 'properties'::text) ->> 'stroke-width'::text AS strokewidth,
    ((items.data -> 'feature'::text) -> 'properties'::text) ->> 'marker-url'::text AS markerurl,
    items.projectid,
    items.dirty,
    items.deleted,
    items.created,
    items.updated
   FROM test.items
  WHERE (items.data ->> 'type'::text) = 'feature'::text
  AND items.deleted = false;

ALTER TABLE ontw.allfeats
  OWNER TO cow;

  
  -- Function: notify_trigger()

-- DROP FUNCTION notify_trigger();

CREATE OR REPLACE FUNCTION notify_trigger()
  RETURNS trigger AS
$BODY$
DECLARE
BEGIN
  PERFORM pg_notify('watchers', TG_TABLE_NAME );
  RETURN new;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION notify_trigger()
  OWNER TO geodan;

  
  -- Function: update_modified_column()

-- DROP FUNCTION update_modified_column();

CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS trigger AS
$BODY$
	BEGIN
	   NEW.updated = round(extract(epoch from now())*1000); 
	   RETURN NEW;
	END;
	$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION update_modified_column()
  OWNER TO geodan;
