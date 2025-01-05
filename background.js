// Background service worker for Google Calendar Extension
// Handles background sync, notifications, and performance optimization

// Configuration
const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes
const CACHE_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Background sync timer
let syncTimer = null;
let cleanupTimer = null;

// Extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Calendar extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default preferences
    chrome.storage.local.set({
      theme: 'light',
      autoRefresh: true,
      notifications: true,
      syncInterval: SYNC_INTERVAL
    });
  }
  
  setupBackgroundTasks();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Calendar extension started');
  setupBackgroundTasks();
});

// Setup background tasks
function setupBackgroundTasks() {
  startBackgroundSync();
  startCacheCleanup();
}

// Background sync for calendar events
function startBackgroundSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
  }
  
  syncTimer = setInterval(async () => {
    try {
      await performBackgroundSync();
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }, SYNC_INTERVAL);
}

async function performBackgroundSync() {
  console.log('Performing background sync...');
  
  // Check if user has enabled auto-refresh
  const settings = await getStorageData(['autoRefresh']);
  if (!settings.autoRefresh) return;
  
  // Get current token
  const token = await getAuthToken();
  if (!token) return;
  
  try {
    // Sync today's events
    await syncEventsForView('today', token);
    
    // Sync tomorrow's events for better UX
    await syncEventsForView('tomorrow', token);
    
    console.log('Background sync completed successfully');
  } catch (error) {
    console.error('Background sync error:', error);
    
    // If token is expired, remove it from cache
    if (error.message.includes('401')) {
      chrome.identity.removeCachedAuthToken({ token });
    }
  }
}

async function syncEventsForView(view, token) {
  const { timeMin, timeMax } = getTimeRangeForView(view);
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + 
    `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Cache the events
  const cacheKey = `${view}_events`;
  const timestampKey = `${view}_timestamp`;
  
  await setStorageData({
    [cacheKey]: data,
    [timestampKey]: Date.now(),
    lastUpdateTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
}

function getTimeRangeForView(view) {
  const now = new Date();
  let timeMin, timeMax;

  switch (view) {
    case 'today':
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'tomorrow':
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
      break;
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      timeMin = startOfWeek;
      timeMax = endOfWeek;
      break;
    default:
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString()
  };
}

// Cache cleanup
function startCacheCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }
  
  cleanupTimer = setInterval(async () => {
    try {
      await cleanupOldCache();
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }, CACHE_CLEANUP_INTERVAL);
}

async function cleanupOldCache() {
  console.log('Cleaning up old cache...');
  
  const allData = await getAllStorageData();
  const keysToRemove = [];
  const now = Date.now();
  
  Object.keys(allData).forEach(key => {
    if (key.endsWith('_timestamp')) {
      const timestamp = allData[key];
      const age = now - timestamp;
      
      if (age > MAX_CACHE_AGE) {
        // Remove both timestamp and associated data
        const dataKey = key.replace('_timestamp', '_events');
        keysToRemove.push(key, dataKey);
      }
    }
  });
  
  if (keysToRemove.length > 0) {
    await removeStorageData(keysToRemove);
    console.log(`Cleaned up ${keysToRemove.length} old cache entries`);
  }
}

// Notification system for upcoming events
async function checkUpcomingEvents() {
  const settings = await getStorageData(['notifications']);
  if (!settings.notifications) return;
  
  const token = await getAuthToken();
  if (!token) return;
  
  try {
    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` + 
      `timeMin=${now.toISOString()}&timeMax=${in15Minutes.toISOString()}&singleEvents=true&orderBy=startTime`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Show notification for upcoming events
        data.items.forEach(event => {
          if (event.start.dateTime) {
            const eventTime = new Date(event.start.dateTime);
            const timeDiff = eventTime.getTime() - now.getTime();
            
            // Notify for events starting in 5-10 minutes
            if (timeDiff > 5 * 60 * 1000 && timeDiff <= 10 * 60 * 1000) {
              showEventNotification(event);
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error checking upcoming events:', error);
  }
}

function showEventNotification(event) {
  const eventTime = new Date(event.start.dateTime);
  const timeStr = eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.jpeg',
    title: 'Upcoming Calendar Event',
    message: `${event.summary || 'Untitled Event'} at ${timeStr}`,
    priority: 1
  });
}

// Utility functions
function getAuthToken() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      resolve(chrome.runtime.lastError ? null : token);
    });
  });
}

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

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'forceSync':
      performBackgroundSync().then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true; // Keep message channel open for async response
      
    case 'updateSettings':
      if (message.settings.syncInterval) {
        // Restart sync with new interval
        startBackgroundSync();
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Cleanup on extension shutdown
chrome.runtime.onSuspend.addListener(() => {
  if (syncTimer) {
    clearInterval(syncTimer);
  }
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }
});

// Set up initial background tasks
setupBackgroundTasks();
