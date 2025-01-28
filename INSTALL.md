# Installation and Setup Guide

## 📋 Prerequisites

Before installing the Google Calendar Chrome Extension, ensure you have:

- **Google Chrome** version 88 or higher
- **Google Account** with Calendar access
- **Developer Mode** enabled in Chrome (for manual installation)

## 🚀 Installation Methods

### Method 1: Chrome Web Store (Recommended)
*Coming soon - extension will be published to the Chrome Web Store*

### Method 2: Manual Installation (Developer Mode)

1. **Download the Extension**
   - Clone this repository or download as ZIP
   - Extract to a local folder if downloaded as ZIP

2. **Enable Developer Mode**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension folder
   - The extension will appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Pin the "Quick View: Google Calendar" extension for easy access

## 🔐 Initial Setup

### First-Time Authentication

1. **Click the Extension Icon**
   - Find the calendar icon in your Chrome toolbar
   - Click to open the popup

2. **Login with Google**
   - Click "Login with Google" button
   - Complete the OAuth flow in the new window
   - Grant permission to access your Google Calendar

3. **Start Using**
   - Your today's events will load automatically
   - Extension is now ready to use!

### Permission Setup

The extension requires the following permissions:
- **Google Calendar Access**: To read and manage your calendar events
- **Storage**: To cache events locally for better performance
- **Notifications**: To alert you about upcoming events
- **Active Tab**: To open meeting links and Google Calendar

## 🎯 Quick Start Guide

### Basic Navigation

1. **View Your Events**
   - **Today**: See all events for today (default view)
   - **Tomorrow**: Preview tomorrow's schedule
   - **Week**: View entire week with day-by-day breakdown

2. **Switch Views**
   - Use the view selector buttons at the top
   - Keyboard shortcuts: Ctrl/Cmd + 1 (Today), 2 (Tomorrow), 3 (Week)

3. **Refresh Events**
   - Click the refresh icon to manually update
   - Events auto-refresh every 15 minutes in background

### Event Management

1. **Join Meetings**
   - Click the "Join" button on events with meeting links
   - Opens Google Meet/Hangouts in a new tab

2. **Copy Event Details**
   - Click the copy icon to copy event information
   - Includes title, time, location, and meeting links

3. **Delete Events**
   - Click the delete icon (trash can)
   - Confirm deletion in the popup modal

4. **Quick Add Events**
   - Click "+ Quick Add Event" button
   - Opens Google Calendar in a new tab

### Theme and Settings

1. **Toggle Theme**
   - Click the sun/moon icon to switch between light/dark mode
   - Theme preference is automatically saved

2. **Access Settings**
   - Right-click the extension icon
   - Select "Options" from the context menu
   - Configure sync intervals, notifications, and other preferences

## ⚙️ Configuration Options

### Settings Page Features

Access via right-click → Options:

1. **Appearance**
   - Dark/Light theme toggle
   - Automatic theme detection

2. **Sync & Performance**
   - Auto-refresh toggle
   - Sync interval (5 min to 1 hour)
   - Cache management

3. **Notifications**
   - Event notification toggle
   - Notification timing (5-30 minutes before events)

4. **Privacy & Data**
   - Clear cache option
   - Data usage information

## 🔧 Troubleshooting

### Common Issues

1. **"Authentication Required" Error**
   - **Solution**: Click logout and login again
   - **Cause**: Token may have expired
   - **Prevention**: Extension auto-refreshes tokens

2. **Events Not Loading**
   - **Check**: Internet connection
   - **Try**: Manual refresh (reload button)
   - **Verify**: Google Calendar permissions

3. **Slow Performance**
   - **Solution**: Clear cache in settings
   - **Check**: Number of calendar events
   - **Optimize**: Reduce sync frequency

4. **Missing Events**
   - **Verify**: Events exist in Google Calendar
   - **Check**: Calendar permissions
   - **Try**: Force refresh

### Performance Optimization

1. **Reduce Sync Frequency**
   - Go to Options → Sync & Performance
   - Increase sync interval to 30 minutes or 1 hour

2. **Clear Cache Regularly**
   - Go to Options → Privacy & Data
   - Click "Clear Cache" monthly

3. **Limit Calendar Size**
   - Consider archiving old events in Google Calendar
   - Use calendar filtering if available

### Advanced Troubleshooting

1. **Reset Extension**
   - Go to `chrome://extensions/`
   - Remove and reinstall the extension
   - Login again with Google

2. **Check Console Logs**
   - Right-click extension popup → Inspect
   - Check Console tab for error messages
   - Report issues with console logs

3. **Permissions Check**
   - Go to Google Account settings
   - Check third-party app permissions
   - Verify calendar access is granted

## 🛡️ Security and Privacy

### Data Handling

- **Local Storage Only**: All data cached locally in Chrome
- **No External Servers**: Direct connection to Google APIs
- **Encrypted Communication**: HTTPS/OAuth 2.0 protocols
- **Minimal Permissions**: Only necessary calendar access

### Privacy Features

- **Token Management**: Automatic token refresh and cleanup
- **Cache Expiration**: 5-minute TTL for cached events
- **Secure Authentication**: Google OAuth 2.0 flow
- **No Tracking**: No analytics or user tracking

### Security Best Practices

1. **Regular Updates**
   - Keep Chrome updated
   - Update extension when new versions available

2. **Permission Review**
   - Regularly check granted permissions
   - Remove access if no longer needed

3. **Account Security**
   - Use strong Google account password
   - Enable 2FA on Google account

## 📱 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1` | Switch to Today view |
| `Ctrl/Cmd + 2` | Switch to Tomorrow view |
| `Ctrl/Cmd + 3` | Switch to Week view |
| `Ctrl/Cmd + R` | Refresh events |
| `Ctrl/Cmd + T` | Toggle theme |
| `Escape` | Close modals/toasts |

## 🔄 Updates and Maintenance

### Automatic Updates
- Chrome automatically updates extensions
- Background sync keeps events current
- Cache cleanup prevents storage bloat

### Manual Maintenance
- Clear cache monthly via settings
- Review permissions quarterly
- Check for new features in updates

## 📞 Support and Feedback

### Getting Help

1. **Documentation**: Check this guide first
2. **GitHub Issues**: Report bugs and request features
3. **Settings Reset**: Try clearing cache and re-login

### Providing Feedback

When reporting issues, please include:
- Chrome version
- Extension version
- Operating system
- Steps to reproduce
- Console error logs (if any)

---

**Need more help?** Create an issue on GitHub with detailed information about your problem.
