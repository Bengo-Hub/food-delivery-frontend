"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface SchedulePickerProps {
  onSchedule: (date: Date) => void;
  outletHours?: { open: string; close: string }; // HH:mm format
}

function getDayTabs(): { label: string; date: Date }[] {
  const today = new Date();
  const tabs: { label: string; date: Date }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    d.setHours(0, 0, 0, 0);

    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else label = d.toLocaleDateString("en-US", { weekday: "short" });

    tabs.push({ label, date: d });
  }

  return tabs;
}

function getTimeSlots(
  date: Date,
  openHour = 8,
  openMinute = 0,
  closeHour = 22,
  closeMinute = 0,
): Date[] {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const slots: Date[] = [];
  const start = new Date(date);
  start.setHours(openHour, openMinute, 0, 0);

  const end = new Date(date);
  end.setHours(closeHour, closeMinute, 0, 0);

  // For today, start from the next 15-min increment that is at least 30 min in the future
  if (isToday) {
    const earliest = new Date(now.getTime() + 30 * 60 * 1000);
    const minutes = earliest.getMinutes();
    const rounded = Math.ceil(minutes / 15) * 15;
    earliest.setMinutes(rounded, 0, 0);
    if (earliest > start) {
      start.setTime(earliest.getTime());
    }
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + 15);
  }

  return slots;
}

function parseHours(outletHours?: { open: string; close: string }) {
  if (!outletHours) return { openHour: 8, openMinute: 0, closeHour: 22, closeMinute: 0 };
  const [oh, om] = outletHours.open.split(":").map(Number);
  const [ch, cm] = outletHours.close.split(":").map(Number);
  return { openHour: oh, openMinute: om, closeHour: ch, closeMinute: cm };
}

export function SchedulePicker({ onSchedule, outletHours }: SchedulePickerProps) {
  const dayTabs = useMemo(() => getDayTabs(), []);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const hours = parseHours(outletHours);
  const timeSlots = useMemo(
    () =>
      getTimeSlots(
        dayTabs[selectedDayIdx].date,
        hours.openHour,
        hours.openMinute,
        hours.closeHour,
        hours.closeMinute,
      ),
    [selectedDayIdx, dayTabs, hours.openHour, hours.openMinute, hours.closeHour, hours.closeMinute],
  );

  const handleSelectSlot = (slot: Date) => {
    setSelectedSlot(slot);
    onSchedule(slot);
  };

  return (
    <section className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Clock className="size-4 text-primary" />
        <span>Schedule Order</span>
      </div>

      {/* Day tabs */}
      <div className="-mx-1 mb-3 flex gap-1 overflow-x-auto pb-1">
        {dayTabs.map((tab, idx) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setSelectedDayIdx(idx);
              setSelectedSlot(null);
            }}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              selectedDayIdx === idx
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Time slots */}
      <div className="grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-4">
        {timeSlots.length === 0 ? (
          <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
            No available time slots for this day.
          </p>
        ) : (
          timeSlots.map((slot) => {
            const key = slot.toISOString();
            const isSelected =
              selectedSlot !== null && selectedSlot.getTime() === slot.getTime();
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectSlot(slot)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50",
                )}
              >
                {slot.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
