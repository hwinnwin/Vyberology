import WidgetKit
import SwiftUI

// MARK: - Widget Configuration
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> VybeEntry {
        VybeEntry(date: Date(), currentTime: getCurrentTimeString())
    }

    func getSnapshot(in context: Context, completion: @escaping (VybeEntry) -> ()) {
        let entry = VybeEntry(date: Date(), currentTime: getCurrentTimeString())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [VybeEntry] = []

        // Generate a timeline of entries for the next hour, updating every minute
        let currentDate = Date()
        for minuteOffset in 0 ..< 60 {
            let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: currentDate)!
            let entry = VybeEntry(date: entryDate, currentTime: getCurrentTimeString(for: entryDate))
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }

    private func getCurrentTimeString(for date: Date = Date()) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }
}

// MARK: - Widget Entry
struct VybeEntry: TimelineEntry {
    let date: Date
    let currentTime: String
}

// MARK: - Widget Views

// Small Widget (2x2)
struct SmallWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.11, green: 0.09, blue: 0.18), // lf-midnight
                    Color(red: 0.07, green: 0.05, blue: 0.14)  // lf-ink
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 8) {
                // Time display
                Text(entry.currentTime)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundColor(.white)

                // Vybe logo (placeholder - replace with actual logo)
                Circle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color(red: 0.42, green: 0.27, blue: 0.76), // lf-violet
                                Color(red: 0.65, green: 0.54, blue: 0.98)  // lf-aurora
                            ]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("V")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    )

                Text("Tap to Capture")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(.white.opacity(0.7))
            }
            .padding()
        }
        .widgetURL(URL(string: "vyberology://capture")!)
    }
}

// Medium Widget (4x2)
struct MediumWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.11, green: 0.09, blue: 0.18),
                    Color(red: 0.07, green: 0.05, blue: 0.14)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            HStack(spacing: 16) {
                // Left side - Time
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Vybe")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.7))

                    Text(entry.currentTime)
                        .font(.system(size: 36, weight: .bold, design: .rounded))
                        .foregroundColor(.white)

                    Text(getCurrentDate())
                        .font(.system(size: 10))
                        .foregroundColor(.white.opacity(0.6))
                }

                Spacer()

                // Right side - Quick actions
                VStack(spacing: 8) {
                    // Capture button
                    VStack(spacing: 4) {
                        Circle()
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 0.42, green: 0.27, blue: 0.76),
                                        Color(red: 0.65, green: 0.54, blue: 0.98)
                                    ]),
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 50, height: 50)
                            .overlay(
                                Image(systemName: "waveform.circle.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.white)
                            )

                        Text("Capture")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
            }
            .padding()
        }
        .widgetURL(URL(string: "vyberology://capture")!)
    }

    private func getCurrentDate() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date())
    }
}

// Large Widget (4x4)
struct LargeWidgetView: View {
    var entry: Provider.Entry

    let frequentPatterns = ["11:11", "222", "333", "444"]

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.11, green: 0.09, blue: 0.18),
                    Color(red: 0.07, green: 0.05, blue: 0.14)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Vyberology")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 0.65, green: 0.54, blue: 0.98))

                        Text(entry.currentTime)
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }

                    Spacer()

                    // Main capture button
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color(red: 0.42, green: 0.27, blue: 0.76),
                                    Color(red: 0.65, green: 0.54, blue: 0.98)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: "waveform.circle.fill")
                                .font(.system(size: 30))
                                .foregroundColor(.white)
                        )
                }

                Divider()
                    .background(Color.white.opacity(0.2))

                // Quick pattern buttons
                Text("Universe Signals")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white.opacity(0.8))

                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 8) {
                    ForEach(frequentPatterns, id: \.self) { pattern in
                        Link(destination: URL(string: "vyberology://pattern/\(pattern)")!) {
                            VStack(spacing: 4) {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.white.opacity(0.15))
                                    .frame(height: 44)
                                    .overlay(
                                        Text(pattern)
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundColor(.white)
                                    )
                            }
                        }
                    }
                }

                Spacer()

                // Footer actions
                HStack(spacing: 12) {
                    Link(destination: URL(string: "vyberology://history")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 12))
                            Text("History")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(.white.opacity(0.8))
                    }

                    Spacer()

                    Link(destination: URL(string: "vyberology://numerology")!) {
                        HStack(spacing: 4) {
                            Image(systemName: "number.circle")
                                .font(.system(size: 12))
                            Text("Numerology")
                                .font(.system(size: 11, weight: .medium))
                        }
                        .foregroundColor(.white.opacity(0.8))
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Widget Configuration
@main
struct VyberologyWidget: Widget {
    let kind: String = "VyberologyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            VyberologyWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Vyberology")
        .description("Quick access to capture your vybe")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Entry view that switches based on widget size
struct VyberologyWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        @unknown default:
            SmallWidgetView(entry: entry)
        }
    }
}

// MARK: - Preview
struct VyberologyWidget_Previews: PreviewProvider {
    static var previews: some Group {
        Group {
            VyberologyWidgetEntryView(entry: VybeEntry(date: Date(), currentTime: "11:11"))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
                .previewDisplayName("Small")

            VyberologyWidgetEntryView(entry: VybeEntry(date: Date(), currentTime: "11:11"))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
                .previewDisplayName("Medium")

            VyberologyWidgetEntryView(entry: VybeEntry(date: Date(), currentTime: "11:11"))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
                .previewDisplayName("Large")
        }
    }
}
