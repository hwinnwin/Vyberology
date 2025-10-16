import { useState } from "react";
import { Share, StyleSheet, Text, View, ScrollView } from "react-native";
import * as Clipboard from "expo-clipboard";
import type { DeliveredReading, ReadingBlocks } from "@vybe/reading-engine";

type ReadingDeliveryProps = {
  reading: DeliveredReading;
};

const BLOCK_LABELS: Array<{ key: keyof ReadingBlocks; heading: string }> = [
  { key: "elemental", heading: "Elemental Focus" },
  { key: "chakra", heading: "Chakra Guidance" },
  { key: "resonance", heading: "Resonance" },
  { key: "essence", heading: "Essence" },
  { key: "intention", heading: "Intention" },
  { key: "reflection", heading: "Reflection" },
];

export function ReadingDelivery({ reading }: ReadingDeliveryProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const notify = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 2400);
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(reading.text);
      notify("Reading copied to clipboard.");
    } catch (error) {
      console.error("Copy failed", error);
      notify("Unable to copy. Please try again.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Vyberology Reading",
        message: reading.text,
      });
    } catch (error) {
      if ((error as Error)?.message?.includes("dismissed")) {
        return;
      }
      console.error("Share failed", error);
      await handleCopy();
      notify("Sharing unavailable — copied instead.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>{reading.blocks.header}</Text>
        <View style={styles.actionRow}>
          <Text style={styles.action} onPress={handleCopy}>
            Copy
          </Text>
          <Text style={styles.action} onPress={handleShare}>
            Share
          </Text>
        </View>
      </View>

      {feedback ? (
        <Text accessibilityLiveRegion="polite" style={styles.feedback}>
          {feedback}
        </Text>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollBody}>
        {BLOCK_LABELS.map(({ key, heading }) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionHeading}>{heading}</Text>
            <Text style={styles.sectionBody}>{reading.blocks[key]}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,15,30,0.85)",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  action: {
    color: "#60a5fa",
    fontSize: 14,
    fontWeight: "600",
  },
  feedback: {
    marginTop: 8,
    color: "#facc15",
    fontSize: 13,
  },
  scrollBody: {
    paddingTop: 12,
    gap: 16,
  },
  section: {
    gap: 4,
  },
  sectionHeading: {
    color: "#94a3b8",
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  sectionBody: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
  },
});
