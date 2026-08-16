// Notification service to manage app-wide notifications
export class NotificationService {
  static instance = null;
  listeners = [];

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(notification) {
    const id = Date.now();
    const notificationWithId = { ...notification, id };

    // Call all listeners
    this.listeners.forEach((listener) => listener(notificationWithId));

    // Auto-remove notification after 5 seconds by default
    if (notification.duration !== "persistent") {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        this.removeNotification(id);
      }, duration);
    }

    return id;
  }

  removeNotification(id) {
    this.listeners.forEach((listener) => listener({ id, remove: true }));
  }

  // Convenience methods for different notification types
  success(title, description) {
    return this.notify({
      type: "success",
      title,
      description,
      icon: "checkmark-circle",
      color: "#004aad",
    });
  }

  error(title, description) {
    return this.notify({
      type: "error",
      title,
      description,
      icon: "alert-circle",
      color: "#F44336",
    });
  }

  info(title, description) {
    return this.notify({
      type: "info",
      title,
      description,
      icon: "information-circle",
      color: "#004aad",
    });
  }

  warning(title, description) {
    return this.notify({
      type: "warning",
      title,
      description,
      icon: "warning",
      color: "#FF9800",
    });
  }
}

export default NotificationService.getInstance();
