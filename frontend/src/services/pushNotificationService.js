import { apiFetch } from "./apiClient.js";

/**
 * AstroVerse Push Notification Service
 * Manages Service Worker registration, Web Push subscriptions, and real-time transit alerts.
 */

/**
 * Checks if Web Push notifications are supported by current browser environment
 */
export function isPushNotificationSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Registers Service Worker
 */
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.info("[PUSH] Service Worker registered with scope:", registration.scope);
    return registration;
  } catch (error) {
    console.warn("[PUSH] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Converts a base64 string to Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Requests push notification permission from user
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return { granted: false, error: "Push notifications not supported by browser" };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      granted: permission === "granted",
      permission
    };
  } catch (err) {
    return { granted: false, error: err.message };
  }
}

/**
 * Subscribes current client to Web Push notifications and registers with backend
 */
export async function subscribeUserToPushNotifications(userId = "anonymous") {
  if (!isPushNotificationSupported()) return { success: false, error: "Not supported" };

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // Dedicated AstroVerse VAPID Public Key
      let vapidKey = "BBNLBC7fF0N92_s5Y3W--qNIzJP2oZ04mH7bg578sq7Um9Hiou9k-_mKy8aUufmMv6yGwQAHzY8y2PFOC03pvjw";
      try {
        const keyRes = await apiFetch("/api/notifications/vapid-public-key");
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.publicKey) vapidKey = keyData.publicKey;
        }
      } catch {
        // Use default dedicated key
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }

    // Register subscription with backend
    const response = await apiFetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON()
      })
    });

    const data = await response.json();
    return {
      success: true,
      subscription,
      registered: data.success || false
    };
  } catch (error) {
    console.warn("[PUSH] Subscription failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers a localized transit alert notification via Service Worker
 */
export async function dispatchLocalTransitNotification({ title, body, url = "/" }) {
  if (!isPushNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title || "AstroVerse Planetary Alert", {
      body: body || "A significant planetary transit window is currently active.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [100, 50, 100],
      data: { url }
    });
    return true;
  } catch (err) {
    console.warn("[PUSH] Local notification dispatch error:", err);
    return false;
  }
}
