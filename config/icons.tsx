/**
 * Icon Configuration
 * 
 * This file allows users to customize which icons are used throughout the application.
 * Icons are from @heroicons/react. You can change any icon by importing a different one
 * from the heroicons library.
 * 
 * Available icons: https://heroicons.com
 * 
 * To customize an icon:
 * 1. Find your desired icon at https://heroicons.com
 * 2. Import it at the top of this file
 * 3. Replace the icon in the configuration object below
 */

import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CogIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SignalIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';

import {
  MicrophoneIcon as MicrophoneSolidIcon,
} from '@heroicons/react/24/solid';

/**
 * Icon configuration object
 * Each key represents a use case, and the value is the icon component to use
 */
export const icons = {
  // Audio controls
  microphone: MicrophoneIcon,           // Active microphone
  microphoneMuted: SpeakerXMarkIcon,    // Muted microphone
  speaker: SpeakerWaveIcon,             // Speaker/audio output
  
  // UI controls
  settings: CogIcon,                    // Settings/configuration
  chevronUp: ChevronUpIcon,             // Expand/show more
  chevronDown: ChevronDownIcon,         // Collapse/hide
  close: XMarkIcon,                     // Close/cancel
  check: CheckIcon,                     // Confirm/success
  
  // Chat and communication
  chat: ChatBubbleLeftRightIcon,        // Text chat
  send: PaperAirplaneIcon,              // Send message
  invite: ShareIcon,                    // Invite/share
  
  // Actions
  edit: PencilIcon,                     // Edit/modify
  delete: TrashIcon,                    // Delete/remove
  
  // Status and info
  audioProcessing: SignalIcon,          // Audio processing/signal
  audioDevice: MusicalNoteIcon,         // Audio devices
  room: MicrophoneSolidIcon,            // Room/audio chat
  warning: ExclamationTriangleIcon,     // Warning/error
  info: LightBulbIcon,                  // Information/tip
};

/**
 * Icon size classes
 * Tailwind CSS classes for consistent icon sizing
 */
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
};

export type IconSize = keyof typeof iconSizes;
