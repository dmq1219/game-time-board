import React from "react";
import { REWARD_RATE } from "../data/familyData";

// Rewards: chore stars per kid, redeemable for screen time.
// Earned stars come straight from completed chores (single source of truth).
export default function RewardsPanel({ members, chores, rewards, onRedeem }) {
  const kids = members.filter((m) => !["mom", "dad"].includes(m.id));

  const earnedFor = (id) =>
    chores.filter((c) => c.done && c.memberId === id).reduce((sum, c) => sum + c.stars, 0);

  return (
    <section className="fh-card fh-rewards">
      <div className="fh-panel-head">
        <h3>Rewards 🌟</h3>
        <span>
          {REWARD_RATE.stars}⭐ = {REWARD_RATE.minutes} min
        </span>
      </div>
      <ul className="fh-reward-list">
        {kids.map((m) => {
          const earned = earnedFor(m.id);
          const redeemed = rewards[m.id]?.redeemedStars ?? 0;
          const balance = earned - redeemed;
          const screen = rewards[m.id]?.screenMinutes ?? 0;
          const canRedeem = balance >= REWARD_RATE.stars;
          return (
            <li key={m.id} className="fh-reward-row" style={{ "--member": m.color }}>
              <span className="fh-reward-avatar">{m.name.charAt(0)}</span>
              <div className="fh-reward-info">
                <strong>{m.name}</strong>
                <span className="fh-reward-stat">
                  {balance}⭐ available · {screen} min earned
                </span>
              </div>
              <button
                type="button"
                className="fh-redeem-btn"
                disabled={!canRedeem}
                onClick={() => onRedeem(m.id)}
              >
                Redeem
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
