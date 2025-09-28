// TypeScript port facade for the richer NotificationSystem class (legacy notifications.js)
// Provides typed accessors while deferring real UI to the existing global instance.

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  primary?: boolean;
}

export interface ShowOptions {
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // ms (0 = persistent)
  actions?: NotificationAction[];
}

export interface LoadingController {
  id: string;
  update: (newTitle?: string, newMessage?: string) => void;
  success: (title?: string, message?: string) => void;
  error: (title?: string, message?: string) => void;
  close: () => void;
}

export interface RichNotificationsAPI {
  show(opts: ShowOptions): string | undefined;
  info(title: string, message?: string, duration?: number): string | undefined;
  success(title: string, message?: string, duration?: number): string | undefined;
  warning(title: string, message?: string, duration?: number): string | undefined;
  error(title: string, message?: string, duration?: number): string | undefined;
  loading(title?: string, message?: string): LoadingController | undefined;
  confirm(
    title: string,
    message: string,
    opts?: { confirmLabel?: string; cancelLabel?: string; onConfirm?: () => void; onCancel?: () => void }
  ): string | undefined;
}

function getLegacy(): any {
  return (window as any).Notifications || (window as any).NotificationSystem;
}

export const Notifications: RichNotificationsAPI = {
  show(opts: ShowOptions) {
    const api = getLegacy();
    if (!api) return;
    return api.show(opts);
  },
  info(title, message, duration) {
    const api = getLegacy();
    return api?.info?.(title, message, duration);
  },
  success(title, message, duration) {
    const api = getLegacy();
    return api?.success?.(title, message, duration);
  },
  warning(title, message, duration) {
    const api = getLegacy();
    return api?.warning?.(title, message, duration);
  },
  error(title, message, duration) {
    const api = getLegacy();
    return api?.error?.(title, message, duration);
  },
  loading(title, message) {
    const api = getLegacy();
    return api?.loading?.(title, message);
  },
  confirm(title, message, opts) {
    const api = getLegacy();
    return api?.confirm?.(title, message, opts);
  }
};

// Expose a transitional global shim so existing code can switch gradually.
;(window as any).TemplateDoctorNotifications = Notifications;
