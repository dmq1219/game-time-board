import React, { useEffect, useState } from "react";

const COUNTDOWN_SECONDS = 20;

const CHINESE_PROMISES = [
  "做好自己卫生：刷牙、洗脸、梳头",
  "尊重每个兄弟姐妹",
  "用完东西物归原位",
  "按时归还电子设备"
];

const ENGLISH_PROMISES = [
  "Take care of my hygiene: brush teeth, wash face, comb hair",
  "Respect each of my brothers and sisters",
  "Put things back where they belong after use",
  "Return electronic devices on time"
];

export default function FamilyPromiseGate({ onStart }) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const canStart = secondsLeft === 0;

  useEffect(() => {
    if (secondsLeft === 0) return undefined;

    const timerId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [secondsLeft]);

  return (
    <main className="promise-screen" aria-labelledby="promise-title">
      <section className="promise-board">
        <div className="promise-heading">
          <div>
            <p className="eyebrow">Before checklist</p>
            <h1 id="promise-title">
              家庭团队承诺
              <span className="promise-title-en">Family Team Promise</span>
            </h1>
          </div>
          <div className={canStart ? "promise-countdown ready" : "promise-countdown"}>
            {canStart ? "Ready" : secondsLeft}
          </div>
        </div>

        <div className="promise-columns">
          <article className="promise-card promise-card-cn" lang="zh-CN">
            <p>我是家庭团队的一员。今天我会：</p>
            <ul>
              {CHINESE_PROMISES.map((item) => (
                <li key={item}>
                  <span>✓</span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ul>
            <p className="promise-note">点击“开始”，表示我愿意做到这些。</p>
          </article>

          <article className="promise-card promise-card-en" lang="en">
            <p>I am an important member of my family team.</p>
            <p>Today I will:</p>
            <ul>
              {ENGLISH_PROMISES.map((item) => (
                <li key={item}>
                  <span>✓</span>
                  <strong>{item}</strong>
                </li>
              ))}
            </ul>
            <p className="promise-note">Tap “Start” to begin.</p>
          </article>
        </div>

        <div className="promise-actions">
          <span>{canStart ? "可以开始了" : `${secondsLeft} 秒后可以开始`}</span>
          <button type="button" className="primary" disabled={!canStart} onClick={onStart}>
            开始 / Start
          </button>
        </div>
      </section>
    </main>
  );
}
