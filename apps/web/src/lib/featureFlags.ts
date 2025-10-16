type Environment = "development" | "staging" | "production";

interface FeatureFlags {
  "nav.header.v1": boolean;
}

const getEnvironment = (): Environment => {
  if (import.meta.env.PROD) {
    // Check if we're on staging subdomain
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("staging")
    ) {
      return "staging";
    }
    return "production";
  }
  return "development";
};

const featureFlagConfig: Record<Environment, FeatureFlags> = {
  development: {
    "nav.header.v1": true,
  },
  staging: {
    "nav.header.v1": true,
  },
  production: {
    "nav.header.v1": false, // OFF in production until QA passes
  },
};

export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  const env = getEnvironment();
  return featureFlagConfig[env][flag];
};

export const getFeatureFlags = (): FeatureFlags => {
  const env = getEnvironment();
  return featureFlagConfig[env];
};
