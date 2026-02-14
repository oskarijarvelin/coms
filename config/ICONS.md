# Icon Configuration Guide

This guide explains how to customize the icons used throughout the Coms application.

## Overview

All icons in the application are now using [Heroicons](https://heroicons.com), a set of professional, free MIT-licensed icons designed by the creators of Tailwind CSS. The icons are fully customizable through the `config/icons.tsx` file.

## How It Works

Instead of using emojis scattered throughout the codebase, all icons are now centralized in a single configuration file. This makes it easy to:

- Change icons consistently across the entire application
- Maintain a professional, cohesive look
- Customize icons to match your brand
- Ensure accessibility compliance

## Customizing Icons

### Step 1: Browse Available Icons

Visit [heroicons.com](https://heroicons.com) to browse all available icons. Heroicons provides two styles:
- **Outline** (24x24): Thin, outlined icons (default for most use cases)
- **Solid** (24x24): Filled icons (used for emphasis)

### Step 2: Import Your Desired Icon

Open `config/icons.tsx` and import your desired icon at the top of the file:

```typescript
import {
  // Existing imports...
  MicrophoneIcon,
  // Add your new icon here
  HeartIcon,  // Example: adding a heart icon
} from '@heroicons/react/24/outline';
```

### Step 3: Update the Icon Configuration

Find the icon you want to change in the `icons` object and replace it:

```typescript
export const icons = {
  // Audio controls
  microphone: MicrophoneIcon,      // Change this to your preferred icon
  microphoneMuted: SpeakerXMarkIcon,
  speaker: SpeakerWaveIcon,
  
  // ... rest of configuration
};
```

### Example: Changing the Microphone Icon

Let's say you want to use a different icon for the microphone button:

1. Visit heroicons.com and find an icon you like (e.g., `SignalIcon`)
2. Import it in `config/icons.tsx`:
   ```typescript
   import { SignalIcon } from '@heroicons/react/24/outline';
   ```
3. Update the configuration:
   ```typescript
   export const icons = {
     microphone: SignalIcon,  // Changed from MicrophoneIcon
     // ...
   };
   ```

## Available Icon Configurations

Here's a complete list of all customizable icons:

### Audio Controls
- `microphone` - Active microphone icon
- `microphoneMuted` - Muted microphone icon
- `speaker` - Speaker/audio output icon

### UI Controls
- `settings` - Settings/configuration icon
- `chevronUp` - Expand/show more icon
- `chevronDown` - Collapse/hide icon
- `close` - Close/cancel icon
- `check` - Confirm/success icon

### Chat and Communication
- `chat` - Text chat icon
- `send` - Send message icon
- `invite` - Invite/share icon

### Actions
- `edit` - Edit/modify icon
- `delete` - Delete/remove icon

### Status and Info
- `audioProcessing` - Audio processing/signal icon
- `audioDevice` - Audio devices icon
- `room` - Room/audio chat icon
- `warning` - Warning/error icon
- `info` - Information/tip icon

## Icon Sizes

The application uses predefined size classes for consistency. Available sizes:

- `xs` - 12px (w-3 h-3)
- `sm` - 16px (w-4 h-4)
- `md` - 20px (w-5 h-5)
- `lg` - 24px (w-6 h-6)
- `xl` - 32px (w-8 h-8)
- `2xl` - 40px (w-10 h-10)

Icons automatically use the appropriate size based on their context.

## Advanced Customization

### Using Solid Icons

If you want to use solid (filled) icons instead of outline icons:

```typescript
import {
  MicrophoneIcon as MicrophoneSolidIcon,
} from '@heroicons/react/24/solid';

export const icons = {
  microphone: MicrophoneSolidIcon,  // Solid version
  // ...
};
```

### Mixing Icon Styles

You can mix outline and solid icons throughout your application:

```typescript
import { MicrophoneIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneSolidIcon } from '@heroicons/react/24/solid';

export const icons = {
  microphone: MicrophoneIcon,           // Outline for subtle look
  room: MicrophoneSolidIcon,           // Solid for emphasis
  // ...
};
```

### Using Icons from Other Packages

While this configuration is designed for Heroicons, you can use icons from other React icon libraries as long as they:
1. Are React components
2. Accept className props for styling
3. Are SVG-based

Example with a custom icon:

```typescript
import CustomIcon from './path/to/CustomIcon';

export const icons = {
  microphone: CustomIcon,
  // ...
};
```

## Best Practices

1. **Consistency**: Use icons from the same family (all Heroicons outline, or all solid)
2. **Meaning**: Choose icons that clearly represent their function
3. **Testing**: After changing icons, test the application to ensure they display correctly
4. **Accessibility**: Heroicons are designed with accessibility in mind, maintaining proper contrast and sizing

## Troubleshooting

### Icons Not Displaying

If icons don't appear after making changes:

1. Check that you've imported the icon correctly
2. Verify the icon name matches the Heroicons documentation
3. Clear your build cache: `rm -rf .next && npm run build`
4. Check the browser console for any errors

### Icons Too Large or Small

Icon sizes are controlled by the component using them, not in this configuration file. If you need to adjust sizes globally, modify the `iconSizes` object in `config/icons.tsx`.

## Example Configuration

Here's a complete example of customizing multiple icons:

```typescript
import {
  // Import your preferred icons
  VideoCameraIcon,      // Use as microphone
  SpeakerXMarkIcon,
  BoltIcon,             // Use as speaker
  WrenchIcon,           // Use as settings
} from '@heroicons/react/24/outline';

export const icons = {
  // Customize to your preference
  microphone: VideoCameraIcon,    // Creative choice!
  microphoneMuted: SpeakerXMarkIcon,
  speaker: BoltIcon,              // Something different
  settings: WrenchIcon,           // More technical look
  // ... rest of configuration
};
```

## Need Help?

- Browse icons: [heroicons.com](https://heroicons.com)
- Heroicons GitHub: [github.com/tailwindlabs/heroicons](https://github.com/tailwindlabs/heroicons)
- Tailwind CSS docs: [tailwindcss.com](https://tailwindcss.com)
