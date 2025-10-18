-- Count events by "end at midnight" shape (common collapse cause)
with e as (
  select
    id,
    "startsAt",
    "endsAt",
    extract(hour from "endsAt") = 0
    and extract(minute from "endsAt") = 0
    and extract(second from "endsAt") = 0
    and extract(milliseconds from "endsAt") = 0 as end_is_midnight,
    date_trunc('day',"endsAt")::date - date_trunc('day',"startsAt")::date as day_diff
  from "Event"
)
select
  sum((day_diff>=1)::int) as multi_day_total,
  sum((day_diff>=1 and end_is_midnight)::int) as multi_day_midnight_end,
  sum((day_diff>=1 and not end_is_midnight)::int) as multi_day_non_midnight_end
from e;
