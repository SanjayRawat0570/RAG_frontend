"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { FewShotExample, TenantAISettings, getTenantSettings, updateTenantSettings } from "@/lib/api";

const MAX_EXAMPLES = 8;

function Banner({ tone, msg }: { tone: "danger" | "success"; msg: string }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={tone === "danger" ? "alert" : "checkCircle"} size={15} /><span>{msg}</span>
    </div>
  );
}

function blankExample(): FewShotExample {
  return { question: "", context: [""], answer: "", citations: [], confidence: "high", answerable: true };
}

/** Per-workspace AI settings. Few-shot examples teach the answer format by demonstration. */
export default function AISettingsView({ tenant }: { tenant: string }) {
  const [settings, setSettings] = useState<TenantAISettings | null>(null);
  const [enabled,  setEnabled]  = useState(true);
  const [examples, setExamples] = useState<FewShotExample[]>([]);
  const [citDraft, setCitDraft] = useState<Record<number, string>>({});  // raw text while typing "1, 2"
  const [saving,   setSaving]   = useState(false);
  const [notice,   setNotice]   = useState<{ tone: "danger" | "success"; msg: string } | null>(null);
  const [visionSaving, setVisionSaving] = useState(false);
  const [visionError,  setVisionError]  = useState<string | null>(null);

  function apply(s: TenantAISettings) {
    setSettings(s);
    setEnabled(s.few_shot_enabled);
    setExamples(s.few_shot_examples);
    setCitDraft({});
  }

  useEffect(() => {
    setNotice(null);
    getTenantSettings(tenant).then(apply).catch(e => setNotice({ tone: "danger", msg: `Could not load settings: ${e}` }));
  }, [tenant]);

  function edit(i: number, patch: Partial<FewShotExample>) {
    setExamples(prev => prev.map((ex, j) => (j === i ? { ...ex, ...patch } : ex)));
  }

  async function save(body: Parameters<typeof updateTenantSettings>[1], msg: string) {
    setSaving(true); setNotice(null);
    try {
      apply(await updateTenantSettings(tenant, body));
      setNotice({ tone: "success", msg });
    } catch (e) {
      setNotice({ tone: "danger", msg: `Save failed: ${e}` });
    } finally { setSaving(false); }
  }

  function onSave() {
    const cleaned = examples.map(ex => ({
      ...ex,
      context: ex.context.map(c => c.trim()).filter(Boolean),
      citations: ex.answerable ? ex.citations : [],
    }));
    const invalid = cleaned.findIndex(ex => !ex.question.trim() || !ex.answer.trim());
    if (invalid >= 0) { setNotice({ tone: "danger", msg: `Example ${invalid + 1} needs a question and an answer.` }); return; }
    save({ few_shot_enabled: enabled, few_shot_examples: cleaned }, "Few-shot examples saved. They apply to the next question.");
  }

  // Saved on its own so unsaved few-shot edits aren't reset.
  async function toggleVision() {
    if (!settings) return;
    setVisionSaving(true); setVisionError(null);
    try {
      const s = await updateTenantSettings(tenant, { vision_enabled: !settings.vision_enabled });
      setSettings(prev => prev && { ...prev, vision_enabled: s.vision_enabled });
    } catch (e) {
      setVisionError(String(e).includes("403") ? "Only workspace admins can change this." : `Save failed: ${e}`);
    } finally { setVisionSaving(false); }
  }

  if (!settings) {
    return notice ? <Banner tone={notice.tone} msg={notice.msg} /> : <div className="card card-body text-sm text-muted">Loading AI settings…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title flex items-center gap-2"><Icon name="sparkles" size={15} className="text-muted" />Few-shot examples</div>
            <div className="card-subtitle">
              Question → cited answer pairs added to the system prompt for <span className="font-mono">{tenant}</span>
            </div>
          </div>
          <span className={`badge ${settings.few_shot_custom ? "badge-primary" : ""}`}>{settings.few_shot_custom ? "Custom" : "Defaults"}</span>
        </div>

        <div className="card-body space-y-5">
          {notice && <Banner tone={notice.tone} msg={notice.msg} />}

          <div className="flex items-center justify-between gap-4 rounded-lg px-4 py-3" style={{ border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Use few-shot examples</p>
              <p className="text-xs text-muted">Show the model one answered and one unanswerable example before each question.</p>
            </div>
            <button role="switch" aria-checked={enabled} onClick={() => setEnabled(v => !v)} className="switch" aria-label="Use few-shot examples" />
          </div>

          {examples.map((ex, i) => (
            <fieldset key={i} className="space-y-3 rounded-xl p-4" style={{ border: "1px solid var(--border)", opacity: enabled ? 1 : 0.55 }}>
              <div className="flex items-center justify-between">
                <legend className="eyebrow">Example {i + 1}</legend>
                <button onClick={() => { setExamples(prev => prev.filter((_, j) => j !== i)); setCitDraft({}); }} className="btn btn-sm btn-danger-ghost" aria-label={`Remove example ${i + 1}`}>
                  <Icon name="x" size={13} />Remove
                </button>
              </div>
              <div>
                <label className="label" htmlFor={`fs-q-${i}`}>Question</label>
                <input id={`fs-q-${i}`} className="input" value={ex.question} onChange={e => edit(i, { question: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor={`fs-c-${i}`}>Context <span className="font-normal text-muted">(one source per line, numbered [1], [2]…)</span></label>
                <textarea id={`fs-c-${i}`} className="input font-mono" style={{ fontSize: 12.5 }} rows={3}
                  value={ex.context.join("\n")} onChange={e => edit(i, { context: e.target.value.split("\n") })} />
              </div>
              <div>
                <label className="label" htmlFor={`fs-a-${i}`}>Ideal answer</label>
                <textarea id={`fs-a-${i}`} className="input" rows={2} value={ex.answer} onChange={e => edit(i, { answer: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ border: "1px solid var(--border)" }}>
                  <span className="text-sm" style={{ color: "var(--text-2)" }}>Answerable</span>
                  <button role="switch" aria-checked={ex.answerable} className="switch" aria-label={`Example ${i + 1} answerable`}
                    onClick={() => edit(i, ex.answerable
                      ? { answerable: false, citations: [], confidence: "low" }
                      : { answerable: true, confidence: "high" })} />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`fs-cit-${i}`}>Citations</label>
                  <input id={`fs-cit-${i}`} className="input" placeholder="Citations, e.g. 1, 2" disabled={!ex.answerable}
                    value={citDraft[i] ?? ex.citations.join(", ")}
                    onChange={e => {
                      setCitDraft(d => ({ ...d, [i]: e.target.value }));
                      edit(i, { citations: e.target.value.split(",").map(s => parseInt(s.trim(), 10)).filter(n => n > 0) });
                    }} />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`fs-conf-${i}`}>Confidence</label>
                  <select id={`fs-conf-${i}`} className="input" value={ex.confidence}
                    onChange={e => edit(i, { confidence: e.target.value as FewShotExample["confidence"] })}>
                    <option value="high">High confidence</option>
                    <option value="medium">Medium confidence</option>
                    <option value="low">Low confidence</option>
                  </select>
                </div>
              </div>
            </fieldset>
          ))}

          {examples.length < MAX_EXAMPLES && (
            <button onClick={() => setExamples(prev => [...prev, blankExample()])} className="btn btn-secondary btn-sm">
              <Icon name="plus" size={13} />Add example
            </button>
          )}
        </div>

        <div className="card-footer justify-between">
          <button onClick={() => save({ reset_examples: true, few_shot_enabled: true }, "Restored the default examples.")}
            disabled={saving} className="btn btn-ghost">
            <Icon name="refresh" size={14} />Reset to defaults
          </button>
          <button onClick={onSave} disabled={saving} className="btn btn-primary">{saving ? "Saving…" : "Save examples"}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title flex items-center gap-2"><Icon name="eye" size={15} className="text-muted" />Vision ingestion</div>
            <div className="card-subtitle">Read scanned PDF pages, charts and images with Gemini when documents are uploaded</div>
          </div>
          <span className={`badge ${settings.vision_enabled ? "badge-success" : ""}`}>{settings.vision_enabled ? "On" : "Off"}</span>
        </div>
        <div className="card-body space-y-3">
          {visionError && <Banner tone="danger" msg={visionError} />}
          <div className="flex items-center justify-between gap-4 rounded-lg px-4 py-3" style={{ border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Use Gemini vision for images</p>
              <p className="text-xs text-muted">
                Each scanned page or figure is one model call (up to 20 per document), so this is off by default.
                Text read this way is cited with its page and marked &ldquo;Vision&rdquo;. Needs GEMINI_API_KEY on the server.
              </p>
            </div>
            <button role="switch" aria-checked={settings.vision_enabled} onClick={toggleVision} disabled={visionSaving}
              className="switch" aria-label="Use Gemini vision for images" />
          </div>
        </div>
      </div>
    </div>
  );
}
