/**
 * Mobile Device Detection & Blocking Script
 *
 * Strategy:
 * 1. UA Inspection (Confidence Booster)
 * 2. Capability Confirmation (Authoritative)
 * 3. Final Decision
 *
 * If blocked:
 * - Clear body content immediately.
 * - Initialize I18n to get strings.
 * - Render blocking message with "Share" CTA.
 */

(async function () {
  console.log("DeviceCheck: Starting analysis...");

  // Short-circuit for previously verified devices to skip expensive checks
  try {
    const verified = localStorage.getItem("device_verified");
    if (verified === "true") {
      console.log("DeviceCheck: Verified via cache.");
      return; // Skip remaining detection logic
    }
  } catch (e) {
    // localStorage may throw in unusual privacy modes - ignore
  }

  // Stage 1: Strong UA signal
  const ua = navigator.userAgent;
  const isKnownPhoneUA = /iPhone|Android.*Mobile|SamsungBrowser|Pixel/i.test(
    ua,
  );
  console.log(`DeviceCheck: UA Match? ${isKnownPhoneUA} (${ua})`);

  // Stage 2: Capability confirmation
  // Coarse pointer (touch) AND no hover (touch-only)
  const isLikelyTouchOnly =
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(hover: hover)").matches;

  console.log(`DeviceCheck: TouchOnly? ${isLikelyTouchOnly}`);

  // Stage 3: Final decision logic
  // We block if:
  // 1. It identifies clearly as a phone (UA).
  // 2. It behaves like a touch-first device (Coarse pointer + No hover), regardless of screen size.
  // This effectively blocks tablets and phones, reinforcing the "Physical Keyboard Required" policy.
  const isUnsupportedMobile = isKnownPhoneUA || isLikelyTouchOnly;

  if (isUnsupportedMobile) {
    console.warn("DeviceCheck: BLOCKING DEVICE.");
    window.isMobileBlocked = true;

    // 1. Nuke the body immediately to prevent app flash
    document.body.innerHTML = `
            <style>
                body {
                    background-color: var(--bg-color-dark, #131313);
                    color: #ffffff;
                    font-family: "Nunito", sans-serif;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 20px;
                }
                .block-container {
                    max-width: 520px;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 36px;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.5);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.04);
                }
                .icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    display: block;
                }
                h1 { font-family: "Exo", sans-serif; font-size: 22px; margin-bottom: 12px; color: #ffffff; }
                p { font-size: 15px; line-height: 1.5; color: rgba(255,255,255,0.85); margin-bottom: 22px; }
                .btn-share {
                    background: var(--bg-color, #3498db);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 999px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: transform 0.15s ease, opacity 0.15s ease;
                    text-decoration: none;
                }
                .btn-share:active { transform: scale(0.98); }
            </style>
            <div class="block-container">
                <span class="icon">🖥️</span>
                <div id="block-content">Loading...</div>
            </div>
        `;

    // 2. Ensure I18n is ready
    if (window.I18nManager) {
      await window.I18nManager.init();

      const msg = window.I18nManager.t("mobile_block_message");
      const btnText = window.I18nManager.t("mobile_cta_share");

      const contentDiv = document.getElementById("block-content");
      if (contentDiv) {
        contentDiv.innerHTML = `
                    <p>${msg}</p>
                    <button class="btn-share" id="btn-share">
                        <span>📤</span> ${btnText}
                    </button>
                `;

        // 3. Bind CTA
        const btn = document.getElementById("btn-share");
        btn.onclick = async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: "WebDesk",
                text: "Open this on your computer",
                url: window.location.href,
              });
            } catch (err) {
              console.log("Share failed", err);
            }
          } else {
            // Fallback: Copy to clipboard
            try {
              await navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            } catch (err) {
              alert("Link: " + window.location.href);
            }
          }
        };
      }
    }
  } else {
    console.log("DeviceCheck: Allowed.");
    // Cache verification so checks are skipped on subsequent visits
    try {
      localStorage.setItem("device_verified", "true");
      console.log("DeviceCheck: Device marked verified in cache.");
    } catch (e) {
      // ignore storage errors
    }
  }
})();
