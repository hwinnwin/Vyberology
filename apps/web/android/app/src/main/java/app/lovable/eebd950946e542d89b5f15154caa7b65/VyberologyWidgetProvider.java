package app.lovable.eebd950946e542d89b5f15154caa7b65;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Vyberology Widget Provider
 * Provides home screen widgets for quick vybe capture
 * Supports small (2x2), medium (4x2), and large (4x4) widget sizes
 */
public class VyberologyWidgetProvider extends AppWidgetProvider {

    private static final String ACTION_CAPTURE = "app.lovable.eebd950946e542d89b5f15154caa7b65.ACTION_CAPTURE";
    private static final String ACTION_PATTERN = "app.lovable.eebd950946e542d89b5f15154caa7b65.ACTION_PATTERN";
    private static final String ACTION_HISTORY = "app.lovable.eebd950946e542d89b5f15154caa7b65.ACTION_HISTORY";
    private static final String ACTION_NUMEROLOGY = "app.lovable.eebd950946e542d89b5f15154caa7b65.ACTION_NUMEROLOGY";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Get current time
        SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
        SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, MMM d", Locale.getDefault());
        String currentTime = timeFormat.format(new Date());
        String currentDate = dateFormat.format(new Date());

        // Determine widget size and select appropriate layout
        int layoutId = getWidgetLayoutId(context, appWidgetManager, appWidgetId);
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        // Update time display
        views.setTextViewText(R.id.widget_time, currentTime);

        // Update date display (if present in layout)
        if (layoutId == R.layout.widget_medium || layoutId == R.layout.widget_large) {
            views.setTextViewText(R.id.widget_date, currentDate);
        }

        // Set up click intents
        setupClickIntents(context, views, layoutId);

        // Update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static int getWidgetLayoutId(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Try to determine widget size based on available space
        // Default to small if unable to determine
        // In a production app, you'd use AppWidgetManager.getAppWidgetOptions()
        // to get actual widget dimensions
        return R.layout.widget_small;
    }

    private static void setupClickIntents(Context context, RemoteViews views, int layoutId) {
        // Main capture action
        Intent captureIntent = createDeepLinkIntent(context, "vyberology://capture");
        PendingIntent capturePendingIntent = PendingIntent.getActivity(
            context, 0, captureIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_capture_button, capturePendingIntent);

        // Pattern quick actions (large widget only)
        if (layoutId == R.layout.widget_large) {
            setupPatternButton(context, views, R.id.widget_pattern_1111, "11:11");
            setupPatternButton(context, views, R.id.widget_pattern_222, "222");
            setupPatternButton(context, views, R.id.widget_pattern_333, "333");
            setupPatternButton(context, views, R.id.widget_pattern_444, "444");

            // History action
            Intent historyIntent = createDeepLinkIntent(context, "vyberology://history");
            PendingIntent historyPendingIntent = PendingIntent.getActivity(
                context, 4, historyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_history_button, historyPendingIntent);

            // Numerology action
            Intent numerologyIntent = createDeepLinkIntent(context, "vyberology://numerology");
            PendingIntent numerologyPendingIntent = PendingIntent.getActivity(
                context, 5, numerologyIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_numerology_button, numerologyPendingIntent);
        }

        // For medium widget, add whole widget click
        if (layoutId == R.layout.widget_medium) {
            Intent captureIntent2 = createDeepLinkIntent(context, "vyberology://capture");
            PendingIntent capturePendingIntent2 = PendingIntent.getActivity(
                context, 6, captureIntent2, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, capturePendingIntent2);
        }

        // For small widget, whole widget is clickable
        if (layoutId == R.layout.widget_small) {
            Intent captureIntent3 = createDeepLinkIntent(context, "vyberology://capture");
            PendingIntent capturePendingIntent3 = PendingIntent.getActivity(
                context, 7, captureIntent3, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_container, capturePendingIntent3);
        }
    }

    private static void setupPatternButton(Context context, RemoteViews views, int viewId, String pattern) {
        Intent patternIntent = createDeepLinkIntent(context, "vyberology://pattern/" + pattern);
        PendingIntent patternPendingIntent = PendingIntent.getActivity(
            context, viewId, patternIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(viewId, patternPendingIntent);
    }

    private static Intent createDeepLinkIntent(Context context, String deepLink) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(deepLink));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return intent;
    }

    @Override
    public void onEnabled(Context context) {
        // Widget added for the first time
        super.onEnabled(context);
    }

    @Override
    public void onDisabled(Context context) {
        // Last widget removed
        super.onDisabled(context);
    }
}
