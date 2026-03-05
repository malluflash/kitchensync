# 🍎 KitchenSync

**KitchenSync** is a smart fridge & kitchen inventory manager built with React Native (Expo). Track what's in your fridge, get expiry alerts, discover AI-powered recipe ideas from whatever you have on hand, and reduce food waste — all from your phone.

---

## ✨ Features

### 🧊 Inventory Management
- Track food items across multiple fridges/storage compartments
- Set expiry dates and get notified before items go bad
- Mark items as **consumed** or **trashed** with swipe gestures
- Partial consumption: decrement quantities without removing items
- Quick re-add for frequently bought items

### 🤖 AI Recipe Suggestions
- Powered by [OpenRouter](https://openrouter.ai) (`gpt-4o-mini` by default)
- Suggests recipes using ingredients currently in your fridge
- Prioritises items expiring soonest
- Filter by meal type and dietary preferences
- Full recipe detail: ingredients list + step-by-step cooking instructions
- Optional [Pexels](https://www.pexels.com/api/) integration for matched food photos

### 🛒 Smart Shopping List
- Add items you're running low on
- Auto-suggest based on consumed/trashed history

### 📊 Analytics
- Track your sustainability score over time
- See food saved vs. wasted
- Environmental impact cards

### 🔔 Expiry Notifications
- Push notifications (via `expo-notifications`) before items expire
- Configurable reminder times

### ⭐ KitchenSync Pro ($4.99/month)
| Feature | Free | Pro |
|---|---|---|
| Inventory limit | 20 items | Unlimited |
| Barcode scanner | ✗ | ✓ |
| Smart insights | ✗ | ✓ |
| Cloud backup | ✗ | ✓ |
| Family sharing | ✗ | 5 accounts |
| Ads | ✓ | Ad-free |

---

## 📱 Screens

| Screen | Description |
|---|---|
| `InventoryScreen` | Main fridge view — browse and manage items |
| `StoragesScreen` | Manage multiple fridge/storage compartments |
| `AddItemScreen` | Add new items with name, quantity, and expiry |
| `ItemDetailsScreen` | Edit item details, mark consumed/trashed |
| `RecipesScreen` | AI-generated recipe suggestions |
| `RecipeDetailScreen` | Full recipe with ingredients & steps |
| `ShoppingListScreen` | Smart grocery list |
| `AnalyticsScreen` | Food waste & sustainability metrics |
| `AlertsScreen` | Expiry alerts at a glance |
| `SettingsScreen` | API key config, premium, notifications |
| `PremiumUpgradeScreen` | Plan comparison & subscription |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator / Android Emulator, or the **Expo Go** app on your device

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/your-username/myfridge.git
cd myfridge

# 2. Install dependencies
npm install

# 3. Start the dev server
npm start
```

Then scan the QR code with **Expo Go** (Android) or press `i` / `a` to open in a simulator.

---

## 🔑 API Keys

Configure keys inside the app under **Settings**.

### OpenRouter (required for AI recipes)
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Create a free API key (`sk-or-...`)
3. Paste it in **Settings → OpenRouter API Key**

> The app uses `openai/gpt-4o-mini` by default. You can swap the model in `src/utils/openrouter.js`.

### Pexels (optional — recipe images)
1. Sign up at [pexels.com/api](https://www.pexels.com/api/)
2. Create a free API key (`px-...`)
3. Paste it in **Settings → Pexels API Key**

If no Pexels key is set, recipe cards display a default placeholder image.

---

## 🏗️ Project Structure

```
MyFridge/
├── App.js                  # Root component, providers & navigation
├── app.json                # Expo config (bundle IDs, icons, permissions)
├── src/
│   ├── screens/            # All screen components
│   ├── context/            # React Context (FridgeContext, PremiumContext, SettingsContext)
│   ├── navigation/         # Stack & tab navigator setup
│   ├── utils/              # openrouter.js, notifications.js, etc.
│   ├── data/               # Static data (compartments, food presets)
│   ├── assets/             # Logo, icons
│   └── theme.js            # Design tokens (colors, spacing, radius)
```

---

## 🛠️ Tech Stack

| Library | Purpose |
|---|---|
| React Native + Expo ~54 | Cross-platform mobile framework |
| React Navigation v7 | Stack & bottom-tab navigation |
| AsyncStorage | Persistent local storage |
| expo-notifications | Expiry push notifications |
| expo-linear-gradient | Gradient UI elements |
| date-fns | Date formatting & diff calculations |
| @expo/vector-icons | Ionicons throughout the UI |
| react-native-svg | SVG charts in Analytics |
| OpenRouter API | LLM-powered recipe generation |
| Pexels API | Food photography for recipes |

---

## 📦 Building for Production

This project uses [EAS Build](https://docs.expo.dev/build/introduction/).

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure (first time only)
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## 📄 License

This project is private. All rights reserved © 2026 KitchenSync.
