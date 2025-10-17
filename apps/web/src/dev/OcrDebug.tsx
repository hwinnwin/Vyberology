import React, { useState } from "react";
import { recognizeText, parseTokens } from "../ocr/extractNumbersWeb";
import { FEAT_DELIVERY, FEAT_OCR } from "../lib/flags";
import { renderVolumeIV, type NumberToken, type RenderResult } from "@vybe/reading-engine";
import { saveReading } from "../lib/saveReading";
import { ReadingDelivery } from "@/components/ReadingDelivery";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function OcrDebug() {
  const [img, setImg] = useState<string>("");
  const [reading, setReading] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [tokens, setTokens] = useState<NumberToken[]>([]);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImg(URL.createObjectURL(file));
    setStatus("");
    void trackAnalyticsEvent("ocr_image_selected", {
      platform: "web",
      source: "file-input",
    });
    const { text, confidence } = await recognizeText(file);
    setRaw(text);
    const tokens = parseTokens(text, confidence);
    setTokens(tokens);
    void trackAnalyticsEvent("ocr_numbers_extracted", {
      platform: "web",
      tokenCount: tokens.length,
    });
    const renderOptions: any = { explain: true };
    renderOptions.format = FEAT_DELIVERY ? "blocks" : "text";
    const out = renderVolumeIV(
      { coreNumber: 11, tokens, volume: "IV" },
      renderOptions
    );
    setRenderResult(out);
    setReading(out.text + "\n\n---\nExplain:\n" + JSON.stringify(out.rationale, null, 2));
    void trackAnalyticsEvent("reading_generated", {
      platform: "web",
      source: "ocr-debug",
      tokenCount: tokens.length,
    });
  }

  async function onSave() {
    if (!renderResult) return;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      setStatus("Supabase credentials are missing.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const rationale = renderResult.rationale as
        | { inputs?: unknown; derivations?: unknown }
        | undefined;
      await saveReading(supabaseUrl, anonKey, {
        user_id: null,
        volume: "IV",
        core_number: 11,
        raw_extracted: rationale?.inputs ?? { raw, tokens },
        computed: rationale?.derivations ?? { anchors: tokens.flatMap((t) => t.values) },
        rendered: renderResult.text,
      });
      setStatus("Saved to Supabase.");
    } catch (err) {
      console.error(err);
      setStatus("Failed to save reading.");
      void trackAnalyticsEvent("error_occurred", {
        platform: "web",
        scope: "ocr_debug_save",
        message: err instanceof Error ? err.message : "unknown",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!FEAT_OCR) return <div>OCR disabled.</div>;
  return (
    <div style={{ padding: 16 }}>
      <input type="file" accept="image/*" onChange={onPick} />
      {img && <img src={img} style={{ maxWidth: 420, display: "block", marginTop: 12 }} />}
      {renderResult && (
        <button
          style={{ marginTop: 12 }}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save reading to Supabase"}
        </button>
      )}
      {status && (
        <p style={{ marginTop: 8, color: status.includes("Failed") ? "#f87171" : "#4ade80" }}>
          {status}
        </p>
      )}
      <h4>Raw OCR</h4>
      <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#ddd", padding: 12 }}>
        {raw}
      </pre>
      {renderResult && FEAT_DELIVERY ? (
        <div style={{ marginTop: 16 }}>
          <ReadingDelivery reading={renderResult} />
        </div>
      ) : null}
      <h4 style={{ marginTop: 16 }}>Reading + Rationale</h4>
      <pre style={{ whiteSpace: "pre-wrap", background: "#111", color: "#ddd", padding: 12, marginTop: 8 }}>
        {reading}
      </pre>
    </div>
  );
}
