# Expense Tracker — Group Cost Splitting App

A cross-platform mobile app (iOS + Android) for tracking shared expenses with receipt scanning, item-level cost splitting, and automatic debt settlement.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo SDK 51 |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Storage | Firebase Storage (receipt images) |
| OCR | Google Vision API |
| Navigation | React Navigation v6 |

---

## Features

### Phase 1 (Implemented)
- Email/password authentication
- Create groups and add members by email
- Manual expense entry with item-level breakdown
- Multi-select participant assignment per item
- Equal-split calculation per item
- Net balance computation per group
- Debt minimization algorithm (minimize number of settlement transactions)
- Expense history per group with detailed breakdown
- Long-press to delete expenses (creator only)

### Phase 2 (Implemented)
- Receipt photo capture (camera) or upload (gallery)
- Google Vision API OCR to extract item names + prices
- Editable parsed item list with full manual override
- Receipt image stored in Firebase Storage and attached to expense

---

## Setup

### 1. Prerequisites

```bash
node >= 18
npm >= 9
```

Install Expo CLI globally:
```bash
npm install -g expo-cli
```

### 2. Install dependencies

```bash
cd expense-tracker
npm install
```

### 3. Configure Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Email/Password**
3. Create a **Firestore Database** (start in test mode, then apply the rules below)
4. Enable **Firebase Storage**
5. Copy your web app config into `src/firebase/config.js`:

```js
const firebaseConfig = {
  apiKey: 'your-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '...',
  appId: '...',
};
```

### 4. Deploy Firestore & Storage rules

```bash
npm install -g firebase-tools
firebase login
firebase init  # select Firestore + Storage, use existing project
firebase deploy --only firestore:rules,storage
```

Or manually paste the contents of `firestore.rules` and `storage.rules` in the Firebase Console.

### 5. (Optional) Enable OCR — Receipt Scanning

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Cloud Vision API**
3. Create an API key
4. Add it to `src/firebase/config.js`:

```js
export const VISION_API_KEY = 'your-google-vision-api-key';
```

Without this key, receipt scanning is disabled — manual item entry still works.

### 6. Run the app

```bash
npx expo start
```

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with **Expo Go** app on a physical device

---

## Project Structure

```
expense-tracker/
├── App.js                        # Entry point
├── src/
│   ├── firebase/config.js        # Firebase + Vision API config
│   ├── contexts/AuthContext.js   # Auth state & helpers
│   ├── navigation/AppNavigator.js
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── groups/
│   │   │   ├── GroupListScreen.js
│   │   │   ├── GroupDetailScreen.js
│   │   │   └── CreateGroupScreen.js
│   │   ├── expenses/
│   │   │   ├── AddExpenseScreen.js
│   │   │   ├── ExpenseDetailScreen.js
│   │   │   └── ReceiptScanScreen.js
│   │   └── SettlementScreen.js
│   ├── components/               # Reusable UI primitives
│   ├── services/
│   │   ├── firebaseService.js    # All Firestore operations
│   │   └── ocrService.js        # Google Vision API + text parser
│   ├── utils/
│   │   ├── settlement.js         # Balance + debt minimization
│   │   └── formatters.js        # Currency, dates, avatars
│   └── theme/index.js           # Colors, spacing, typography
├── firestore.rules
└── storage.rules
```

---

## Data Model

### `users/{uid}`
```json
{ "id": "uid", "name": "Jane", "email": "jane@example.com", "createdAt": "timestamp" }
```

### `groups/{groupId}`
```json
{
  "name": "Bali Trip",
  "members": [{ "id": "uid1", "name": "Jane", "email": "..." }, ...],
  "createdBy": "uid1",
  "createdAt": "timestamp"
}
```

### `expenses/{expenseId}`
```json
{
  "groupId": "gid",
  "title": "Dinner",
  "totalAmount": 120.50,
  "paidBy": { "id": "uid1", "name": "Jane" },
  "date": "timestamp",
  "receiptImageUrl": "https://...",
  "items": [
    {
      "id": "item1",
      "name": "Pad Thai",
      "price": 18.00,
      "participants": [{ "id": "uid1", "name": "Jane" }, { "id": "uid2", "name": "Bob" }]
    }
  ]
}
```

---

## Settlement Algorithm

1. Compute each member's **net balance**: `paid_amount - owed_amount`
2. Separate into **creditors** (net > 0) and **debtors** (net < 0)
3. Greedily match the largest debtor to the largest creditor
4. Record a payment transaction, reduce both balances, repeat
5. Result: minimum number of payments to settle all debts

**Example:** A owes B $30, B owes C $20 → simplified: A pays C $20, A pays B $10

---

## Build for Production

### Expo EAS Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

### Local builds

```bash
npx expo run:ios     # requires Xcode on macOS
npx expo run:android # requires Android Studio
```
