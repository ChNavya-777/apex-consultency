CREATE TABLE public.dayotter_booking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  emails TEXT[] NOT NULL DEFAULT '{}',
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.dayotter_booking_events TO service_role;

ALTER TABLE public.dayotter_booking_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX dayotter_booking_events_emails_idx ON public.dayotter_booking_events USING GIN (emails);
CREATE INDEX dayotter_booking_events_received_at_idx ON public.dayotter_booking_events (received_at DESC);