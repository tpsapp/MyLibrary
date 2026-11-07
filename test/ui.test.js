const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function createUIContext(initialStorage = {}, domOverrides = {}) {
  const store = { ...initialStorage };
  const mockStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { for (const k in store) delete store[k]; }
  };

  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.innerText = '';
      this.textContent = '';
      this.className = '';
      this.innerHTML = '';
      this.style = {};
      this.parentNode = null;
      this.classList = {
        contains: (cls) => this.className.split(/\s+/).includes(cls)
      };
    }
    addEventListener() {}
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      if (child.innerText) {
        this.textContent = (this.textContent + ' ' + child.innerText).trim();
      }
      return child;
    }
    remove() {
      if (this.parentNode) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) this.parentNode.children.splice(idx, 1);
        this.parentNode = null;
      }
    }
    querySelector(sel) {
      if (domOverrides.elementQuerySelector) {
        return domOverrides.elementQuerySelector(this, sel);
      }
      return null;
    }
    closest(sel) {
      if (sel === '.delete' && this.classList.contains('delete')) return this;
      if (sel === 'tr' && this.tagName === 'TR') return this;
      if (this.parentNode && typeof this.parentNode.closest === 'function') {
        return this.parentNode.closest(sel);
      }
      return null;
    }
    focus() {}
  }

  const elementsMap = new Map();
  function getOrCreateElement(id, tag = 'div') {
    if (!elementsMap.has(id)) {
      const el = new MockElement(tag);
      el.id = id;
      elementsMap.set(id, el);
    }
    return elementsMap.get(id);
  }

  const container = getOrCreateElement('.container', 'div');
  const table = getOrCreateElement('.table', 'table');
  container.appendChild(table);

  const mockDoc = {
    addEventListener() {},
    querySelector(sel) {
      if (domOverrides.querySelector) {
        const custom = domOverrides.querySelector(sel);
        if (custom !== undefined) return custom;
      }
      if (elementsMap.has(sel)) return elementsMap.get(sel);
      return getOrCreateElement(sel, 'div');
    },
    querySelectorAll(sel) {
      if (domOverrides.querySelectorAll) {
        return domOverrides.querySelectorAll(sel);
      }
      return [];
    },
    createElement(tag) {
      return new MockElement(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: text };
    }
  };

  const sandbox = {
    localStorage: mockStorage,
    document: mockDoc,
    window: {},
    $: () => ({ modal() {} }),
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {},
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'main.js'), 'utf8');
  const exported = vm.runInContext(code + '\n;({Book, UI, Storage})', sandbox);

  return { sandbox, exported, elementsMap, getOrCreateElement };
}

test('TC-UI-01: UI.createBookRow constructs standard row with 4 columns and delete button', () => {
  const { exported } = createUIContext();
  const book = new exported.Book('Foundation', 'Isaac Asimov', '0553293354', 'Fiction');
  const row = exported.UI.createBookRow(book);

  assert.equal(row.tagName, 'TR');
  assert.equal(row.children.length, 5, 'Should have 4 data columns + 1 action column');
  assert.equal(row.children[0].innerText, 'Foundation');
  assert.equal(row.children[1].innerText, 'Isaac Asimov');
  assert.equal(row.children[2].innerText, '0553293354');
  assert.equal(row.children[3].innerText, 'Fiction');
  assert.ok(row.children[4].innerHTML.includes('button'), 'Action column should contain a button');
  assert.ok(row.children[4].innerHTML.includes('delete'), 'Action button must have delete class');
});

test('TC-UI-02: UI.addBook rejects whitespace-only inputs', () => {
  let alertMessage = null;
  let isAlertError = false;

  const { exported, getOrCreateElement } = createUIContext();

  // Populate form with whitespace
  getOrCreateElement('#title').value = '   ';
  getOrCreateElement('#author').value = 'Valid Author';
  getOrCreateElement('#isbn').value = '123';
  getOrCreateElement('#category').value = 'Fiction';

  exported.UI.showAlert = (msg, isErr) => {
    alertMessage = msg;
    isAlertError = isErr;
  };

  const event = { preventDefault() {} };
  exported.UI.addBook(event);

  assert.equal(isAlertError, true, 'Alert must be an error');
  assert.equal(alertMessage, 'Please enter a title!');
  assert.equal(exported.Storage.getBooks().length, 0, 'No book should be persisted');
});

test('TC-UI-03: UI.addBook trims valid input with leading/trailing spaces', () => {
  let alertMessage = null;
  const { exported, getOrCreateElement } = createUIContext();

  getOrCreateElement('#title').value = '  Neuromancer  ';
  getOrCreateElement('#author').value = '  William Gibson  ';
  getOrCreateElement('#isbn').value = '  0441569595  ';
  getOrCreateElement('#category').value = 'Fiction';

  exported.UI.showAlert = (msg) => { alertMessage = msg; };

  const event = { preventDefault() {} };
  exported.UI.addBook(event);

  const books = exported.Storage.getBooks();
  assert.equal(books.length, 1);
  assert.equal(books[0].title, 'Neuromancer');
  assert.equal(books[0].author, 'William Gibson');
  assert.equal(books[0].isbn, '0441569595');
  assert.equal(alertMessage, 'Neuromancer has been added.');
});

test('TC-UI-04 to TC-UI-09: UI.filterList searches Title, Author, ISBN, and Category', () => {
  const row1 = { textContent: 'Dune Frank Herbert 0441172717 Fiction', style: { display: '' } };
  const row2 = { textContent: 'Steve Jobs Walter Isaacson 1451648537 Non-Fiction', style: { display: '' } };
  const row3 = { textContent: 'The Hobbit J.R.R. Tolkien 054792822X Fiction', style: { display: '' } };
  const allRows = [row1, row2, row3];

  const { exported } = createUIContext({}, {
    querySelectorAll: (sel) => sel === '#bookList tr' ? allRows : []
  });

  // TC-UI-04: Match Title ("dune")
  exported.UI.filterList({ target: { value: 'dune' } });
  assert.equal(row1.style.display, 'table-row');
  assert.equal(row2.style.display, 'none');
  assert.equal(row3.style.display, 'none');

  // TC-UI-05: Match Author ("isaacson")
  exported.UI.filterList({ target: { value: 'isaacson' } });
  assert.equal(row1.style.display, 'none');
  assert.equal(row2.style.display, 'table-row');
  assert.equal(row3.style.display, 'none');

  // TC-UI-06: Match ISBN ("0547")
  exported.UI.filterList({ target: { value: '0547' } });
  assert.equal(row1.style.display, 'none');
  assert.equal(row2.style.display, 'none');
  assert.equal(row3.style.display, 'table-row');

  // TC-UI-07: Match Category ("non-fiction")
  exported.UI.filterList({ target: { value: 'non-fiction' } });
  assert.equal(row1.style.display, 'none');
  assert.equal(row2.style.display, 'table-row');
  assert.equal(row3.style.display, 'none');

  // TC-UI-08: No match ("xyzzy")
  exported.UI.filterList({ target: { value: 'xyzzy' } });
  assert.equal(row1.style.display, 'none');
  assert.equal(row2.style.display, 'none');
  assert.equal(row3.style.display, 'none');

  // TC-UI-09: Empty filter resets all to visible
  exported.UI.filterList({ target: { value: '' } });
  assert.equal(row1.style.display, 'table-row');
  assert.equal(row2.style.display, 'table-row');
  assert.equal(row3.style.display, 'table-row');
});
