// Options page JavaScript for Google Calendar Extension
// Handles settings management and user preferences

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const themeToggle = document.getElementById('theme-toggle');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const syncIntervalSelect = document.getElementById('sync-interval');
  const notificationTimingSelect = document.getElementById('notification-timing');
  const clearCacheBtn = document.getElementById('clear-cache-btn');
  const saveBtn = document.getElementById('save-settings');
  const statusMessage = document.getElementById('status-message');

  // Default settings
  const defaultSettings = {
    theme: 'light',
    autoRefresh: true,
    notifications: true,
    syncInterval: 900000, // 15 minutes
    notificationTiming: 600000 // 10 minutes
  };

  // Initialize page
  init();

  function init() {
    loadSettings();
    setupEventListeners();
    updateThemeIcons();
  }

  function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    darkModeToggle.addEventListener('click', () => toggleSetting('theme'));
    autoRefreshToggle.addEventListener('click', () => toggleSetting('autoRefresh'));
    notificationsToggle.addEventListener('click', () => toggleSetting('notifications'));
    syncIntervalSelect.addEventListener('change', updateSyncInterval);
    notificationTimingSelect.addEventListener('change', updateNotificationTiming);
    clearCacheBtn.addEventListener('click', clearCache);
    saveBtn.addEventListener('click', saveSettings);
  }

  async function loadSettings() {
    try {
      const settings = await getStorageData(Object.keys(defaultSettings));
      
      // Apply defaults for missing settings
      const currentSettings = { ...defaultSettings, ...settings };
      
      // Update UI elements
      updateToggleState(darkModeToggle, currentSettings.theme === 'dark');
      updateToggleState(autoRefreshToggle, currentSettings.autoRefresh);
      updateToggleState(notificationsToggle, currentSettings.notifications);
      
      syncIntervalSelect.value = currentSettings.syncInterval;
      notificationTimingSelect.value = currentSettings.notificationTiming;
      
      // Apply theme
      setTheme(currentSettings.theme);
      
      console.log('Settings loaded:', currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      showStatus('Error loading settings', 'error');
    }
  }

  function updateToggleState(toggle, isActive) {
    toggle.classList.toggle('active', isActive);
  }

  function toggleSetting(settingName) {
    const toggle = document.getElementById(`${settingName === 'theme' ? 'dark-mode' : settingName}-toggle`);
    const isActive = toggle.classList.contains('active');
    
    if (settingName === 'theme') {
      const newTheme = isActive ? 'light' : 'dark';
      setTheme(newTheme);
      updateToggleState(toggle, newTheme === 'dark');
    } else {
      updateToggleState(toggle, !isActive);
    }
  }

  function updateSyncInterval() {
    // Auto-save sync interval changes
    const interval = parseInt(syncIntervalSelect.value);
    chrome.storage.local.set({ syncInterval: interval }, () => {
      console.log('Sync interval updated:', interval);
      
      // Notify background script of setting change
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: { syncInterval: interval }
      });
    });
  }

  function updateNotificationTiming() {
    // Auto-save notification timing changes
    const timing = parseInt(notificationTimingSelect.value);
    chrome.storage.local.set({ notificationTiming: timing }, () => {
      console.log('Notification timing updated:', timing);
    });
  }

  async function clearCache() {
    try {
      clearCacheBtn.disabled = true;
      clearCacheBtn.textContent = 'Clearing...';
      
      // Get all storage data
      const allData = await getAllStorageData();
      const keysToRemove = [];
      
      // Find cache-related keys
      Object.keys(allData).forEach(key => {
        if (key.endsWith('_events') || key.endsWith('_timestamp') || 
            key === 'lastUpdateTime' || key === 'cachedEvents' || 
            key === 'lastFetchDate') {
          keysToRemove.push(key);
        }
      });
      
      // Remove cache data
      if (keysToRemove.length > 0) {
        await removeStorageData(keysToRemove);
        showStatus(`Cache cleared! Removed ${keysToRemove.length} items.`, 'success');
      } else {
        showStatus('No cache data found to clear.', 'success');
      }
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      showStatus('Error clearing cache', 'error');
    } finally {
      clearCacheBtn.disabled = false;
      clearCacheBtn.textContent = 'Clear Cache';
    }
  }

  async function saveSettings() {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      // Collect current settings
      const settings = {
        theme: darkModeToggle.classList.contains('active') ? 'dark' : 'light',
        autoRefresh: autoRefreshToggle.classList.contains('active'),
        notifications: notificationsToggle.classList.contains('active'),
        syncInterval: parseInt(syncIntervalSelect.value),
        notificationTiming: parseInt(notificationTimingSelect.value)
      };
      
      // Save to storage
      await setStorageData(settings);
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: settings
      });
      
      showStatus('Settings saved successfully!', 'success');
      console.log('Settings saved:', settings);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      showStatus('Error saving settings', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateToggleState(darkModeToggle, newTheme === 'dark');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcons(theme);
  }

  function updateThemeIcons(theme = null) {
    if (!theme) {
      theme = document.documentElement.getAttribute('data-theme');
    }
    
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  // Utility functions
  function getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  function getAllStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  }

  function setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  function removeStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  // Handle storage changes from other parts of the extension
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Reload settings if they were changed externally
      Object.keys(changes).forEach(key => {
        if (defaultSettings.hasOwnProperty(key)) {
          console.log(`Setting ${key} changed externally, reloading...`);
          loadSettings();
        }
      });
    }
  });
});
