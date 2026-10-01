export const CLOAK_CONFIGS = {
  none: {
    title: 'UnblockZone - Casual & Arcade Unblocked Games',
    iconUrl: '/favicon.ico',
  },
  'google-docs': {
    title: 'Biology Essay Draft 2 - Google Docs',
    iconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
  },
  classroom: {
    title: 'Classes - Google Classroom',
    iconUrl: 'https://ssl.gstatic.com/classroom/favicon.png',
  },
  canvas: {
    title: 'Dashboard - Canvas LMS',
    iconUrl: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico',
  },
  wikipedia: {
    title: 'Photosynthesis - Wikipedia',
    iconUrl: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
  },
};

export function applyCloak(preset = 'none') {
  if (typeof document === 'undefined') return;
  const config = CLOAK_CONFIGS[preset] || CLOAK_CONFIGS.none;
  document.title = config.title;

  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = config.iconUrl;
}
