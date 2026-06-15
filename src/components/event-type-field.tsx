"use client";

import { useState } from "react";
import { Field } from "@/components/ui";

export function EventTypeField({ defaultValue = "student_event" }: { defaultValue?: string }) {
  const presetValues = ["student_event", "university_event", "external_partner_event"];
  const isCustomDefault = defaultValue.length > 0 && !presetValues.includes(defaultValue);
  const [eventType, setEventType] = useState(isCustomDefault ? "__custom" : defaultValue);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-ink">Event type</span>
        <select
          name="event_type"
          required
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
          className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm shadow-sm"
        >
          <option value="student_event">Student event</option>
          <option value="university_event">University/student-union event</option>
          <option value="external_partner_event">External partner event</option>
          <option value="__custom">Other / Add new type</option>
        </select>
      </label>
      {eventType === "__custom" ? (
        <Field label="Custom event type" name="event_type_custom" defaultValue={isCustomDefault ? defaultValue : ""} required />
      ) : null}
    </div>
  );
}
