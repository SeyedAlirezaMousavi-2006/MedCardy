/**
 * MedCardy E2E DOM & Sandbox Harness
 * Zero external dependencies - pure Node.js v24 standard library
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class DOMElement {
  constructor(tagName = 'div', attributes = {}, parent = null) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.id = attributes.id || '';
    this.className = attributes.class || '';
    this.parent = parent;
    this.children = [];
    this.childNodes = [];
    this._rawInnerHTML = '';
    this.style = {};
    this.eventListeners = {};

    if (attributes.style) {
      this._parseStyle(attributes.style);
    }
  }

  get innerHTML() {
    return this._rawInnerHTML || '';
  }

  set innerHTML(htmlStr) {
    this._rawInnerHTML = String(htmlStr);
    this.children = [];
    this.childNodes = [];
    if (!htmlStr) return;
    const fragment = parseHTML(`<FRAGMENT>${htmlStr}</FRAGMENT>`);
    const container = fragment.querySelector('FRAGMENT') || fragment;
    for (const node of container.childNodes) {
      if (typeof node === 'string') {
        this.childNodes.push(node);
      } else if (node instanceof DOMElement) {
        this.appendChild(node);
      }
    }
  }

  get textContent() {
    let text = '';
    for (const node of this.childNodes) {
      if (typeof node === 'string') {
        text += node;
      } else if (node && typeof node.textContent === 'string') {
        text += node.textContent;
      }
    }
    return text;
  }

  set textContent(val) {
    this.childNodes = [String(val)];
  }

  _parseStyle(styleStr) {
    const parts = styleStr.split(';');
    for (const part of parts) {
      const [key, val] = part.split(':').map(s => s && s.trim());
      if (key && val) {
        const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        this.style[camelKey] = val;
      }
    }
  }

  getAttribute(name) {
    if (name === 'class') return this.className;
    if (name === 'id') return this.id;
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'id') this.id = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
    if (name === 'class') this.className = '';
    if (name === 'id') this.id = '';
  }

  hasAttribute(name) {
    return this.attributes[name] !== undefined;
  }

  get classList() {
    const self = this;
    return {
      contains(cls) {
        const classes = (self.className || '').trim().split(/\s+/);
        return classes.includes(cls);
      },
      add(...classes) {
        const current = (self.className || '').trim().split(/\s+/).filter(Boolean);
        for (const cls of classes) {
          if (!current.includes(cls)) current.push(cls);
        }
        self.className = current.join(' ');
        self.attributes.class = self.className;
      },
      remove(...classes) {
        const current = (self.className || '').trim().split(/\s+/).filter(Boolean);
        self.className = current.filter(c => !classes.includes(c)).join(' ');
        self.attributes.class = self.className;
      },
      toggle(cls, force) {
        if (force !== undefined) {
          if (force) {
            this.add(cls);
            return true;
          } else {
            this.remove(cls);
            return false;
          }
        }
        if (this.contains(cls)) {
          this.remove(cls);
          return false;
        } else {
          this.add(cls);
          return true;
        }
      },
      toString() {
        return self.className;
      }
    };
  }

  addEventListener(event, handler) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  removeEventListener(event, handler) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
    }
  }

  dispatchEvent(event) {
    const handlers = this.eventListeners[event.type] || [];
    for (const h of handlers) {
      h.call(this, event);
    }
  }

  click() {
    const event = {
      type: 'click',
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    this.dispatchEvent(event);
  }

  appendChild(child) {
    child.parent = this;
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
    const nodeIdx = this.childNodes.indexOf(child);
    if (nodeIdx !== -1) {
      this.childNodes.splice(nodeIdx, 1);
    }
    return child;
  }

  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }

  getElementById(id) {
    if (this.id === id) return this;
    for (const child of this.children) {
      const match = child.getElementById(id);
      if (match) return match;
    }
    return null;
  }

  getElementsByClassName(className) {
    const results = [];
    if (this.classList.contains(className)) {
      results.push(this);
    }
    for (const child of this.children) {
      results.push(...child.getElementsByClassName(className));
    }
    return results;
  }

  getElementsByTagName(tagName) {
    const target = tagName.toUpperCase();
    const results = [];
    if (this.tagName === target) {
      results.push(this);
    }
    for (const child of this.children) {
      results.push(...child.getElementsByTagName(tagName));
    }
    return results;
  }

  _matchesSimpleSelector(selector) {
    selector = selector.trim();
    if (!selector) return false;

    // Attribute selector e.g. [data-layout="quizlet"] or [data-screen]
    if (selector.startsWith('[') && selector.endsWith(']')) {
      const inside = selector.slice(1, -1);
      if (inside.includes('=')) {
        const [attr, rawVal] = inside.split('=').map(s => s.trim());
        const val = rawVal.replace(/^["']|["']$/g, '');
        return this.getAttribute(attr) === val;
      }
      return this.hasAttribute(inside);
    }

    // ID selector e.g. #layoutSwitcher
    if (selector.startsWith('#')) {
      return this.id === selector.slice(1);
    }

    // Class selector e.g. .glass-card
    if (selector.startsWith('.')) {
      return this.classList.contains(selector.slice(1));
    }

    // Tag selector e.g. BUTTON or button
    return this.tagName === selector.toUpperCase();
  }

  _matchesCompoundSelector(selector) {
    // E.g. button.v-pill or div.card[data-id="1"]
    const regex = /([a-zA-Z0-9_-]+)?((?:\.[a-zA-Z0-9_-]+)+)?((?:\[[^\]]+\])+)?/;
    const match = selector.match(regex);
    if (!match) return false;

    const [full, tag, classes, attrs] = match;
    if (tag && this.tagName !== tag.toUpperCase()) return false;

    if (classes) {
      const classList = classes.split('.').filter(Boolean);
      for (const cls of classList) {
        if (!this.classList.contains(cls)) return false;
      }
    }

    if (attrs) {
      const attrList = attrs.match(/\[[^\]]+\]/g) || [];
      for (const attr of attrList) {
        if (!this._matchesSimpleSelector(attr)) return false;
      }
    }

    return true;
  }

  matches(selector) {
    selector = selector.trim();
    if (selector.includes(' ')) {
      // descendant selector handled in querySelector
      return false;
    }
    if (selector.includes('.') || selector.includes('[')) {
      return this._matchesCompoundSelector(selector);
    }
    return this._matchesSimpleSelector(selector);
  }

  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(selector) {
    selector = selector.trim();
    const parts = selector.split(/\s+/);

    if (parts.length === 1) {
      const results = [];
      const traverse = (node) => {
        for (const child of node.children) {
          if (child.matches(parts[0])) {
            results.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return results;
    }

    // Multiple descendant parts: e.g. ".bottom-nav-bar .b-nav-item"
    let currentPool = [this];
    for (const part of parts) {
      const nextPool = [];
      for (const node of currentPool) {
        const matches = node.querySelectorAll(part);
        for (const m of matches) {
          if (!nextPool.includes(m)) nextPool.push(m);
        }
      }
      currentPool = nextPool;
    }
    return currentPool;
  }
}

/**
 * Lightweight HTML parser for static document structure
 */
