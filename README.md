# Quick View: Google Calendar Chrome Extension

A modern, feature-rich Chrome extension for quickly viewing and managing your Google Calendar events with a beautiful, responsive UI.

## ✨ Features

### 🎨 Modern UI & Design
- **shadcn/ui inspired design system** with consistent styling
- **Dark/Light theme support** with seamless theme switching
- **Responsive design** that works on all screen sizes
- **Beautiful animations** and micro-interactions
- **Shimmer loading states** for smooth user experience

### 📅 Multi-Day View Support
- **Today View**: See all events for today
- **Tomorrow View**: Preview tomorrow's schedule
- **Week View**: Overview of the entire week with day-by-day breakdown
- **Smart caching** with 5-minute TTL for optimal performance

### ⚡ Advanced Event Management
- **One-click meeting join** for Google Meet/Hangouts links
- **Copy event details** to clipboard with formatted text
- **Delete events** directly from the extension
- **Quick add events** that opens Google Calendar in a new tab

### 🔄 Background Sync & Performance
- **Automatic background sync** every 15 minutes
- **Smart caching system** with TTL-based invalidation
- **Performance optimizations** with incremental loading
- **Cache cleanup** to prevent storage bloat

### 🔔 Smart Notifications
- **Upcoming event notifications** (5-10 minutes before events)
- **Background monitoring** for seamless experience
- **Configurable notification settings**

### 🔐 Security & Privacy
- **Secure OAuth 2.0 authentication** with Google
- **Token refresh mechanism** for expired tokens
- **Local storage only** - no external servers
- **Minimal permissions** for maximum security

## 🚀 Installation

### From Chrome Web Store
*(Will be available once published)*

### Manual Installation (Developer Mode)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will appear in your Chrome toolbar

## 📖 Usage

### Initial Setup
1. Click the extension icon in your Chrome toolbar
2. Click "Login with Google" to authenticate
3. Grant permission to access your Google Calendar
4. Start viewing your events immediately!

### Navigation
- **View Selector**: Switch between Today, Tomorrow, and Week views
- **Theme Toggle**: Switch between light and dark themes
- **Reload Button**: Manually refresh events
- **Quick Add**: Opens Google Calendar to create new events

### Event Management
- **Join Meeting**: Click the "Join" button on events with meeting links
- **Copy Details**: Click the copy icon to copy event information
- **Delete Events**: Click the delete icon and confirm to remove events

### Settings
- Themes are automatically saved and restored
- Background sync preferences are configurable
- Notification settings can be adjusted

## 🛠 Technical Details

### Architecture
- **Manifest V3** for modern Chrome extension standards
- **Service Worker** background script for performance
- **Chrome Identity API** for secure authentication
- **Chrome Storage API** for local data persistence

### Performance Features
- **Smart Caching**: 5-minute TTL with background refresh
- **Lazy Loading**: Events load progressively
- **Background Sync**: Automatic updates every 15 minutes
- **Cache Cleanup**: Automatic removal of stale data

### Security Features
- **OAuth 2.0**: Secure authentication flow
- **Token Management**: Automatic refresh and cleanup
- **Minimal Permissions**: Only necessary API access
- **Local Storage**: No external data transmission

## 🎨 Design System

### Color Palette
The extension uses a comprehensive color system based on shadcn/ui:
- **Primary**: Deep blue tones for main actions
- **Secondary**: Neutral grays for supporting elements
- **Accent**: Light backgrounds for interactive states
- **Destructive**: Red tones for delete actions

### Typography
- **Font**: System UI fonts for optimal readability
- **Hierarchy**: Clear heading and body text distinction
- **Sizing**: Responsive text scaling

### Components
- **Cards**: Elevated event containers with hover effects
- **Buttons**: Consistent styling across all interactions
- **Modals**: Focused dialogs for confirmations
- **Toasts**: Non-intrusive notifications

## 🔧 Development

### File Structure
```
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Frontend logic and API integration
├── background.js          # Service worker for background tasks
├── styles.css             # Complete styling system
├── icons/                 # Extension icons
└── README.md              # This file
```

### Key Functions
- **Authentication**: `checkAuthentication()`, `handleLogin()`
- **Event Loading**: `loadEvents()`, `fetchEventsFromAPI()`
- **UI Management**: `renderEvents()`, `showLoadingState()`
- **Background Sync**: `performBackgroundSync()`, `syncEventsForView()`

### API Integration
- **Google Calendar API v3**: Full integration for events
- **OAuth 2.0 Flow**: Secure user authentication
- **Rate Limiting**: Intelligent request management

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Make your changes
3. Test in Chrome developer mode
4. Submit a pull request

### Code Style
- **ES6+**: Modern JavaScript features
- **Async/Await**: Promise-based async operations
- **Modular Design**: Clear separation of concerns
- **Comments**: Comprehensive code documentation

## 📝 Changelog

### Version 2.0.0
- ✨ Added multi-day view support (Today, Tomorrow, Week)
- 🎨 Implemented dark mode with theme persistence
- ⚡ Added background sync for automatic updates
- 🔄 Enhanced event management (copy, delete, join)
- 🎯 Improved performance with smart caching
- 🔔 Added upcoming event notifications
- 📱 Responsive design improvements
- 🛡️ Enhanced security with token management

### Version 1.0.0
- 🎉 Initial release
- 📅 Basic today view
- 🔐 Google Calendar integration
- 🎨 Modern UI design

## 🐛 Known Issues

- Large calendars (>100 events) may experience slower loading
- Week view performance depends on event count
- Notifications require Chrome notification permissions

## 📞 Support

For issues, feature requests, or contributions:
1. Create an issue on GitHub
2. Provide detailed reproduction steps
3. Include Chrome version and OS information

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui**: Inspiration for the design system
- **Google Calendar API**: Event data and integration
- **Chrome Extensions API**: Platform capabilities
- **Material Design**: UI/UX principles

---

**Made with ❤️ for productivity and beautiful design**
