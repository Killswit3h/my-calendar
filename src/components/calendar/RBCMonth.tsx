"use client";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import MonthView from "./MonthView"; // keep both for comparison

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function RBCMonth({ events }: { events: { title: string; startsAt: Date; endsAt: Date }[] }) {
  const data = events.map(e => ({ title: e.title, start: e.startsAt, end: e.endsAt, allDay: true }));
  return <Calendar localizer={localizer} events={data} defaultView="month" views={["month"]} showMultiDayTimes />;
}
