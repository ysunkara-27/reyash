// Same GA4 property as the main site; exclude local and deployment previews.
(() => {
  if (!['ysunkara.com', 'www.ysunkara.com'].includes(location.hostname)) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-DG7D1X0M0W', {
    page_title: 'HooRaas Rides',
    page_location: location.origin + '/rides/',
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-DG7D1X0M0W';
  document.head.append(script);
})();
