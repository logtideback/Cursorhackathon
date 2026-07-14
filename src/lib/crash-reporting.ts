/**
 * Crash-reporting adapter (Sentry placeholder).
 * Wire `@sentry/react-native` when EXPO_PUBLIC_SENTRY_DSN is set.
 */

type CrashTraits = Record<string, string | number | boolean | null | undefined>;

export interface CrashReporter {
  init(): void;
  captureException(error: unknown, context?: CrashTraits): void;
  captureMessage(message: string, context?: CrashTraits): void;
  setUser(userId: string | null): void;
  addBreadcrumb(message: string, data?: CrashTraits): void;
}

class NoopCrashReporter implements CrashReporter {
  init(): void {}
  captureException(): void {}
  captureMessage(): void {}
  setUser(): void {}
  addBreadcrumb(): void {}
}

class SentryPlaceholderReporter implements CrashReporter {
  private readonly dsn: string | undefined;

  constructor() {
    this.dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
  }

  get isConfigured(): boolean {
    return Boolean(this.dsn);
  }

  init(): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: Sentry.init({ dsn: this.dsn, enableInExpoDevelopment: false })
  }

  captureException(error: unknown, context?: CrashTraits): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: Sentry.captureException(error, { extra: context })
    void error;
    void context;
  }

  captureMessage(message: string, context?: CrashTraits): void {
    if (!this.isConfigured) {
      return;
    }
    void message;
    void context;
  }

  setUser(userId: string | null): void {
    if (!this.isConfigured) {
      return;
    }
    // Placeholder: Sentry.setUser(userId ? { id: userId } : null)
    void userId;
  }

  addBreadcrumb(message: string, data?: CrashTraits): void {
    if (!this.isConfigured) {
      return;
    }
    void message;
    void data;
  }
}

const sentry = new SentryPlaceholderReporter();

export const crashReporting: CrashReporter = sentry.isConfigured ? sentry : new NoopCrashReporter();

export function initCrashReporting(): void {
  crashReporting.init();
}