function parseHTML(htmlString) {
  const root = new DOMElement('DOCUMENT_ROOT');
  const stack = [root];

  // Strip comments and doctype
  const cleanHtml = htmlString
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/i, '');

  const tagRegex = /<(\/?[a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let match;

  const selfClosing = new Set([
    'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT',
    'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
  ]);

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const [full, tagName, attrString, textContent] = match;

    if (textContent) {
      const text = textContent.trim();
      if (text) {
        const current = stack[stack.length - 1];
        current.childNodes.push(text);
      }
      continue;
    }

    if (tagName.startsWith('/')) {
      const closingTag = tagName.slice(1).toUpperCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === closingTag) {
          stack.splice(i);
          break;
        }
      }
      continue;
    }

    // Parse attributes
    const attrs = {};
    const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2] !== undefined ? attrMatch[2] :
                      attrMatch[3] !== undefined ? attrMatch[3] :
                      attrMatch[4] !== undefined ? attrMatch[4] : '';
      attrs[attrName] = attrVal;
    }

    const currentParent = stack[stack.length - 1];
    const elem = new DOMElement(tagName, attrs, currentParent);
    currentParent.appendChild(elem);

    const isSelfClosing = selfClosing.has(elem.tagName) || attrString.trim().endsWith('/');
    if (!isSelfClosing) {
      stack.push(elem);
    }
  }

  return root;
}

