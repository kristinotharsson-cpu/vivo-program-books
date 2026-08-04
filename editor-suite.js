// Vivo Program Book — Rich text editing suite
// Plain-DOM controller (no React coupling): a floating formatting bar + link popover
// that operate on any focused `.rich-editable` contentEditable field. Exposes
// window.VivoRich.clean(html) for sanitized save. Auto-inits once on load.
var PALETTE = [
    ["Cream", "#FFFBEB"], ["Plum", "#BD2691"], ["Tangerine", "#EF4C26"], ["Orange", "#FF9E1D"],
    ["Blue", "#007ACC"], ["Sky", "#39BDFF"], ["Green", "#1BC469"], ["Light green", "#CFFFA2"],
    ["Lavender", "#C4B1C9"], ["Black", "#0A0A0B"]
  ];
  var ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, MARK: 1, A: 1, SPAN: 1, BR: 1 };

  // ---- Sanitizer: keep only inline formatting tags; strip the rest to text ----
  function clean(html) {
    var box = document.createElement("div");
    box.innerHTML = html || "";
    (function walk(node) {
      var kids = [].slice.call(node.childNodes);
      kids.forEach(function (c) {
        if (c.nodeType === 1) {
          if (!ALLOWED[c.tagName]) {
            // unwrap disallowed element, keep its text/children
            while (c.firstChild) node.insertBefore(c.firstChild, c);
            node.removeChild(c);
            return;
          }
          // strip attributes except href/target/rel on <a> and style color/background on <span>/<mark>
          var keepStyle = "";
          if (c.getAttribute("style")) {
            var col = c.style.color, bg = c.style.backgroundColor;
            if (col) keepStyle += "color:" + col + ";";
            if (bg) keepStyle += "background-color:" + bg + ";";
          }
          [].slice.call(c.attributes).forEach(function (a) { c.removeAttribute(a.name); });
          if (c.tagName === "A") {
            var href = c.__href || "#";
            c.setAttribute("href", href);
            if (/^https?:/i.test(href)) { c.setAttribute("target", "_blank"); c.setAttribute("rel", "noopener noreferrer"); }
          } else if (keepStyle) {
            c.setAttribute("style", keepStyle);
          }
          walk(c);
        } else if (c.nodeType === 8) { node.removeChild(c); }
      });
    })(box);
    return box.innerHTML;
  }

  // ---- Build the floating bar + popovers (once) ----
  var bar, flyText, flyHi, linkpop, savedRange = null;
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function build() {
    bar = el('<div class="vr-bar" id="vrBar">' +
      '<button data-cmd="bold" title="Bold (⌘B)"><b>B</b></button>' +
      '<button data-cmd="italic" title="Italic (⌘I)"><i>I</i></button>' +
      '<button data-cmd="underline" title="Underline (⌘U)"><u>U</u></button>' +
      '<span class="vr-sep"></span>' +
      '<button id="vrText" title="Text color"><svg viewBox="0 0 24 24"><path d="M5 20h14"/><path d="M8 16 12 5l4 11"/><path d="M9.5 12h5"/></svg></button>' +
      '<button id="vrHi" title="Highlight"><svg viewBox="0 0 24 24"><path d="M4 20h16"/><rect x="7" y="4" width="10" height="10" rx="1.5"/></svg></button>' +
      '<span class="vr-sep"></span>' +
      '<button id="vrLink" title="Link (⌘K)"><svg viewBox="0 0 24 24"><path d="M9 15 15 9"/><path d="M11 6.5 13 4.5a3.5 3.5 0 0 1 5 5l-2 2"/><path d="M13 17.5 11 19.5a3.5 3.5 0 0 1-5-5l2-2"/></svg></button>' +
      '<button data-cmd="removeFormat" title="Clear formatting"><svg viewBox="0 0 24 24"><path d="M5 6h14"/><path d="M9 6 7 20"/><path d="M15 6l-1 7"/><path d="m17 21-6-6"/></svg></button>' +
      '</div>');
    flyText = el('<div class="vr-fly" id="vrFlyText"></div>');
    flyHi = el('<div class="vr-fly" id="vrFlyHi"></div>');
    linkpop = el('<div class="vr-linkpop" id="vrLinkpop">' +
      '<div class="vr-tabs"><button data-tab="ext" class="on">External URL</button><button data-tab="int">In this book</button></div>' +
      '<div id="vrTabExt"><input id="vrUrl" type="text" placeholder="https://vivoperformingarts.org" /></div>' +
      '<div id="vrTabInt" style="display:none"><select id="vrSec"></select></div>' +
      '<div class="vr-row"><button class="vr-unlink" id="vrRemove">Remove</button><button class="vr-apply" id="vrApply">Apply link</button></div>' +
      '</div>');
    [bar, flyText, flyHi, linkpop].forEach(function (n) { document.body.appendChild(n); });

    buildFly(flyText, "Text color", function (hex) { document.execCommand("foreColor", false, hex); });
    buildFly(flyHi, "Highlight", function (hex) { document.execCommand("hiliteColor", false, hex); }, true);

    bar.addEventListener("mousedown", function (e) { e.preventDefault(); });
    bar.querySelectorAll("[data-cmd]").forEach(function (b) {
      b.onclick = function () { restore(); document.execCommand(b.dataset.cmd, false, null); syncState(); commit(); };
    });
    document.getElementById("vrText").onclick = function () { openFly(flyText, this); };
    document.getElementById("vrHi").onclick = function () { openFly(flyHi, this); };
    document.getElementById("vrLink").onclick = openLink;
    wireLink();
  }

  function buildFly(fly, label, apply, withClear) {
    fly.innerHTML = '<div class="vr-lab">' + label + "</div>";
    if (withClear) {
      var c = el('<button class="vr-sw vr-clear" title="None"></button>');
      c.onclick = function () { restore(); document.execCommand("hiliteColor", false, "transparent"); closeFly(); commit(); };
      fly.appendChild(c);
    }
    PALETTE.forEach(function (p) {
      var b = el('<button class="vr-sw" title="' + p[0] + '"></button>');
      b.style.background = p[1];
      b.onclick = function () { restore(); apply(p[1]); closeFly(); commit(); };
      fly.appendChild(b);
    });
    fly.addEventListener("mousedown", function (e) { e.preventDefault(); });
  }

  // ---- selection tracking ----
  function activeField() {
    var s = window.getSelection();
    if (!s.rangeCount) return null;
    var n = s.anchorNode; n = n && n.nodeType === 3 ? n.parentNode : n;
    return n && n.closest ? n.closest(".rich-editable") : null;
  }
  function save() { var s = window.getSelection(); if (s.rangeCount) savedRange = s.getRangeAt(0).cloneRange(); }
  function restore() { if (!savedRange) return; var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); }
  function commit() { var f = activeField(); if (f) f.dispatchEvent(new Event("input", { bubbles: true })); }

  function place(node, above) {
    var r = savedRange || (window.getSelection().rangeCount ? window.getSelection().getRangeAt(0) : null);
    if (!r) return; var b = r.getBoundingClientRect();
    node.style.left = (b.left + b.width / 2) + "px";
    node.style.top = (above ? b.top - 10 : b.bottom + 8) + "px";
  }
  function syncState() {
    ["bold", "italic", "underline"].forEach(function (c) {
      var b = bar.querySelector('[data-cmd="' + c + '"]');
      if (b) b.classList.toggle("on", document.queryCommandState(c));
    });
  }
  function showBar() {
    var s = window.getSelection();
    if (!s.rangeCount || s.isCollapsed || !activeField()) { bar.classList.remove("on"); return; }
    save(); place(bar, true); bar.classList.add("on"); syncState();
  }
  function hideAll() { [bar, flyText, flyHi, linkpop].forEach(function (n) { n && n.classList.remove("on"); }); }

  function openFly(fly, anchor) {
    save(); bar.classList.remove("on"); [flyText, flyHi].forEach(function (f) { if (f !== fly) f.classList.remove("on"); });
    var r = anchor.getBoundingClientRect(); fly.style.left = (r.left + r.width / 2) + "px"; fly.style.top = (r.bottom + 8) + "px"; fly.classList.add("on");
  }
  function closeFly() { flyText.classList.remove("on"); flyHi.classList.remove("on"); showBar(); }

  // ---- link popover ----
  function sectionOptions() {
    var sel = linkpop.querySelector("#vrSec");
    if (sel.__filled) return; sel.__filled = true;
    var secs = (window.PROGRAM_DATA && window.PROGRAM_DATA.sections) || [];
    (window.VIVO_PROGRAM_RECORD && window.VIVO_PROGRAM_RECORD.data && window.VIVO_PROGRAM_RECORD.data.sections || secs).forEach(function (s) {
      var o = document.createElement("option"); o.value = s.id; o.textContent = s.title || s.kind; sel.appendChild(o);
    });
  }
  function openLink() {
    save(); bar.classList.remove("on"); sectionOptions();
    var r = savedRange ? savedRange.getBoundingClientRect() : this.getBoundingClientRect();
    linkpop.style.left = (r.left + r.width / 2) + "px"; linkpop.style.top = (r.bottom + 10) + "px"; linkpop.classList.add("on");
    linkpop.querySelector("#vrUrl").focus();
  }
  function wireLink() {
    linkpop.addEventListener("mousedown", function (e) { if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT") e.preventDefault(); });
    linkpop.querySelectorAll(".vr-tabs button").forEach(function (t) {
      t.onclick = function () {
        linkpop.querySelectorAll(".vr-tabs button").forEach(function (x) { x.classList.remove("on"); }); t.classList.add("on");
        linkpop.querySelector("#vrTabExt").style.display = t.dataset.tab === "ext" ? "block" : "none";
        linkpop.querySelector("#vrTabInt").style.display = t.dataset.tab === "int" ? "block" : "none";
      };
    });
    linkpop.querySelector("#vrApply").onclick = function () {
      restore();
      var ext = linkpop.querySelector(".vr-tabs button.on").dataset.tab === "ext";
      var url = ext ? (linkpop.querySelector("#vrUrl").value || "#") : ("Program Book.html#/" + linkpop.querySelector("#vrSec").value);
      document.execCommand("createLink", false, url);
      var s = window.getSelection();
      if (s.rangeCount) { var n = s.anchorNode; while (n && n.nodeName !== "A") n = n.parentNode; if (n) { n.__href = url; if (ext) { n.target = "_blank"; n.rel = "noopener noreferrer"; } } }
      linkpop.classList.remove("on"); commit();
    };
    linkpop.querySelector("#vrRemove").onclick = function () { restore(); document.execCommand("unlink"); linkpop.classList.remove("on"); commit(); };
  }

  function init() {
    if (bar) return;
    build();
    document.addEventListener("selectionchange", function () {
      if (!window.__editMode || !document.hasFocus()) return;
      if (linkpop.classList.contains("on") || flyText.classList.contains("on") || flyHi.classList.contains("on")) return;
      clearTimeout(window.__vrT); window.__vrT = setTimeout(showBar, 10);
    });
    // keyboard shortcuts within rich fields
    document.addEventListener("keydown", function (e) {
      if (!window.__editMode) return; var f = activeField(); if (!f) return;
      var mod = e.metaKey || e.ctrlKey; if (!mod) return; var k = e.key.toLowerCase();
      if (k === "b" || k === "i" || k === "u") { e.preventDefault(); document.execCommand(k === "b" ? "bold" : k === "i" ? "italic" : "underline"); commit(); }
      else if (k === "k") { e.preventDefault(); save(); openLink.call(document.getElementById("vrLink")); }
    });
    // paste as clean text inside rich fields
    document.addEventListener("paste", function (e) {
      var f = activeField(); if (!f) return;
      e.preventDefault(); var t = (e.clipboardData || window.clipboardData).getData("text/plain");
      document.execCommand("insertText", false, t); commit();
    });
    document.addEventListener("mousedown", function (e) {
      if (bar.contains(e.target) || flyText.contains(e.target) || flyHi.contains(e.target) || linkpop.contains(e.target)) return;
      if (e.target.closest && e.target.closest(".rich-editable")) { flyText.classList.remove("on"); flyHi.classList.remove("on"); linkpop.classList.remove("on"); return; }
      hideAll();
    });
    window.addEventListener("scroll", hideAll, true);
    window.addEventListener("resize", hideAll);
  }

window.VivoRich = { clean: clean, init: init, hide: hideAll };
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
