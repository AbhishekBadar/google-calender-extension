// Google Calendar Chrome Extension
// Enhanced with multi-day view, event management, dark mode, and performance optimizations

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const loginBtn = document.getElementById('login-btn');
  const loginSection = document.getElementById('login-section');
  const eventsSection = document.getElementById('events-section');
  const eventsContainer = document.getElementById('events-container');
  const eventsContent = document.getElementById('events-content');
  const reloadBtn = document.getElementById('reload-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const viewBtns = document.querySelectorAll('.view-btn');
  const quickAddBtn = document.getElementById('quick-add-btn');
  const errorToast = document.getElementById('error-toast');

  // State Management
  let currentView = 'today';
  let currentToken = null;
  let refreshTimer = null;

  // Configuration
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
  const API_BASE_URL = 'https://www.googleapis.com/calendar/v3';

  // Performance monitoring
  let performanceMetrics = {
    loadStartTime: Date.now(),
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  // Initialize App
  init();

  function init() {
    console.log("Calendar extension loaded");
    setupEventListeners();
    loadTheme();
    checkAuthentication();
  }

  // Event Listeners Setup
  function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    reloadBtn.addEventListener('click', handleReload);
    logoutBtn.addEventListener('click', handleLogout);
    themeToggle.addEventListener('click', toggleTheme);
    quickAddBtn.addEventListener('click', handleQuickAdd);
    
    // View selector
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => handleViewChange(e.target.dataset.view));
    });

    // Toast close
    const toastClose = document.querySelector('.toast-close');
    if (toastClose) {
      toastClose.addEventListener('click', hideErrorToast);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case '1':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleViewChange('today');
          }
          break;
        case '2':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleViewChange('tomorrow');
          }
          break;
        case '3':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleViewChange('week');
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleReload();
          }
          break;
        case 't':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleTheme();
          }
          break;
        case 'Escape':
          if (errorToast.style.display === 'block') {
            hideErrorToast();
          }
          break;
      }
    });
  }

  // Authentication
  async function checkAuthentication() {
    try {
      const token = await getAuthToken(false);
      if (token) {
        currentToken = token;
        showEvents();
        loadEvents();
        startAutoRefresh();
      } else {
        showLogin();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      showLogin();
    }
  }

  function getAuthToken(interactive = false) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }

  async function handleLogin() {
    try {
      showLoadingState('Authenticating...');
      const token = await getAuthToken(true);
      currentToken = token;
      showEvents();
      await loadEvents();
      startAutoRefresh();
    } catch (error) {
      console.error('Login failed:', error);
      showError('Authentication failed. Please try again.');
      showLogin();
    }
  }

  // View Management
  function showLogin() {
    loginSection.style.display = 'flex';
    eventsSection.style.display = 'none';
    stopAutoRefresh();
  }

  function showEvents() {
    loginSection.style.display = 'none';
    eventsSection.style.display = 'block';
  }

  function handleViewChange(view) {
    if (view === currentView) return;
    
    currentView = view;
    updateViewSelector();
    loadEvents();
  }

  function updateViewSelector() {
    viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === currentView);
    });
  }

  // Event Loading and Rendering
  async function loadEvents(forceRefresh = false) {
    if (!currentToken) {
      showError('Authentication required');
      return;
    }

    try {
      let events;
      
      if (!forceRefresh) {
        events = await getCachedEvents();
      }
      
      if (!events || forceRefresh) {
        showLoadingState();
        events = await fetchEventsFromAPI();
        await cacheEvents(events);
      }
      
      renderEvents(events);
      updateLastRefreshTime();
      
    } catch (error) {
      console.error('Error loading events:', error);
      showError('Failed to load events. Please try again.');
      renderEvents({ items: [] });
    }
  }

  // Enhanced cache management with compression
  async function getCachedEvents() {
    return new Promise((resolve) => {
      const cacheKey = `${currentView}_events`;
      const timestampKey = `${currentView}_timestamp`;
      
      chrome.storage.local.get([cacheKey, timestampKey], (result) => {
        const cachedEvents = result[cacheKey];
        const timestamp = result[timestampKey];
        
        if (cachedEvents && timestamp) {
          const age = Date.now() - timestamp;
          if (age < CACHE_TTL) {
            console.log(`Cache hit for ${currentView} events (age: ${Math.round(age/1000)}s)`);
            performanceMetrics.cacheHits++;
            resolve(cachedEvents);
            return;
          } else {
            console.log(`Cache expired for ${currentView} events (age: ${Math.round(age/1000)}s)`);
          }
        }
        
        performanceMetrics.cacheMisses++;
        resolve(null);
      });
    });
  }

  async function cacheEvents(events) {
    const cacheKey = `${currentView}_events`;
    const timestampKey = `${currentView}_timestamp`;
    
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [cacheKey]: events,
        [timestampKey]: Date.now(),
        lastUpdateTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, resolve);
    });
  }

  // Enhanced error handling with retry mechanism
  async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        performanceMetrics.apiCalls++;
        const response = await fetch(url, options);
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited, wait before retry
            const retryAfter = response.headers.get('Retry-After') || Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
          
          if (response.status === 401) {
            // Token expired
            throw new Error('Authentication expired');
          }
          
          throw new Error(`API request failed: ${response.status}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`API call attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  // Enhanced event fetching with retry logic
  async function fetchEventsFromAPI() {
    const { timeMin, timeMax } = getTimeRange();
    
    const url = `${API_BASE_URL}/calendars/primary/events?` + 
      `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;
    
    try {
      const response = await fetchWithRetry(url, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      
      return await response.json();
    } catch (error) {
      if (error.message.includes('Authentication expired')) {
        await refreshToken();
        // Retry once with new token
        const response = await fetchWithRetry(url, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        return await response.json();
      }
      throw error;
    }
  }

  function getTimeRange() {
    const now = new Date();
    let timeMin, timeMax;

    switch (currentView) {
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

  function renderEvents(data) {
    const lastUpdateInfo = document.querySelector('.last-update-info');
    eventsContent.innerHTML = '';

    if (data.error) {
      eventsContent.innerHTML = `<div class="no-events">Error: ${data.error.message}</div>`;
      return;
    }

    if (!data.items || data.items.length === 0) {
      const viewText = currentView === 'today' ? 'today' : 
                     currentView === 'tomorrow' ? 'tomorrow' : 'this week';
      eventsContent.innerHTML = `<div class="no-events">No events for ${viewText}</div>`;
      return;
    }

    // Group events by date for week view
    if (currentView === 'week') {
      renderWeekView(data.items);
    } else {
      renderDayView(data.items);
    }
  }

  function renderDayView(events) {
    const eventsList = document.createElement('ul');
    eventsList.className = 'events-list';
    
    events.forEach((event, index) => {
      const eventCard = createEventCard(event, index);
      eventsList.appendChild(eventCard);
    });
    
    eventsContent.appendChild(eventsList);
  }

  // Intersection Observer for lazy loading in week view
  const eventObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Enhanced week view rendering with lazy loading
  function renderWeekView(events) {
    const groupedEvents = groupEventsByDate(events);
    const weekContainer = document.createElement('div');
    weekContainer.className = 'week-view';

    Object.entries(groupedEvents).forEach(([date, dayEvents]) => {
      const daySection = document.createElement('div');
      daySection.className = 'day-section';
      
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.textContent = formatDateHeader(date);
      
      const dayEventsList = document.createElement('ul');
      dayEventsList.className = 'day-events-list';
      
      dayEvents.forEach((event, index) => {
        const eventCard = createEventCard(event, index);
        eventCard.classList.add('lazy-load');
        dayEventsList.appendChild(eventCard);
        
        // Observe for lazy loading
        eventObserver.observe(eventCard);
      });
      
      daySection.appendChild(dayHeader);
      daySection.appendChild(dayEventsList);
      weekContainer.appendChild(daySection);
    });
    
    eventsContent.appendChild(weekContainer);
  }

  function createEventCard(event, index) {
    const li = document.createElement('li');
    li.className = 'event-card';
    li.style.animationDelay = `${index * 0.1}s`;
    
    const eventTime = formatEventTime(event);
    const eventLocation = event.location ? `<div class="event-location">${escapeHtml(event.location)}</div>` : '';
    const meetingLink = event.hangoutLink ? 
      `<button class="meeting-btn" data-meeting-url="${event.hangoutLink}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551zm-7 .449c0-2.757-2.243-5-5-5s-5 2.243-5 5 2.243 5 5 5 5-2.243 5-5z"/>
        </svg>
        Join
      </button>` : '';
    
    li.innerHTML = `
      <div class="event-header">
        <div class="event-title">${escapeHtml(event.summary || '(No Title)')}</div>
        <div class="event-actions">
          ${meetingLink}
        </div>
      </div>
      <div class="event-time">${eventTime}</div>
      ${eventLocation}
    `;

    // Add event listener for meeting button
    if (event.hangoutLink) {
      const meetingBtn = li.querySelector('.meeting-btn');
      if (meetingBtn) {
        meetingBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const meetingUrl = meetingBtn.getAttribute('data-meeting-url');
          if (meetingUrl) {
            joinMeeting(meetingUrl);
          }
        });
      }
    }
    
    return li;
  }
      // Utility Functions
  function groupEventsByDate(events) {
    const groups = {};
    events.forEach(event => {
      const date = event.start.dateTime ? 
        new Date(event.start.dateTime).toDateString() : 
        new Date(event.start.date).toDateString();
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    return groups;
  }

  function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  }

  function formatEventTime(event) {
    if (event.start.dateTime) {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${startTime} - ${endTime}`;
    } else {
      return 'All day';
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function updateLastRefreshTime() {
    chrome.storage.local.get(['lastUpdateTime'], (result) => {
      const lastUpdateInfo = document.querySelector('.last-update-info');
      if (lastUpdateInfo && result.lastUpdateTime) {
        lastUpdateInfo.textContent = `Last updated: ${result.lastUpdateTime}`;
      }
    });
  }

  // Event Management
  function joinMeeting(url) {
    chrome.tabs.create({ url });
  }

  // UI State Management
  function showLoadingState(message = 'Loading events...') {
    eventsContent.innerHTML = `
      <div class="shimmer-container">
        <div class="shimmer-item"></div>
        <div class="shimmer-item"></div>
        <div class="shimmer-item"></div>
      </div>
    `;
  }

  function showError(message) {
    const toast = document.getElementById('error-toast');
    const messageEl = toast.querySelector('.toast-message');
    messageEl.textContent = message;
    toast.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(hideErrorToast, 5000);
  }

  function showSuccess(message) {
    // Reuse error toast for success messages
    showError(message);
  }

  function hideErrorToast() {
    const toast = document.getElementById('error-toast');
    toast.style.display = 'none';
  }

  // Theme Management
  function loadTheme() {
    chrome.storage.local.get(['theme'], (result) => {
      const theme = result.theme || 'light';
      setTheme(theme);
    });
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
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

  // Auto-refresh
  function startAutoRefresh() {
    if (refreshTimer) return;
    
    refreshTimer = setInterval(() => {
      if (currentToken) {
        loadEvents(true);
      }
    }, REFRESH_INTERVAL);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // Token Management
  async function refreshToken() {
    try {
      // Remove cached token
      chrome.identity.removeCachedAuthToken({ token: currentToken }, async () => {
        // Get new token
        currentToken = await getAuthToken(false);
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Event Handlers
  async function handleReload() {
    reloadBtn.classList.add('rotating');
    try {
      await loadEvents(true);
    } finally {
      reloadBtn.classList.remove('rotating');
    }
  }

  async function handleLogout() {
    try {
      if (currentToken) {
        // Revoke token
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${currentToken}`);
        
        // Remove cached token
        chrome.identity.removeCachedAuthToken({ token: currentToken }, () => {
          // Clear stored data
          chrome.storage.local.clear(() => {
            currentToken = null;
            stopAutoRefresh();
            showLogin();
          });
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      showError('Error during logout');
    }
  }

  function handleQuickAdd() {
    chrome.tabs.create({ url: "https://calendar.google.com/calendar/u/0/r/eventedit" });
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
  });

  // Performance monitoring
  function logPerformanceMetrics() {
    const loadTime = Date.now() - performanceMetrics.loadStartTime;
    console.log('Performance Metrics:', {
      ...performanceMetrics,
      totalLoadTime: `${loadTime}ms`,
      cacheHitRate: `${(performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) * 100).toFixed(1)}%`
    });
  }

  // Log performance metrics after initial load
  setTimeout(logPerformanceMetrics, 2000);
});
