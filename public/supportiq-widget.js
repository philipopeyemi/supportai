(function () {
  // 1. Locate the widget script element and extract chatbot ID
  const scriptTag = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].getAttribute('data-chatbot-id')) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!scriptTag) {
    console.error('SupportIQ Widget Error: Script tag could not be identified.');
    return;
  }

  const chatbotId = scriptTag.getAttribute('data-chatbot-id');
  if (!chatbotId) {
    console.error('SupportIQ Widget Error: "data-chatbot-id" attribute is missing.');
    return;
  }

  // Get host of the widget script (supports localhost, vercel, etc.)
  const scriptSrc = scriptTag.getAttribute('src');
  let hostUrl = 'http://localhost:3000';
  if (scriptSrc && scriptSrc.startsWith('http')) {
    const url = new URL(scriptSrc);
    hostUrl = url.origin;
  }

  // Inject widget CSS styles
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .supportiq-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #2563eb;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
      z-index: 999999;
      border: none;
      outline: none;
    }
    .supportiq-launcher:hover {
      transform: scale(1.08);
    }
    .supportiq-launcher:active {
      transform: scale(0.95);
    }
    .supportiq-launcher svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #ffffff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.3s ease;
    }
    .supportiq-iframe-container {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 48px);
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      z-index: 999998;
      transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      border: 1px solid #e5e7eb;
    }
    .supportiq-iframe-container.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .supportiq-iframe-container iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    @media (max-width: 480px) {
      .supportiq-iframe-container {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        max-width: 100%;
        border-radius: 0;
        border: none;
      }
      .supportiq-launcher {
        bottom: 16px;
        right: 16px;
        width: 50px;
        height: 50px;
      }
    }
  `;
  document.head.appendChild(styleTag);

  // Create Container
  const container = document.createElement('div');
  container.className = 'supportiq-iframe-container';

  // Create Iframe pointing to public chatbot endpoint
  const iframe = document.createElement('iframe');
  iframe.src = `${hostUrl}/chatbot/${chatbotId}?embed=true`;
  iframe.title = 'SupportIQ AI Support Chat';
  container.appendChild(iframe);

  // Create Launcher button
  const launcher = document.createElement('button');
  launcher.className = 'supportiq-launcher';
  launcher.setAttribute('aria-label', 'Open support chat');

  // Inline Chat Bubble SVG Icon
  const chatIcon = `
    <svg class="supportiq-chat-icon" viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  // Close Cross SVG Icon
  const closeIcon = `
    <svg class="supportiq-close-icon" viewBox="0 0 24 24" style="display: none;">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  launcher.innerHTML = chatIcon + closeIcon;

  // Append launcher and container to body
  document.body.appendChild(container);
  document.body.appendChild(launcher);

  // State Management
  let isOpen = false;

  launcher.addEventListener('click', () => {
    isOpen = !isOpen;
    
    const svgChat = launcher.querySelector('.supportiq-chat-icon');
    const svgClose = launcher.querySelector('.supportiq-close-icon');

    if (isOpen) {
      container.classList.add('open');
      svgChat.style.display = 'none';
      svgClose.style.display = 'block';
      // Focus the iframe input if possible
      iframe.focus();
    } else {
      container.classList.remove('open');
      svgChat.style.display = 'block';
      svgClose.style.display = 'none';
    }
  });

  // Listen to messages from iframe to handle styling overrides (like changing theme color)
  window.addEventListener('message', (event) => {
    if (event.origin !== hostUrl) return;
    
    if (event.data && event.data.type === 'supportiq-theme') {
      const themeColor = event.data.color;
      launcher.style.backgroundColor = themeColor;
    }
  });
})();
