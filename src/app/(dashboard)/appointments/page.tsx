"use client";

import * as React from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NewAppointmentDialog } from "@/components/appointments/new-appointment-dialog";
import { DailyView } from "@/components/appointments/daily-view";
import { WeeklyView } from "@/components/appointments/weekly-view";
import { MonthlyView } from "@/components/appointments/monthly-view";
import { useAppointments } from "@/lib/appointments-store";

export default function AppointmentsPage() {
  const { appointments } = useAppointments();
  const [date, setDate] = React.useState("2026-06-25");
  const [tab, setTab] = React.useState("daily");

  function selectDay(d: string) {
    setDate(d);
    setTab("daily");
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Create, confirm, reschedule, and complete bookings."
        actions={<NewAppointmentDialog defaultDate={date} />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyView appointments={appointments} date={date} onDateChange={setDate} />
        </TabsContent>
        <TabsContent value="weekly">
          <WeeklyView
            appointments={appointments}
            date={date}
            onDateChange={setDate}
            onSelectDay={selectDay}
          />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlyView
            appointments={appointments}
            date={date}
            onDateChange={setDate}
            onSelectDay={selectDay}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
