  (() => {
    const App = {};
    window.App = App;

    App.API_URL = "/api";
    App.LANGS = ["ru", "en", "kz"];
    App.I18N = {};
    App.currentLang = "ru";
    let onLangChangeCb = null;

    const NAV_HTML = `
    <nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b panel"
        style="background:var(--panel); border-color:var(--panelBorder);">
      <div class="container mx-auto max-w-6xl px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="index.html" class="font-bold text-lg tracking-tight flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"></span>
          Book Marketplace
        </a>

        <div class="hidden md:flex items-center gap-3">
          <div id="nav-links" class="flex items-center gap-4 text-sm font-medium" style="color:var(--muted)"></div>

          <div id="lang-toggle" class="flex items-center rounded-xl overflow-hidden border text-xs font-semibold"
            style="border-color:var(--panelBorder); background:var(--btnGhostBg); color:var(--fg)">
            <button data-lang="ru" class="px-2.5 py-1.5 hover:opacity-90">RU</button>
            <button data-lang="en" class="px-2.5 py-1.5 hover:opacity-90">EN</button>
            <button data-lang="kz" class="px-2.5 py-1.5 hover:opacity-90">KZ</button>
          </div>

          <button id="theme-toggle"
            class="ml-1 w-9 h-9 grid place-items-center rounded-xl border transition hover:opacity-90 focus:outline-none focus:ring-2"
            style="background:var(--btnGhostBg); border-color:var(--panelBorder); --tw-ring-color:var(--accentRing); color:var(--fg);"
            aria-label="Toggle theme">
            <span id="theme-icon" class="text-base select-none">🌙</span>
          </button>
        </div>

        <button id="nav-burger" class="md:hidden p-2 rounded-lg transition" style="color:var(--muted); background:var(--btnGhostBg);">☰</button>
      </div>
    </nav>
    <div class="h-14"></div>

    <div id="drawer-backdrop" class="fixed inset-0 bg-black/40 hidden z-40"></div>
    <aside id="drawer" class="fixed top-0 right-0 h-full w-72 max-w-[85%] translate-x-full z-50 panel border-l backdrop-blur-xl"
      style="background:var(--panel); border-color:var(--panelBorder);">
      <div class="p-4 flex items-center justify-between border-b" style="border-color:var(--panelBorder)">
        <div class="font-bold tracking-tight" data-i18n="menu_title"></div>
        <button id="drawer-close" class="p-2 rounded-lg" style="background:var(--btnGhostBg); color:var(--fg)">✕</button>
      </div>

      <div class="p-4 space-y-4 text-sm" style="color:var(--muted)">
        <div id="nav-mobile" class="flex flex-col gap-2"></div>

        <div class="pt-2">
          <div class="text-xs mb-2" style="color:var(--muted2)" data-i18n="lang_label"></div>
          <div id="lang-toggle-mobile" class="flex items-center rounded-xl overflow-hidden border text-xs font-semibold w-fit"
            style="border-color:var(--panelBorder); background:var(--btnGhostBg); color:var(--fg)">
            <button data-lang="ru" class="px-3 py-2 hover:opacity-90">RU</button>
            <button data-lang="en" class="px-3 py-2 hover:opacity-90">EN</button>
            <button data-lang="kz" class="px-3 py-2 hover:opacity-90">KZ</button>
          </div>
        </div>

        <div class="pt-2">
          <div class="text-xs mb-2" style="color:var(--muted2)" data-i18n="theme_label"></div>

          <button id="theme-toggle-mobile"
            class="w-full flex items-center justify-between h-10 px-3 rounded-xl border transition hover:opacity-90 focus:outline-none focus:ring-2"
            style="background:var(--btnGhostBg); border-color:var(--panelBorder); --tw-ring-color:var(--accentRing); color:var(--fg);"
            aria-label="Toggle theme">
            <span class="text-sm" data-i18n="theme_label"></span>
            <span id="theme-icon-mobile" class="text-base select-none">🌙</span>
          </button>
        </div>
      </div>
    </aside>
    `;

    const CONFIRM_HTML = `
    <div id="confirm-modal" class="fixed inset-0 hidden z-[9999]">
      <div id="confirm-backdrop" class="absolute inset-0 bg-black/50"></div>

      <div class="absolute inset-0 grid place-items-center p-4">
        <div class="panel rounded-2xl p-5 w-full max-w-sm shadow-2xl">
          <h3 id="confirm-title" class="text-lg font-extrabold mb-2">Confirm</h3>
          <p id="confirm-text" class="text-sm mb-4" style="color:var(--muted2)"></p>

          <div class="flex gap-2">
            <button id="confirm-cancel" class="btn-ghost flex-1">Cancel</button>
            <button id="confirm-ok" class="btn-danger flex-1">OK</button>
          </div>
        </div>
      </div>
    </div>
    `;

    const FOOTER_HTML = `
    <footer class="mt-8 border-t" style="border-color:var(--panelBorder); background:var(--panel)">
      <div class="container mx-auto max-w-6xl px-4 md:px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div class="font-bold text-lg tracking-tight flex items-center gap-2">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"></span>
            Book Marketplace
          </div>
          <p class="mt-3 text-sm leading-relaxed" style="color:var(--muted)" data-i18n="footer_about"></p>
        </div>

        <div>
          <h3 class="font-semibold mb-3" data-i18n="footer_marketplace"></h3>
          <ul class="space-y-2 text-sm" style="color:var(--muted)">
            <li><a class="hover:underline" href="index.html" data-i18n="nav_home"></a></li>
            <li><a class="hover:underline" href="cart.html" data-i18n="nav_cart"></a></li>
            <li><a class="hover:underline" href="profile.html" data-i18n="nav_profile"></a></li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-3" data-i18n="footer_account"></h3>
          <ul class="space-y-2 text-sm" style="color:var(--muted)">
            <li><a class="hover:underline" href="login.html" data-i18n="nav_login"></a></li>
            <li><a class="hover:underline" href="register.html" data-i18n="nav_register"></a></li>
            <li><span class="opacity-70" data-i18n="footer_orders"></span></li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-3" data-i18n="footer_follow"></h3>
          <div class="flex items-center gap-2">
            <a href="#" class="w-10 h-10 grid place-items-center rounded-xl text-lg" style="background:var(--btnGhostBg); border:1px solid var(--panelBorder)">💬</a>
            <a href="#" class="w-10 h-10 grid place-items-center rounded-xl text-lg" style="background:var(--btnGhostBg); border:1px solid var(--panelBorder)">📸</a>
            <a href="#" class="w-10 h-10 grid place-items-center rounded-xl text-lg" style="background:var(--btnGhostBg); border:1px solid var(--panelBorder)">✨</a>
          </div>
          <p class="mt-4 text-xs" style="color:var(--muted2)">Support: Zhandos.saukymov@narxoz.kz</p>
        </div>
      </div>

      <div class="container mx-auto max-w-6xl px-4 md:px-6 py-4 border-t text-sm flex flex-col md:flex-row items-center justify-between gap-2"
          style="border-color:var(--panelBorder); color:var(--muted2)">
        <div>© <span id="year"></span> Book Marketplace.</div>
        <div class="flex items-center gap-3">
          <a href="#" class="hover:underline" data-i18n="footer_privacy"></a>
          <a href="#" class="hover:underline" data-i18n="footer_terms"></a>
          <a href="#" class="hover:underline" data-i18n="footer_contacts"></a>
        </div>
      </div>
    </footer>

    <div id="toast" class="fixed bottom-4 right-4 z-50 hidden text-white px-4 py-2 rounded-lg shadow"></div>
    `;

    const AI_HTML = `
    <button id="ai-chat-toggle"
      class="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-2xl shadow-xl grid place-items-center text-2xl transition hover:scale-105"
      style="background:var(--btnPrimaryBg); color:var(--btnPrimaryFg);">
      💬
    </button>

    <div id="ai-chat-panel"
      class="fixed bottom-20 right-4 z-50 w-[330px] max-w-[92vw] h-[440px] hidden flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
      style="background:var(--panel); border-color:var(--panelBorder); color:var(--fg); backdrop-filter: blur(14px);">

      <div class="flex items-center justify-between px-3 py-2 border-b"
          style="border-color:var(--panelBorder)">
        <div class="font-bold text-sm" data-i18n="ai_chat_title"></div>
        <div class="flex items-center gap-2">
          <button id="ai-chat-clear"
            class="text-xs px-2 py-1 rounded-lg"
            style="background:var(--btnGhostBg); color:var(--fg)"
            data-i18n="ai_clear">
          </button>
          <button id="ai-chat-close"
            class="text-sm px-2 py-1 rounded-lg"
            style="background:var(--btnGhostBg); color:var(--fg)">
            ✕
          </button>
        </div>
      </div>

      <div id="ai-chat-messages"
          class="flex-1 p-3 overflow-y-auto text-sm space-y-2"
          style="background:rgba(0,0,0,.12)">
      </div>

      <div class="p-2 border-t flex gap-2"
          style="border-color:var(--panelBorder)">
        <input id="ai-chat-input"
          class="flex-1 px-3 py-2 rounded-xl outline-none focus:ring-2 text-sm"
          style="background:var(--btnGhostBg); border:1px solid var(--panelBorder); color:var(--fg); --tw-ring-color:var(--accentRing);"
          data-i18n-placeholder="ai_input_placeholder"
          placeholder="" />

        <button id="ai-chat-send"
          class="px-4 py-2 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style="background:var(--btnPrimaryBg); color:var(--btnPrimaryFg);"
          data-i18n="ai_send">
        </button>
      </div>
    </div>
    `;

    function mount(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }

    App.qs = (sel, root = document) => root.querySelector(sel);
    App.qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    App.getToken = () => localStorage.getItem("token");

    App.parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split(".")[1]));
      } catch {
        return null;
      }
    };

    App.t = (key) =>
      (App.I18N[App.currentLang]?.[key]) ||
      (App.I18N.ru?.[key]) ||
      key;

    async function loadI18n(url) {
      if (!url) return;
      const res = await fetch(url);
      const data = await res.json();
      App.I18N = data;
    }

    function applyI18nToPage() {
      App.qsa("[data-i18n]").forEach(el => {
        el.textContent = App.t(el.dataset.i18n);
      });
      App.qsa("[data-i18n-placeholder]").forEach(el => {
        el.placeholder = App.t(el.dataset.i18nPlaceholder);
      });

      App.qsa("[data-lang]").forEach(btn => {
        btn.style.opacity = (btn.dataset.lang === App.currentLang) ? "1" : ".6";
      });
    }

    App.applyLang = (lang) => {
      App.currentLang = lang;
      localStorage.setItem("lang", lang);

      applyI18nToPage();
      updateNav();

      if (typeof onLangChangeCb === "function") onLangChangeCb(lang);
      if (typeof window.loadBooks === "function") window.loadBooks(1);
    };

    App.initLang = () => {
      const saved = localStorage.getItem("lang") || "ru";
      App.applyLang(saved);
    };

    App.setOnLangChange = (fn) => { onLangChangeCb = fn; };

    function setThemeIcon(isLight, prefix = "") {
      const id = prefix ? `theme-icon${prefix}` : "theme-icon";
      const icon = App.qs(`#${id}`);
      if (icon) icon.textContent = isLight ? "☀️" : "🌙";
    }

    App.applyTheme = (theme) => {
      document.body.classList.toggle("dark", theme === "dark");
      const isLight = theme === "light";
      setThemeIcon(isLight);
      setThemeIcon(isLight, "-mobile");
      localStorage.setItem("theme", theme);
    };

    App.initTheme = () => {
      const saved = localStorage.getItem("theme");
      if (saved) return App.applyTheme(saved);

      const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
      App.applyTheme(prefersLight ? "light" : "dark");
    };

    function bindThemeToggles() {
      [App.qs("#theme-toggle"), App.qs("#theme-toggle-mobile")].forEach(btn => {
        btn?.addEventListener("click", () => {
          App.applyTheme(document.body.classList.contains("dark") ? "light" : "dark");
        });
      });
    }

    // Drawer controls (exported so updateNav can close drawer on link click)
    function setDrawerOpen(open) {
      const drawer = App.qs("#drawer");
      const backdrop = App.qs("#drawer-backdrop");
      if (!drawer || !backdrop) return;

      drawer.classList.toggle("translate-x-full", !open);
      backdrop.classList.toggle("hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    }

    function updateNav() {
      const desktop = App.qs("#nav-links");
      const mobile = App.qs("#nav-mobile");
      if (!desktop || !mobile) return;

      const token = App.getToken();
      const payload = token ? App.parseJwt(token) : null;

      const links = [
        `<a href="index.html" class="hover:underline">${App.t("nav_home")}</a>`,
        `<a href="cart.html" class="hover:underline">${App.t("nav_cart")} (<span id="nav-cart-count">0</span>)</a>`
      ];

      if (token) {
        links.push(`<a href="profile.html" class="hover:underline">${App.t("nav_profile")}</a>`);
        if (payload?.role === "ADMIN") {
          links.push(`<a href="admin.html" class="hover:underline">${App.t("nav_admin")}</a>`);
        }
        links.push(`<button id="logout-btn" class="text-red-300 hover:text-red-200 transition">${App.t("nav_logout")}</button>`);
      } else {
        links.push(`<a href="login.html" class="hover:underline">${App.t("nav_login")}</a>`);
        links.push(`<a href="register.html" class="hover:underline">${App.t("nav_register")}</a>`);
      }

      desktop.innerHTML = links.join("");
      mobile.innerHTML = links.join("");

      // Logout
      App.qs("#logout-btn")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        location.href = "index.html";
      });

      // Close drawer when clicking any nav item (mobile UX)
      App.qsa("#nav-mobile a, #nav-mobile button").forEach(el => {
        el.addEventListener("click", () => setDrawerOpen(false));
      });

      App.updateCartCount();
    }
    App.updateNav = updateNav;

    App.updateCartCount = async () => {
      const token = App.getToken();
      if (!token) {
        App.qsa("#nav-cart-count").forEach(el => el.textContent = "0");
        return;
      }

      try {
        const res = await fetch(`${App.API_URL}/cart`, {
          headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = json?.data || [];
        const count = items.reduce((s, i) => s + (i.quantity || 0), 0);
        App.qsa("#nav-cart-count").forEach(el => el.textContent = String(count));
      } catch (e) {
        console.error("updateCartCount error:", e);
        App.qsa("#nav-cart-count").forEach(el => el.textContent = "0");
      }
    };

    App.showToast = (msg, type = "info") => {
      const toast = App.qs("#toast"); 
      if (!toast) return;
      const color = { success: "bg-emerald-600", error: "bg-red-600" }[type] || "bg-black/80";
      toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow ${color}`;
      toast.textContent = msg;
      toast.classList.remove("hidden");
      setTimeout(() => toast.classList.add("hidden"), 2200);
    };

    function bindDrawer() {
      const backdrop = App.qs("#drawer-backdrop");
      if (!backdrop) return;

      App.qs("#nav-burger")?.addEventListener("click", () => setDrawerOpen(true));
      App.qs("#drawer-close")?.addEventListener("click", () => setDrawerOpen(false));
      backdrop.addEventListener("click", () => setDrawerOpen(false));
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target); // small optimization
        }
      });
    }, { threshold: 0.12 });

    App.revealNow = () => App.qsa(".reveal").forEach(el => io.observe(el));

    // Moved OUT of addMsg to avoid redefining each time a message is added
    App.initMeshParallax = function initMeshParallax(options = {}) {
      const {
        selector = "#mesh",
        intensity = 6,
        scale = 1.03,
        throttleMs = 16,
      } = options;

      const el = document.querySelector(selector);
      if (!el) return () => {};

      let raf = 0;
      let last = 0;

      function onMove(e) {
        const now = performance.now();
        if (now - last < throttleMs) return;
        last = now;

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth - 0.5) * intensity;
          const y = (e.clientY / window.innerHeight - 0.5) * intensity;
          el.style.transform = `translate3d(${x}%, ${y}%, 0) scale(${scale})`;
        });
      }

      window.addEventListener("mousemove", onMove, { passive: true });

      return function cleanup() {
        window.removeEventListener("mousemove", onMove);
        if (raf) cancelAnimationFrame(raf);
      };
    };

    function initAiChat() {
      const toggleBtn = App.qs("#ai-chat-toggle");
      const panel = App.qs("#ai-chat-panel");
      const closeBtn = App.qs("#ai-chat-close");
      const clearBtn = App.qs("#ai-chat-clear");
      const input = App.qs("#ai-chat-input");
      const sendBtn = App.qs("#ai-chat-send");
      const messages = App.qs("#ai-chat-messages");

      if (!toggleBtn || !panel || !closeBtn || !clearBtn || !input || !sendBtn || !messages) return;

      let history = [];

      function addMsg(role, text) {
        const row = document.createElement("div");
        row.className = role === "user" ? "flex justify-end" : "flex justify-start";
        row.innerHTML = `
          <div class="max-w-[85%] px-3 py-2 rounded-xl leading-snug shadow"
              style="
                background:${role === "user" ? "var(--btnPrimaryBg)" : "var(--btnGhostBg)"};
                color:${role === "user" ? "var(--btnPrimaryFg)" : "var(--fg)"};
                border:1px solid var(--panelBorder);
              ">
            ${text}
          </div>
        `;
        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;
      }

      function setOpen(open) {
        panel.classList.toggle("hidden", !open);
        toggleBtn.classList.toggle("hidden", open);
      }

      toggleBtn.addEventListener("click", () => setOpen(true));
      closeBtn.addEventListener("click", () => setOpen(false));

      clearBtn.addEventListener("click", () => {
        history = [];
        messages.innerHTML = "";
        addMsg("assistant", App.t("ai_cleared_msg") || "Chat cleared. How can I help?");
      });

      async function send() {
        const text = input.value.trim();
        if (!text) return;
        input.value = "";

        addMsg("user", text);

        const typing = document.createElement("div");
        typing.className = "flex justify-start opacity-70 text-xs";
        typing.textContent = App.t("ai_typing") || "AI is typing...";
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;

        history.push({ role: "user", content: text });

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, message: text })
          });

          const data = await res.json().catch(() => ({}));
          typing.remove();

          if (data.answer) {
            addMsg("assistant", data.answer);
            history.push({ role: "assistant", content: data.answer });
          } else {
            history.pop();
            addMsg("assistant", (App.t("ai_error_prefix") || "Error:") + " " + (data.error || `HTTP ${res.status}` || "unknown"));
          }
        } catch (e) {
          typing.remove();
          history.pop();
          addMsg("assistant", App.t("ai_server_error") || "Network error. Check /api/chat.");
          console.error(e);
        }
      }

      sendBtn.addEventListener("click", send);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") send();
      });

      addMsg("assistant", App.t("ai_greeting") || "Hi! I'm your AI assistant.");
    }

    function bindLangToggles() {
      App.qsa("[data-lang]").forEach(btn => {
        btn.addEventListener("click", () => App.applyLang(btn.dataset.lang));
      });
    }

    App.confirm = ({ title, text, okText, cancelText } = {}) => {
      return new Promise((resolve) => {
        const modal = App.qs("#confirm-modal");
        const backdrop = App.qs("#confirm-backdrop");
        const titleEl = App.qs("#confirm-title");
        const textEl = App.qs("#confirm-text");
        const okBtn = App.qs("#confirm-ok");
        const cancelBtn = App.qs("#confirm-cancel");

        if (!modal) return resolve(false);

        titleEl.textContent = title || "Confirm";
        textEl.textContent = text || "";

        okBtn.textContent = okText || "OK";
        cancelBtn.textContent = cancelText || "Cancel";

        modal.classList.remove("hidden");

        const close = (result) => {
          modal.classList.add("hidden");
          okBtn.onclick = null;
          cancelBtn.onclick = null;
          backdrop.onclick = null;
          resolve(result);
        };

        okBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
        backdrop.onclick = () => close(false);
      });
    };

    App.initCommon = async ({ i18nUrl } = {}) => {
      mount("app-navbar", NAV_HTML);
      mount("app-footer", FOOTER_HTML);
      mount("app-ai", AI_HTML);

      if (!document.getElementById("confirm-modal")) {
        document.body.insertAdjacentHTML("beforeend", CONFIRM_HTML);
      }

      if (i18nUrl) await loadI18n(i18nUrl);

      const y = App.qs("#year");
      if (y) y.textContent = new Date().getFullYear();

      App.initTheme();
      App.initLang();
      updateNav();
      bindDrawer();
      bindThemeToggles();
      bindLangToggles();

      App.revealNow();
      initAiChat();

      return App;
    };
  })();
