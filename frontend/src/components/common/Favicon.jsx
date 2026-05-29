// src/components/Common/Favicon.jsx
import { useEffect } from "react";

const Favicon = ({ emoji = "📚" }) => {
  useEffect(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <text y=".9em" font-size="90">${emoji}</text>
      </svg>
    `;
    const encodedSvg = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = encodedSvg;
  }, [emoji]);

  return null;
};

export default Favicon;
