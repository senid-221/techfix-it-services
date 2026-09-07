-- On-site bookings must carry a complete Rwanda administrative location.
-- NOT VALID keeps existing historical rows intact while enforcing the rule for new/updated rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_on_site_complete_location_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_on_site_complete_location_check
      CHECK (
        service_method <> 'ON_SITE'
        OR (
          btrim(coalesce(province, '')) <> ''
          AND btrim(coalesce(district, '')) <> ''
          AND btrim(coalesce(sector, '')) <> ''
          AND btrim(coalesce(cell, '')) <> ''
          AND btrim(coalesce(address, '')) <> ''
        )
      ) NOT VALID;
  END IF;
END $$;
