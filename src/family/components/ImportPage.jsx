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
          ⚠ Possible duplicate — already on {duplicate.date}
          {duplicate.start ? ` at ${formatTime(duplicate.start)}` : ""}
        </div>
      )}

      <label className="fh-field">
        <span>Title 标题</span>
        <input value={cand.title} onChange={(e) => set({ title: e.target.value })} />
      </label>

      <div className="fh-field">
        <span>Assign to 分配 · 颜色</span>
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
          <span>Date 日期</span>
          <input type="date" value={cand.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>Start 开始</span>
          <input type="time" value={cand.start} onChange={(e) => set({ start: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>End 结束</span>
          <input type="time" value={cand.end} onChange={(e) => set({ end: e.target.value })} />
        </label>
      </div>

      <div className="fh-field-row">
        <label className="fh-field">
          <span>Location 地点</span>
          <input value={cand.location} onChange={(e) => set({ location: e.target.value })} />
        </label>
        <label className="fh-field">
          <span>Notes 备注</span>
          <input value={cand.notes} onChange={(e) => set({ notes: e.target.value })} />
        </label>
      </div>

      <div className="fh-modal-actions">
        <button type="button" className="fh-btn-danger" onClick={() => onReject(cand.tempId)}>
          Reject
        </button>
        <button
          type="button"
          className="fh-btn-primary"
          disabled={!cand.title.trim() || !cand.date}
          onClick={() => onApprove(cand)}
        >
          ✓ Approve → calendar
        </button>
      </div>
    </div>
  );
}

export default function ImportPage({ members, events, onApprove }) {
  const [source, setSource] = useState("email");
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [stubMsg, setStubMsg] = useState("");
  const [info, setInfo] = useState("");
  const fileRef = useRef(null);

  const extractEmail = () => {
    const found = PARSERS.email.parse(text, members);
    setCandidates(found);
    setInfo(found.length ? `Found ${found.length} event(s) — review below.` : "No events detected. Try adding a date.");
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
        `${source === "pdf" ? "PDF" : "Image"} parsing coming soon — “${file.name}” received. ` +
          "The parser adapter is wired; real extraction (text/OCR/AI) lands next."
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
      <h2 className="fh-page-title">Magic Import · 邮件 / PDF 转日历</h2>
      <p className="fh-muted">
        Paste a school email (or upload a flyer). We extract events for you to review — nothing is
        added to the calendar until you approve it.
      </p>

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
            {p.label}
            {!p.ready && <span className="fh-soon">soon</span>}
          </button>
        ))}
      </div>

      {source === "email" && (
        <div className="fh-import-email">
          <textarea
            className="fh-import-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the email text here…"
            rows={8}
          />
          <div className="fh-import-controls">
            <button type="button" className="fh-btn-ghost" onClick={() => setText(SAMPLE_EMAIL)}>
              Load sample email
            </button>
            <button type="button" className="fh-btn-primary" onClick={extractEmail} disabled={!text.trim()}>
              ✨ Extract events
            </button>
          </div>
          {info && <p className="fh-info">{info}</p>}
        </div>
      )}

      {source !== "email" && (
        <div className="fh-import-upload">
          <input ref={fileRef} type="file" accept={source === "pdf" ? "application/pdf" : "image/*"} onChange={handleFile} />
          <p className="fh-muted">
            {source === "pdf" ? "Upload a PDF flyer or newsletter." : "Upload a photo of a flyer."}
          </p>
          {stubMsg && <div className="fh-stub">{stubMsg}</div>}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="fh-review">
          <div className="fh-review-head">
            <h3>Review · 待确认事件 ({candidates.length})</h3>
            <button type="button" className="fh-btn-primary" onClick={approveAll}>
              Approve all
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
