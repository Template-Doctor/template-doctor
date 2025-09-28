// Basic typed wrapper around legacy notification-system.js for migration.
// NOTE: Will eventually replace direct DOM construction with a component-based approach.

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // ms, 0 = persistent
}

export interface NotificationAPI {
  showSuccess(title: string, message: string, duration?: number): HTMLElement | undefined;
  showError(title: string, message: string, duration?: number): HTMLElement | undefined;
  showWarning(title: string, message: string, duration?: number): HTMLElement | undefined;
  showInfo(title: string, message: string, duration?: number): HTMLElement | undefined;
  confirm(
    title: string,
    message: string,
    opts?: {
      confirmLabel?: string;
      cancelLabel?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  ): string | undefined;
}

// Re-export the existing global if present (loaded via legacy script) for incremental migration.
export function getLegacyNotificationSystem(): NotificationAPI | undefined {
  return (window as any).NotificationSystem as NotificationAPI | undefined;
}

export function showTransient(options: NotificationOptions) {
  const api = getLegacyNotificationSystem();
  if (!api) {
    console.warn('[notifications] legacy NotificationSystem not initialized yet');
    return;
  }
  const { type, title, message, duration } = options;
  switch (type) {
    case 'success':
      return api.showSuccess(title, message, duration);
    case 'error':
      return api.showError(title, message, duration);
    case 'warning':
      return api.showWarning(title, message, duration);
    case 'info':
    default:
      return api.showInfo(title, message, duration);
  }
}

export function confirm(
  title: string,
  message: string,
  opts: { confirmLabel?: string; cancelLabel?: string; onConfirm?: () => void; onCancel?: () => void } = {}
) {
  const api = getLegacyNotificationSystem();
  if (!api) return;
  return api.confirm(title, message, opts);
}
