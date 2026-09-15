# MyApp - React Native Application

Mobile application built with React Native (TypeScript), React Navigation v7, React Native Reanimated, and Axios.

---

## 📡 Network & API Environment Configuration Guide

This app dynamically resolves its backend API Base URL based on environment variables and fallback rules defined in `src/constants/api.ts`.

### 🌐 API Resolution Order
1. **Full URL Override**: `EXPO_PUBLIC_API_URL` or `API_BASE_URL` in `.env`
2. **Local Host Override**: `EXPO_PUBLIC_API_HOST` & `EXPO_PUBLIC_API_PORT` in `.env`
3. **Hosted Production Server Fallback**: `https://www.sharnex.com/api`

---

## 💻 Environment Setup Matrix

| Platform / Device | Target Backend | `.env` Configuration |
| :--- | :--- | :--- |
| **Android Emulator** | Local Backend (Port 3000) | `EXPO_PUBLIC_API_HOST=10.0.2.2`<br>`EXPO_PUBLIC_API_PORT=3000` |
| **iOS Simulator** | Local Backend (Port 3000) | `EXPO_PUBLIC_API_HOST=localhost`<br>`EXPO_PUBLIC_API_PORT=3000` |
| **Physical Device (LAN)** | Local Backend on Computer | `EXPO_PUBLIC_API_HOST=192.168.X.X` *(your machine's local IP)*<br>`EXPO_PUBLIC_API_PORT=3000` |
| **Production / Staging** | Live Cloud API | `API_BASE_URL=https://www.sharnex.com/api` |

---

## 🔄 How to Reconnect After Switching Wi-Fi Networks

When you switch Wi-Fi networks or router connections while testing on a **physical device**:

1. **Find your computer's local IP address**:
   - **Windows (PowerShell)**: Run `ipconfig` and copy the `IPv4 Address` (e.g. `192.168.1.105`).
   - **macOS / Linux**: Run `ifconfig` or `ip a` and copy your local Wi-Fi IP (e.g. `192.168.1.105`).

2. **Update your `.env` file**:
   ```env
   EXPO_PUBLIC_API_HOST=192.168.1.105
   EXPO_PUBLIC_API_PORT=3000
   ```

3. **Confirm backend server binding**:
   Ensure your backend Node.js / Express server binds to all network interfaces (`0.0.0.0`):
   ```javascript
   app.listen(3000, '0.0.0.0', () => {
     console.log('Server running on http://0.0.0.0:3000');
   });
   ```

4. **Reload Metro Bundler**:
   In your terminal running `npx react-native start`, press `r` to reload the bundle on your device.

---

## 🔒 Android Network Security
Android 9+ requires cleartext traffic permissions for HTTP local addresses. This project includes:
- `android:usesCleartextTraffic="true"` and `android:networkSecurityConfig="@xml/network_security_config"` in `AndroidManifest.xml`.
- Custom `network_security_config.xml` permitting `10.0.2.2`, `localhost`, and `sharnex.com`.
