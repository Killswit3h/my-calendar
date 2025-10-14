import { redirect } from 'next/navigation'

import { CALENDAR_HOME_PATH } from '@/lib/calendar/constants'

export default function CalendarIndex() {
  redirect(CALENDAR_HOME_PATH)
}
