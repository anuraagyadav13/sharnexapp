# Sharnex Frontend Architecture

This document describes the enterprise-level React Native architecture adopted for Sharnex. The structure ensures predictable code organization, robust separation of concerns, and ease of scalability for new features.

## Directory Structure

```text
src/
├── assets/         # Static assets like fonts, icons, and company logos
│   ├── fonts/
│   └── images/
├── components/     # Reusable, shared UI elements
│   ├── animations/ # Complex reanimated components (ScaleButton)
│   ├── layout/     # Structural UI components (NavigationDrawer)
│   └── common/     # Buttons, Modals, Form inputs
├── constants/      # App-wide static configuration
│   ├── theme.ts    # Global colors, typography, sizing metrics
│   └── api.ts      # API endpoint mapping and versioning
├── hooks/          # Custom reusable React hooks (e.g. useDebounce, useNetwork)
├── navigation/     # React Navigation stacks and drawer configs
├── store/          # Global state management providers (Context/Redux)
│   └── AuthContext.tsx
├── screens/        # Screen-level domain-driven components
│   ├── auth/       # Login, Register, Pre-Auth Landing
│   ├── principal/  # Principal Role Dashboard & Modules
│   ├── student/    # Student Role Dashboard & Modules
│   ├── teacher/    # Teacher Role Dashboard & Modules
│   └── shared/     # Cross-role screens (Account Settings, Profile)
├── services/       # External service and API integrations
│   └── apiClient.ts# Axios singleton with auth interceptors
├── types/          # Global TypeScript interfaces and DTOs
│   └── navigation.ts
└── utils/          # Pure helper/utility functions (Date formatting, validators)
```

## Architectural Guidelines

*   **Domain Segregation**: Screens are strictly divided into their domain role (`auth`, `principal`, `student`, `teacher`). Do not mix logical concerns across domains.
*   **API Management**: All external requests must be handled via `src/services/apiClient.ts` to ensure authentication tokens and refresh handoffs are intercepted transparently. Let `api.ts` serve as the single source of truth for paths to prevent URL hardcoding.
*   **State & Theming**: Global styles should pull from `src/constants/theme.ts`. Avoid hardcoding hex colors across screens. Centralize state using the Context/Redux files inside `src/store`.

## Adding a New Screen
1. Determine the domain folder in `src/screens` (auth/principal/student/teacher).
2. Create the screen component.
3. Add the screen's type definition to `RootStackParamList` in `src/types/navigation.ts`.
4. Register the route in `App.tsx` (soon to be `navigation/RootNavigator.tsx`).
