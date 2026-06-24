import React from "react";
import { toISODate } from "../utils/calendar";
import { memberAvatar } from "../data/familyData";

// Compact portrait-only version of "Who's doing what": just each member's
// avatar with a black + badge. Tapping an avatar adds an event for that member.
export default function MemberAvatarStrip({ members, date, onAddForMember }) {
  const key = toISODate(date);
  return (
    <div className="fh-avatar-strip">
      {members.map((m) => {
        const avatar = memberAvatar(m.id);
        return (
          <button
            key={m.id}
            type="button"
            className="fh-avatar-chip"
            style={{ "--member": m.color }}
            onClick={() => onAddForMember(m.id, key)}
            aria-label={`Add event for ${m.name}`}
            title={m.name}
          >
            {avatar ? (
              <img className="fh-avatar-chip-img" src={avatar} alt={m.name} />
            ) : (
              <span className="fh-avatar-chip-fallback">{m.name.charAt(0)}</span>
            )}
            <span className="fh-avatar-chip-plus" aria-hidden="true">+</span>
          </button>
        );
      })}
    </div>
  );
}
