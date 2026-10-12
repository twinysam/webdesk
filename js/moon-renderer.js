/* Renders the Moon's current phase locally, without an external image service. */
(function (scope) {
  "use strict";

  let imagePromise = null;
  let moonImage = null;
  let loadFailed = false;
  const scaledTextures = new Map();

  function warnOnce(error) {
    if (loadFailed) return;
    loadFailed = true;
    console.warn("Moon image could not be rendered; keeping the emoji fallback.", error);
  }

  function load() {
    if (imagePromise) return imagePromise;

    imagePromise = new Promise((resolve) => {
      try {
        const image = new Image();
        image.onload = () => {
          moonImage = image;
          resolve(true);
        };
        image.onerror = (error) => {
          warnOnce(error);
          resolve(false);
        };
        image.src = "images/moon.webp";
      } catch (error) {
        warnOnce(error);
        resolve(false);
      }
    });

    return imagePromise;
  }

  function smoothstep(edge0, edge1, value) {
    const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  function draw(canvas, elong) {
    try {
      if (!moonImage || !canvas || !Number.isFinite(elong)) return false;

      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = scope.devicePixelRatio || 1;
      const width = Math.round(bounds.width * pixelRatio);
      const height = Math.round(bounds.height * pixelRatio);
      if (!width || !height) return false;

      const key = `${width}x${height}`;
      let texture = scaledTextures.get(key);
      if (!texture) {
        texture = document.createElement("canvas");
        texture.width = width;
        texture.height = height;
        const textureContext = texture.getContext("2d", { willReadFrequently: true });
        if (!textureContext) return false;
        textureContext.drawImage(moonImage, 0, 0, width, height);
        scaledTextures.set(key, texture);
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return false;
      const imageData = context.createImageData(width, height);
      const textureContext = texture.getContext("2d", { willReadFrequently: true });
      if (!textureContext) return false;
      const source = textureContext.getImageData(0, 0, width, height).data;
      const output = imageData.data;
      const radians = ((elong % 360) + 360) % 360 * Math.PI / 180;
      const sunX = Math.sin(radians);
      const sunZ = -Math.cos(radians);

      for (let j = 0; j < height; j++) {
        const y = 1 - (j + 0.5) / height * 2;
        for (let i = 0; i < width; i++) {
          const x = (i + 0.5) / width * 2 - 1;
          const radiusSquared = x * x + y * y;
          const offset = (j * width + i) * 4;
          const alpha = source[offset + 3];
          if (radiusSquared > 1 || alpha === 0) continue;

          const lit = sunX * x + sunZ * Math.sqrt(1 - radiusSquared);
          const brightness = 0.1 + 0.9 * smoothstep(-0.045, 0.045, lit);
          output[offset] = source[offset] * brightness;
          output[offset + 1] = source[offset + 1] * brightness;
          output[offset + 2] = source[offset + 2] * brightness;
          output[offset + 3] = alpha;
        }
      }

      context.putImageData(imageData, 0, 0);
      return true;
    } catch (error) {
      warnOnce(error);
      return false;
    }
  }

  scope.MoonRenderer = { load, draw };
})(window);