/**
 * Create a full execution sandbox with simulated DOM and app.js loaded
 */
function createSandbox(htmlPath, appJsPath) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const domRoot = parseHTML(htmlContent);

  const body = domRoot.querySelector('body') || domRoot;
  const localStorageStore = {};

  const documentMock = {
    body,
    title: 'MedCardy',
    getElementById: (id) => domRoot.getElementById(id),
    querySelector: (sel) => domRoot.querySelector(sel),
    querySelectorAll: (sel) => domRoot.querySelectorAll(sel),
    getElementsByClassName: (cls) => domRoot.getElementsByClassName(cls),
    getElementsByTagName: (tag) => domRoot.getElementsByTagName(tag),
    createElement: (tag) => new DOMElement(tag),
    createTextNode: (txt) => txt,
    addEventListener: (evt, handler) => {
      domRoot.addEventListener(evt, handler);
    }
  };

  const windowMock = {
    document: documentMock,
    scrollTo: () => {},
    scroll: () => {},
    navigator: {
      vibrate: () => true,
      userAgent: 'MedCardy-E2E-Simulator'
    },
    localStorage: {
      getItem: (key) => localStorageStore[key] || null,
      setItem: (key, val) => { localStorageStore[key] = String(val); },
      removeItem: (key) => { delete localStorageStore[key]; },
      clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
    },
    setTimeout: (fn, delay) => {
      // Synchronous execution for deterministic testing if short
      if (delay && delay < 1000) {
        try { fn(); } catch (_) {}
      }
      return 1;
    },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const lucideMock = {
    createIcons: () => {}
  };

  const sandbox = {
    window: windowMock,
    document: documentMock,
    navigator: windowMock.navigator,
    localStorage: windowMock.localStorage,
    setTimeout: windowMock.setTimeout,
    clearTimeout: windowMock.clearTimeout,
    lucide: lucideMock,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    }
  };

  vm.createContext(sandbox);

  // Run script
  try {
    vm.runInContext(appJsContent, sandbox, { filename: 'app.js' });
  } catch (err) {
    sandbox.__loadError = err;
  }

  function evalInContext(expr) {
    try {
      return vm.runInContext(expr, sandbox);
    } catch (_) {
      return undefined;
    }
  }

  return {
    sandbox,
    dom: domRoot,
    body,
    window: windowMock,
    navigator: windowMock.navigator,
    htmlContent,
    appJsContent,
    evalInContext,
    get appState() { return evalInContext('typeof appState !== "undefined" ? appState : undefined'); },
    get app() { return evalInContext('typeof app !== "undefined" ? app : undefined'); },
    get purchasedCourses() { return evalInContext('typeof purchasedCourses !== "undefined" ? purchasedCourses : (typeof medicalDecks !== "undefined" ? medicalDecks : undefined)'); },
    get mobileDashboardTemplates() { return evalInContext('typeof mobileDashboardTemplates !== "undefined" ? mobileDashboardTemplates : undefined'); }
  };
}

/**
 * Validates CSS syntax and verifies design rules
 */
