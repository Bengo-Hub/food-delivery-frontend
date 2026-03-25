"use client";

import { Calendar, Clock, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  specialization?: string;
  avatarUrl?: string;
}

interface TimeSlot {
  time: string; // HH:mm
  label: string; // "9:00 AM"
  available: boolean;
}

interface AppointmentPickerProps {
  /** Duration in minutes for the service */
  durationMinutes: number;
  /** Available staff members */
  staffMembers?: StaffMember[];
  /** Available time slots (generate from opening hours if not provided) */
  timeSlots?: TimeSlot[];
  /** Called when a complete appointment is selected */
  onSelect: (appointment: {
    staffId: string | null;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
  }) => void;
  className?: string;
}

function generateDays(): { date: string; label: string; dayLabel: string }[] {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    days.push({ date: dateStr, label, dayLabel });
  }
  return days;
}

function generateDefaultTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 8; h < 20; h++) {
    for (const m of [0, 30]) {
      const time = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? "PM" : "AM";
      const label = `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
      slots.push({ time, label, available: true });
    }
  }
  return slots;
}

export function AppointmentPicker({
  durationMinutes,
  staffMembers = [],
  timeSlots,
  onSelect,
  className,
}: AppointmentPickerProps) {
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(generateDays()[0].date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const days = generateDays();
  const slots = timeSlots ?? generateDefaultTimeSlots();

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return;
    onSelect({
      staffId: selectedStaff,
      date: selectedDate,
      time: selectedTime,
    });
  };

  return (
    <div className={cn("space-y-4 rounded-lg border border-border p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Calendar className="size-4" />
        <span>Book Appointment</span>
        <span className="ml-auto text-xs text-muted-foreground">
          <Clock className="mr-1 inline-block size-3" />
          {durationMinutes} min
        </span>
      </div>

      {/* Staff Selection */}
      {staffMembers.length > 0 && (
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <User className="size-3" />
            Select Staff (optional)
          </label>
          <Select value={selectedStaff ?? ""} onValueChange={(v) => setSelectedStaff(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Any available" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any available</SelectItem>
              {staffMembers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.specialization && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({s.specialization})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Day Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Select Day</label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-xs transition-colors",
                selectedDate === day.date
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              <span className="font-medium">{day.dayLabel}</span>
              <span className="text-[10px] text-muted-foreground">{day.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Select Time</label>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {slots.map((slot) => (
            <button
              key={slot.time}
              disabled={!slot.available}
              onClick={() => setSelectedTime(slot.time)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                selectedTime === slot.time
                  ? "border-primary bg-primary text-primary-foreground"
                  : slot.available
                    ? "border-border hover:bg-muted/50"
                    : "cursor-not-allowed border-border bg-muted/30 text-muted-foreground/50",
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <Button onClick={handleConfirm} disabled={!selectedDate || !selectedTime} className="w-full">
        Confirm Appointment
      </Button>
    </div>
  );
}
