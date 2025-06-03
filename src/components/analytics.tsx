"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import React, { useEffect, Suspense } from "react"; // Import React and Suspense

const pageview = (url: string) => {
  // @ts-ignore
  if (typeof window.dataLayer !== 'undefined') {
    window.dataLayer.push({
      event: "pageview",
      page: url,
    });
  }
};

// New internal component for tracking page views
function TrackPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // This hook causes the component to suspend

  useEffect(() => {
    if (pathname) {
      pageview(pathname);
    }
  }, [pathname, searchParams]);

  return null; // This component does not render anything
}

export default function Analytics() {
  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=GT-WRHDSGK7`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GT-WRHDSGK7');
  `,
        }}
      />
      {/* Wrap TrackPageViews with Suspense */}
      <Suspense fallback={null}>
        <TrackPageViews />
      </Suspense>
    </>
  );
}