function inspectCSS(cssPath) {
  const content = fs.readFileSync(cssPath, 'utf8');

  // Track balanced braces
  let openCount = 0;
  const errors = [];
  const lines = content.split('\n');

  let currentSelector = '';
  let inRule = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('/*') && trimmed.endsWith('*/')) continue;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '{') {
        openCount++;
        inRule = true;
      } else if (char === '}') {
        openCount--;
        if (openCount === 0) inRule = false;
        if (openCount < 0) {
          errors.push({
            line: i + 1,
            message: `Unexpected closing brace '}' at line ${i + 1}`,
            snippet: trimmed
          });
          openCount = 0;
        }
      }
    }

    // Check for declarations outside of rules (excluding @import or comments)
    if (!inRule && trimmed && !trimmed.startsWith('@') && !trimmed.startsWith('/*') && trimmed.includes(':') && trimmed.endsWith(';')) {
      errors.push({
        line: i + 1,
        message: `Stray CSS declaration outside of rule block at line ${i + 1}: "${trimmed}"`,
        snippet: trimmed
      });
    }
  }

  if (openCount > 0) {
    errors.push({
      line: lines.length,
      message: `Unclosed CSS block: ${openCount} unclosed '{' brace(s) remaining at end of file`
    });
  }

  const hasGlassmorphism = content.includes('backdrop-filter') || content.includes('-webkit-backdrop-filter');
  const hasVazirmatn = content.includes('Vazirmatn');
  const hasMobileMedia = content.includes('@media') && (content.includes('430px') || content.includes('375px'));
  const hasDesktopMedia = content.includes('@media') && content.includes('1024px');

  return {
    syntaxValid: errors.length === 0,
    errors,
    tokens: {
      hasGlassmorphism,
      hasVazirmatn,
      hasMobileMedia,
      hasDesktopMedia
    }
  };
}

/**
 * Feature & Milestone readiness inspector
 */
function getMilestoneStatus(htmlPath, appJsPath, cssPath) {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const cssInspection = inspectCSS(cssPath);

  const hasPlatformHub = htmlContent.includes('id="screen-platform-hub"') || htmlContent.includes("id='screen-platform-hub'");
  const hasBreadcrumbs = htmlContent.includes('module-breadcrumb-bar') || htmlContent.includes('btnBackToPlatform');
  const hasPurchasedCourses = appJsContent.includes('purchasedCourses') && (appJsContent.includes('cardiology') || appJsContent.includes('قلب'));
  const hasActiveSession = appJsContent.includes('activeSession') || appJsContent.includes('StudySession');
  const hasIsolatedMetrics = appJsContent.includes('recalculateCourseStats') || appJsContent.includes('recalculate');

  const m1Ready = hasPlatformHub && hasBreadcrumbs && hasPurchasedCourses && hasActiveSession;
  const m2Ready = m1Ready && appJsContent.includes('shift-wards-grid') && appJsContent.includes('duo-progress-container');
  const m3Ready = cssInspection.syntaxValid && cssInspection.tokens.hasMobileMedia && cssInspection.tokens.hasDesktopMedia;
  const tier5Path = path.resolve(__dirname, 'tier5-m3-m4.js');
  const hasTier5 = fs.existsSync(tier5Path);
  const m4Ready = m1Ready && m2Ready && m3Ready && hasTier5 && appJsContent.includes('VALID_LAYOUTS') && appJsContent.includes('hasOwnProperty');

  const isStrictMode = process.argv.includes('--strict') || process.env.STRICT_E2E === '1';

  return {
    isStrictMode,
    hasPlatformHub,
    hasBreadcrumbs,
    hasPurchasedCourses,
    hasActiveSession,
    hasIsolatedMetrics,
    m1Ready,
    m2Ready,
    m3Ready,
    m4Ready,
    cssInspection
  };
}

module.exports = {
  DOMElement,
  parseHTML,
  createSandbox,
  inspectCSS,
  getMilestoneStatus
};
