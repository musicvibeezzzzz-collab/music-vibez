(function() {
  if (window.__vibeThemeLoaded) return;
  window.__vibeThemeLoaded = true;
  
  /* <script src="theme.js" data-font-only> = font + photo helper only (no theme colors) */
  var self = document.currentScript;
  var fontOnly = !!(self && self.hasAttribute("data-font-only"));
  
  /* ===================== THEME ===================== */
  var KEY = "vibeTheme";
  var lightQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;
  
  function getVibeTheme() {
    try {
      var v = localStorage.getItem(KEY);
      return (v === "dark" || v === "light" || v === "system") ? v : "system";
    } catch (e) {
      return "system";
    }
  }
  
  function resolve(choice) {
    if (choice === "system") {
      return (lightQuery && lightQuery.matches) ? "light" : "dark";
    }
    return choice;
  }
  
  function apply() {
    if (fontOnly) return;
    var theme = resolve(getVibeTheme());
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }
  
  function setVibeTheme(choice) {
    try { localStorage.setItem(KEY, choice); } catch (e) {}
    apply();
  }
  
  window.getVibeTheme = getVibeTheme;
  window.setVibeTheme = setVibeTheme;
  
  /* ===================== FONT + COLORS ===================== */
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  
  var L = 'html[data-theme="light"] ';
  
  var lightCss = [
    L + 'body{background:#f4f4f4 !important;background-image:none !important;color:#171717 !important;}',
    
    L + 'body > h1,' + L + 'body > h3,' + L + '#recentTitle,' + L + '#one h3,' + L + '.settings h1,' + L + '.theme h1,' + L + '.arrow h1,' + L + '.genreHeader h1,' + L + '.genreHeader p,' + L + '.header .title,' + L + '.notification h1{color:#171717 !important;}',
    L + '.para{color:#171717 !important;}',
    L + '.description,' + L + '.status,' + L + '#status,' + L + '#message{color:#444 !important;}',
    
    L + '.backBtn{color:#171717 !important;}',
    
    L + '.profile,' + L + '.na .notification,' + L + '.on,' + L + '.About,' + L + '.pt .theme,' + L + '.na .theme,' + L + '.dark,' + L + '.email,' + L + '.password,' + L + '.picture{background-color:#e5e5e5 !important;color:#171717 !important;border-color:#cfcfcf !important;}',
    L + '.profile:hover,' + L + '.na .notification:hover,' + L + '.About:hover,' + L + '.pt .theme:hover,' + L + '.na .theme:hover{background-color:#E73C3C !important;color:#fff !important;}',
    L + '.email input,' + L + '.password input{color:#171717 !important;}',
    
    L + '.button button,' + L + 'body > center > button{background-color:#e5e5e5 !important;color:#E73C3C !important;}',
    
    L + '.slider{background-color:#bdbdbd !important;}',
    
    L + '.song-card,' + L + '.songCard{background:#ffffff !important;border-color:rgba(0,0,0,.12) !important;color:#171717 !important;}',
    L + '.song-title,' + L + '.song-artist,' + L + '.songTitle,' + L + '.songArtist{color:#171717 !important;}',
    L + '.genreHeader{background:none !important;}',
    L + '#noRecent,' + L + '#loading,' + L + '#noSongs{color:#444 !important;}',
    
    L + '#down{background:#e5e5e5 !important;}'
  ].join("\n");
  
  var css = '*{font-family:' + FONT + ' !important;}';
  if (!fontOnly) css += "\n" + lightCss;
  
  var style = document.createElement("style");
  style.id = "vibe-theme-style";
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
  
  apply();
  
  if (lightQuery && !fontOnly) {
    if (lightQuery.addEventListener) lightQuery.addEventListener("change", apply);
    else if (lightQuery.addListener) lightQuery.addListener(apply);
  }
  
  window.addEventListener("storage", function(e) {
    if (e.key === KEY) apply();
  });
  
  /* Safety: never leave a page hidden forever */
  setTimeout(function() {
    document.documentElement.style.visibility = "visible";
  }, 5000);
  
  /* ===================== PROFILE PHOTO HELPER ===================== */
  var AV_KEY = "vibeAvatar";
  
  function avRead() {
    try { return JSON.parse(localStorage.getItem(AV_KEY)) || null; } catch (e) { return null; }
  }
  
  function avWrite(path, ver, data) {
    try {
      localStorage.setItem(AV_KEY, JSON.stringify({ path: path, ver: String(ver || ""), data: data }));
    } catch (e) {}
  }
  
  function avClear() {
    try { localStorage.removeItem(AV_KEY); } catch (e) {}
  }
  
  function loadImg(src) {
    return new Promise(function(resolve, reject) {
      var im = new Image();
      im.onload = function() { resolve(im); };
      im.onerror = function() { reject(new Error("Could not read image")); };
      im.src = src;
    });
  }
  
  /* Center-crop to a square canvas */
  function drawSquare(im, size) {
    var s = Math.min(im.naturalWidth, im.naturalHeight);
    var sx = (im.naturalWidth - s) / 2;
    var sy = (im.naturalHeight - s) / 2;
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(im, sx, sy, s, s, 0, 0, size, size);
    return c;
  }
  
  /* Shrink a chosen photo (512px upload copy + 256px device copy) */
  function prepare(file) {
    var url = URL.createObjectURL(file);
    
    return loadImg(url)
      .then(function(im) {
        var s = Math.min(im.naturalWidth, im.naturalHeight);
        var big = drawSquare(im, Math.min(512, s));
        var thumb = drawSquare(im, Math.min(256, s)).toDataURL("image/jpeg", 0.85);
        
        return new Promise(function(resolve, reject) {
          big.toBlob(function(blob) {
            if (!blob) { reject(new Error("Could not process image")); return; }
            resolve({ blob: blob, thumb: thumb, ext: "jpg", type: "image/jpeg" });
          }, "image/jpeg", 0.88);
        });
      })
      .catch(function() {
        /* Format the browser can't process: upload the original */
        var ext = ((file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "")) || "jpg";
        return { blob: file, thumb: null, ext: ext, type: file.type || "image/jpeg" };
      })
      .then(function(result) {
        URL.revokeObjectURL(url);
        return result;
      });
  }
  
  /* Instantly show the saved copy (no network) */
  function showCached(img) {
    if (!img) return;
    if (!img.dataset.def) img.dataset.def = img.getAttribute("src") || "";
    var c = avRead();
    if (c && c.data) img.src = c.data;
  }
  
  /* Make sure the saved copy matches the account's current photo */
  async function sync(client, bucket, path, ver, img) {
    if (img && !img.dataset.def) img.dataset.def = img.getAttribute("src") || "";
    
    if (!path) {
      avClear();
      if (img && img.dataset.def) img.src = img.dataset.def;
      return;
    }
    
    var c = avRead();
    if (c && c.path === path && c.ver === String(ver || "") && c.data) {
      if (img) img.src = c.data;
      return;
    }
    
    var url = null;
    try {
      var signed = await client.storage.from(bucket).createSignedUrl(path, 3600);
      url = (signed.data && signed.data.signedUrl) ||
        client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    } catch (e) {
      return;
    }
    
    if (img && url) img.src = url;
    
    try {
      var res = await fetch(url);
      var blob = await res.blob();
      var obj = URL.createObjectURL(blob);
      var im = await loadImg(obj);
      var s = Math.min(im.naturalWidth, im.naturalHeight);
      avWrite(path, ver, drawSquare(im, Math.min(256, s)).toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(obj);
    } catch (e) {}
  }
  
  function remember(path, ver, thumb) {
    if (thumb) avWrite(path, ver, thumb);
    else avClear();
  }
  
  window.VibeAvatar = {
    prepare: prepare,
    showCached: showCached,
    sync: sync,
    remember: remember,
    clear: avClear
  };
})();