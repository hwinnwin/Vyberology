import { useState } from "react";
import { Text, Image, Button, ScrollView, Alert, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { renderVolumeIV, type NumberToken, type RenderResult } from "@vybe/reading-engine";
import { saveReading } from "@/lib/saveReading";
import { ReadingDelivery } from "@/components/ReadingDelivery";

export default function OcrDebug() {
  const [uri, setUri] = useState<string | null>(null);
  const [out, setOut] = useState<string>("");
  const [raw, setRaw] = useState<string>("");
  const [tokens, setTokens] = useState<NumberToken[]>([]);
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const deliveryEnabled = process.env.EXPO_PUBLIC_FEATURE_DELIVERY === "on";

  async function pick() {
    setStatus("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "We need access to your photo library to run OCR on screenshots."
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!res.canceled) {
      const u = res.assets[0].uri;
      setUri(u);
      const result = await TextRecognition.recognize(u);
      const text = result.text ?? "";
      setRaw(text);
      const tokens: NumberToken[] = parseTokensNative(result, 0.85);
      setTokens(tokens);
      const reading = renderVolumeIV(
        { coreNumber: 11, tokens, volume: "IV" },
        { explain: true, format: deliveryEnabled ? "blocks" : "text" }
      );
      setRenderResult(reading);
      setOut(reading.text + "\n\n---\nExplain:\n" + JSON.stringify(reading.rationale, null, 2));
    }
  }

  async function onSave() {
    if (!renderResult) return;
    if (!supabaseUrl || !supabaseAnonKey) {
      Alert.alert("Supabase not configured", "Set EXPO_PUBLIC_SUPABASE_* env variables to enable saving.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const rationale = renderResult.rationale as
        | { inputs?: unknown; derivations?: unknown }
        | undefined;
      await saveReading(supabaseUrl, supabaseAnonKey, {
        user_id: null,
        volume: "IV",
        core_number: 11,
        raw_extracted: rationale?.inputs ?? { text: raw, tokens },
        computed: rationale?.derivations ?? { anchors: tokens.flatMap((t) => t.values) },
        rendered: renderResult.text,
      });
      setStatus("Saved to Supabase.");
    } catch (error) {
      console.error(error);
      setStatus("Failed to save reading.");
    } finally {
      setSaving(false);
    }
  }

  function parseTokensNative(res: any, baseConf: number): NumberToken[] {
    const text = res.text ?? "";
    // reuse same regex parsing as web; confidence heuristic fixed at baseConf
    const TIME = /\b(?:(?:[01]?\d|2[0-3]):[0-5]\d(?:\s?(?:AM|PM|am|pm))?)\b/;
    const TEMP = /\b-?\d{1,3}\s?(?:°\s?)?(?:C|F|°C|°F)\b/;
    const PERCENT = /\b\d{1,3}(?:[.,]\d{1,2})?\s?%\b/;
    const COUNT = /\b\d{1,3}(?:[.,]\d{3})+\b/;
    const PLAIN = /\b\d{1,4}\b/;
    const tokens: NumberToken[] = [];
    const push = (raw: string, unit: any, values: number[]) =>
      tokens.push({ raw, unit, values, confidence: baseConf });
    for (const m of text.matchAll(TIME)) {
      const [h, min] = m[0]
        .replace(/\s?(AM|PM|am|pm)$/, "")
        .split(":")
        .map((n) => +n);
      push(m[0], "time", [h, min]);
    }
    for (const m of text.matchAll(TEMP)) {
      const n = parseInt(m[0].replace(/[^\d-]/g, ""), 10);
      push(m[0], "temperature", [n]);
    }
    for (const m of text.matchAll(PERCENT)) {
      const n = parseFloat(m[0].replace("%", "").replace(",", "."));
      push(m[0], "percent", [n]);
    }
    for (const m of text.matchAll(COUNT)) {
      const n = parseInt(m[0].replace(/[.,]/g, ""), 10);
      push(m[0], "count", [n]);
    }
    if (!TIME.test(text) && !TEMP.test(text) && !PERCENT.test(text) && !COUNT.test(text)) {
      for (const m of text.matchAll(PLAIN)) {
        const v = parseInt(m[0], 10);
        if (!Number.isNaN(v)) push(m[0], "plain", [v]);
      }
    }
    return tokens.filter((t, i, a) => a.findIndex((x) => x.raw === t.raw && x.unit === t.unit) === i);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Button title="Pick Image" onPress={pick} />
      {uri && <Image source={{ uri }} style={{ width: "100%", height: 260, resizeMode: "contain" }} />}
      {renderResult && (
        <Button
          title={saving ? "Saving..." : "Save reading to Supabase"}
          onPress={onSave}
          disabled={saving}
        />
      )}
      {status ? (
        <Text
          style={{
            color: status.includes("Failed") ? "#f87171" : "#22c55e",
            fontWeight: "500",
          }}
        >
          {status}
        </Text>
      ) : null}
      {renderResult && deliveryEnabled ? (
        <View style={{ marginTop: 12 }}>
          <ReadingDelivery reading={renderResult} />
        </View>
      ) : null}
      {raw ? (
        <>
          <Text style={{ fontWeight: "600", marginTop: 12 }}>Raw OCR</Text>
          <Text selectable style={{ fontFamily: "Courier" }}>{raw}</Text>
        </>
      ) : null}
      {out ? (
        <>
          <Text style={{ fontWeight: "600", marginTop: 12 }}>Reading + Rationale</Text>
          <Text selectable style={{ fontFamily: "Courier" }}>{out}</Text>
        </>
      ) : null}
    </ScrollView>
  );
}
