alter table public.time_slots
  add column if not exists sort_order integer not null default 0;

with ordered as (
  select id, row_number() over (order by value asc) * 10 as rn
  from public.time_slots
)
update public.time_slots
set sort_order = ordered.rn
from ordered
where public.time_slots.id = ordered.id;
