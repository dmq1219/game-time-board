import React, { useRef, useState } from "react";
import { PARSERS, SAMPLE_EMAIL } from "../data/parsers";
import { findDuplicate } from "../utils/events";
import { formatTime } from "../utils/calendar";

// One editable, approvable candidate row on the Review screen.
function ReviewCard({ cand, members, duplicate, onChange, onApprove, onReject }) {
  const set = (patch) => onChange({ ...cand, ...patch });

  return (
    <div className={`fh-review-card${duplicate ? " is-dupe" : ""}`}>
      {duplicate && (
        <div className="fh-dupe-badge">
          ⚠ 可能重复了 — 日历上已经有 {duplicate.date}
          {duplicate.start ? ` ${formatTime(duplicate.start)}` : ""} 的安排
        </div>
      )}

      <label className="fh-field">
        <span>这是什么活动</span>
        <input value={cand.title} onChange={(e) => set({ title: e.target.value })} />
      </label>

      <div className="fh-field">
        <span>这是谁的</span>
        <div className="fh-member-pick">
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`fh-pick${cand.memberId === m.id ? " active" : ""}`}
              style={{ "--member": m.color }}
              onClick={() => set({ memberId: m.id })}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="fh-field-row">
        <label className="fh-field">
          <span>哪一天</span>
          <input type="date" value={cand.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>几点开始</span>
          <input type="time" value={cand.start} onChange={(e) => set({ start: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>几点结束</span>
          <input type="time" value={cand.end} onChange={(e) => set({ end: e.target.value })} />
        </label>
      </div>

      <div className="fh-field-row">
        <label className="fh-field">
          <span>在哪里</span>
          <input value={cand.location} onChange={(e) => set({ location: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>备注</span>
          <input value={cand.notes} onChange={(e) => set({ notes: e.target.value })} />
        </label>
      </div>

      <div className="fh-modal-actions">
        <button type="button" className="fh-btn-danger" onClick={() => onReject(cand.tempId)}>
          ✕ 不需要
        </button>
        <button
          type="button"
          className="fh-btn-primary"
          disabled={!cand.title.trim() || !cand.date}
          onClick={() => onApprove(cand)}
        >
          ✓ 加入日历
        </button>
      </div>
    </div>
  );
}

export default function ImportPage({ members, events, candidates: remote = [], onApprove, onReject }) {
  const [source, setSource] = useState("email");
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [remoteDraft, setRemoteDraft] = useState({}); // local edits to inbox cards, keyed by id
  const [stubMsg, setStubMsg] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef(null);

  // Inbox cards are remote candidates merged with any in-progress local edits.
  const inbox = remote.map((c) => ({ ...c, ...remoteDraft[c.id] }));
  const editRemote = (next) =>
    setRemoteDraft((d) => ({ ...d, [next.id]: { ...d[next.id], ...next } }));

  const extractEmail = () => {
    const found = PARSERS.email.parse(text, members);
    setCandidates(found);
    setInfo(found.length ? `找到 ${found.length} 条活动,请在下面确认。` : "没找到活动。试着补上日期(比如 6月20日)再找一次。");
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    setStubMsg("");
    if (!file) return;
    try {
      PARSERS[source].parse(file, members);
    } catch (err) {
      // Expected for v1 stubs — show the roadmap placeholder.
      setStubMsg(
        `${source === "pdf" ? "PDF" : "图片"}识别功能马上就来——已收到「${file.name}」。目前请先用「粘贴邮件」。`
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateCand = (next) =>
    setCandidates((list) => list.map((c) => (c.tempId === next.tempId ? next : c)));

  const approve = (cand) => {
    onApprove(cand);
    setCandidates((list) => list.filter((c) => c.tempId !== cand.tempId));
  };
  const reject = (id) => setCandidates((list) => list.filter((c) => c.tempId !== id));

  const approveAll = () => {
    candidates.filter((c) => c.title.trim() && c.date).forEach(onApprove);
    setCandidates([]);
  };

  return (
    <div className="fh-page fh-import-page">
      <h2 className="fh-page-title">📧 邮件导入</h2>
      <p className="fh-muted">
        系统每天自动查看学校邮箱,帮你把邮件里的活动找出来。下面的安排<strong>确认后才会加进日历</strong>,你不用自己抄。
      </p>

      {inbox.length > 0 && (
        <div className="fh-review fh-inbox">
          <div className="fh-review-head">
            <h3>📬 邮箱里找到 {inbox.length} 条新安排</h3>
          </div>
          <p className="fh-muted">
            这些是从你邮箱里自动找出来的。看一眼对不对,对就点「✓ 加入日历」,不需要就点「✕ 不需要」。
          </p>
          <div className="fh-review-list">
            {inbox.map((c) => (
              <ReviewCard
                key={c.id}
                cand={c}
                members={members}
                duplicate={findDuplicate(events, c)}
                onChange={editRemote}
                onApprove={onApprove}
                onReject={() => onReject(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {inbox.length === 0 && (
        <div className="fh-empty">
          <div className="fh-empty-icon">📭</div>
          <strong>现在没有新的邮件安排</strong>
          <p>系统每天早晚各查看一次学校邮箱。有新活动时,会自动出现在这里,左上角的小铃铛 🔔 也会亮起提醒你。</p>
        </div>
      )}

      <details className="fh-manual">
        <summary>手动添加(可选)</summary>
        <p className="fh-muted">如果你手里有一封邮件,也可以自己粘贴进来,让系统帮你找出活动。</p>

        <div className="fh-import-tabs">
          {Object.values(PARSERS).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`fh-import-tab${source === p.id ? " active" : ""}`}
              onClick={() => {
                setSource(p.id);
                setStubMsg("");
              }}
            >
              {p.cn}
              {!p.ready && <span className="fh-soon">暂未开放</span>}
            </button>
          ))}
        </div>

        {source === "email" && (
          <div className="fh-import-email">
            <textarea
              className="fh-import-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="把邮件文字粘贴到这里…"
              rows={8}
            />
            <div className="fh-import-controls">
              <button type="button" className="fh-btn-ghost" onClick={() => setText(SAMPLE_EMAIL)}>
                看个例子
              </button>
              <button type="button" className="fh-btn-primary" onClick={extractEmail} disabled={!text.trim()}>
                ✨ 找出活动
              </button>
            </div>
            {info && <p className="fh-info">{info}</p>}
          </div>
        )}

        {source !== "email" && (
          <div className="fh-import-upload">
            <input ref={fileRef} type="file" accept={source === "pdf" ? "application/pdf" : "image/*"} onChange={handleFile} />
            <p className="fh-muted">
              {source === "pdf" ? "上传一份 PDF 传单或通讯。" : "上传一张传单照片。"}
            </p>
            {stubMsg && <div className="fh-stub">{stubMsg}</div>}
          </div>
        )}
      </details>

      {candidates.length > 0 && (
        <div className="fh-review">
          <div className="fh-review-head">
            <h3>请确认这 {candidates.length} 条</h3>
            <button type="button" className="fh-btn-primary" onClick={approveAll}>
              全部加入日历
            </button>
          </div>
          <div className="fh-review-list">
            {candidates.map((c) => (
              <ReviewCard
                key={c.tempId}
                cand={c}
                members={members}
                duplicate={findDuplicate(events, c)}
                onChange={updateCand}
                onApprove={approve}
                onReject={reject}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
