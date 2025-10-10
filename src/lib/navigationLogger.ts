interface NavigationEventData {
  from?: string;
  to?: string;
  hadHistory?: boolean;
  unsavedPromptShown?: boolean;
  userConfirmed?: boolean;
  [key: string]: any;
}

export const logNavigationEvent = (
  eventType: string,
  data: NavigationEventData
) => {
  const timestamp = new Date().toISOString();
  const logData = {
    type: eventType,
    timestamp,
    ...data,
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.log(`[Navigation Event] ${eventType}`, logData);
  }

  // In production, this could be sent to analytics service
  // Example: analytics.track(eventType, logData);
};
