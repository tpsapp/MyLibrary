const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function createSandbox(initialStorage = {}, domOverrides = {}) {
  const store = { ...initialStorage };
  const mockStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { for (const k in store) delete store[k]; }
  };

  const defaultElement = {
    addEventListener() {},
    remove() {},
    insertBefore() {},
    appendChild() {},
    style: {},
    querySelector() { return null; },
    classList: { contains() { return false; } }
  };

  const mockDoc = {
    addEventListener() {},
    querySelector(sel) {
      if (domOverrides.querySelector) {
        const custom = domOverrides.querySelector(sel);
        if (custom !== undefined) return custom;
      }
      return { ...defaultElement };
    },
    querySelectorAll() { return []; },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        appendChild() {},
        style: {},
        classList: { contains() { return false; } },
        parentNode: null,
        remove() { this.parentNode = null; }
      };
    },
    createTextNode(text) { return { nodeType: 3, textContent: text }; }
  };

  const sandbox = {
    localStorage: mockStorage,
    document: mockDoc,
    window: {},
    $: () => ({ modal() {} }),
    setTimeout: (cb, ms) => {
      if (domOverrides.captureTimeout) {
        domOverrides.captureTimeout(cb, ms);
      }
      return 1;
    },
    clearTimeout: () => {},
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'main.js'), 'utf8');
  const exported = vm.runInContext(code + '\n;({Book, UI, Storage})', sandbox);

  return { sandbox, exported, store };
}

test('FIX-01: Storage.removeBook removes duplicate/consecutive matching ISBNs without skipping', () => {
  const initialBooks = [
    { title: 'Book 1', author: 'Author 1', isbn: '999', category: 'Fiction' },
    { title: 'Book 2', author: 'Author 2', isbn: '999', category: 'Fiction' },
    { title: 'Book 3', author: 'Author 3', isbn: '111', category: 'Non-Fiction' }
  ];

  const { exported, sandbox } = createSandbox({ bookList: JSON.stringify(initialBooks) });
  exported.Storage.removeBook('999');

  const remaining = exported.Storage.getBooks();
  assert.equal(remaining.length, 1, 'Should leave exactly 1 book');
  assert.equal(remaining[0].isbn, '111', 'Remaining book should have ISBN 111');
});

test('FIX-02: Storage.getBooks gracefully handles corrupted JSON and non-array storage values', () => {
  // Corrupted JSON syntax
  const { exported: expCorrupt } = createSandbox({ bookList: '{bad_json:true' });
  let books;
  assert.doesNotThrow(() => {
    books = expCorrupt.Storage.getBooks();
  }, 'Should not throw on syntax error');
  assert.equal(Array.isArray(books), true, 'Corrupted JSON should return array');
  assert.equal(books.length, 0, 'Corrupted JSON should return empty array');

  // Stored value is a non-array JSON object
  const { exported: expObject } = createSandbox({ bookList: JSON.stringify({ key: 'value' }) });
  let objBooks;
  assert.doesNotThrow(() => {
    objBooks = expObject.Storage.getBooks();
  }, 'Should not throw on non-array JSON object');
  assert.equal(Array.isArray(objBooks), true, 'Non-array stored JSON should return array');
  assert.equal(objBooks.length, 0, 'Non-array stored JSON should return empty array');
});

test('FIX-03: UI.showAlert timeout cleanup references element directly and handles already-removed element', () => {
  let capturedTimeoutCb = null;
  const { exported } = createSandbox({}, {
    captureTimeout: (cb) => { capturedTimeoutCb = cb; },
    querySelector: (sel) => {
      // Simulate that querySelector('.alert') returns null (e.g. dismissed)
      if (sel === '.alert') return null;
      return undefined;
    }
  });

  exported.UI.showAlert('Test alert message', true);
  assert.equal(typeof capturedTimeoutCb, 'function', 'Timeout callback should be registered');
  assert.doesNotThrow(() => {
    capturedTimeoutCb();
  }, 'Timeout callback should safely execute even if alert was already removed from DOM');
});

test('FIX-04: UI.removeBook calls preventDefault and safely removes target row', () => {
  let preventDefaultCalled = false;
  let rowRemoved = false;

  const mockRow = {
    firstElementChild: { textContent: 'Dune' },
    children: [
      { textContent: 'Dune' },
      { textContent: 'Frank Herbert' },
      { textContent: '0441172717' },
      { textContent: 'Fiction' }
    ],
    remove() { rowRemoved = true; }
  };

  const mockDeleteBtn = {
    classList: { contains(c) { return c === 'delete'; } },
    closest(selector) {
      if (selector === '.delete') return this;
      if (selector === 'tr') return mockRow;
      return null;
    },
    parentNode: { parentNode: mockRow }
  };

  const initialBooks = [
    { title: 'Dune', author: 'Frank Herbert', isbn: '0441172717', category: 'Fiction' }
  ];

  const { exported } = createSandbox({ bookList: JSON.stringify(initialBooks) });

  const fakeEvent = {
    target: mockDeleteBtn,
    preventDefault() { preventDefaultCalled = true; }
  };

  exported.UI.removeBook(fakeEvent);

  assert.equal(preventDefaultCalled, true, 'e.preventDefault() must be called on delete event');
  assert.equal(rowRemoved, true, 'Target row must be removed from the UI');
  assert.equal(exported.Storage.getBooks().length, 0, 'Book must be removed from storage');
});

test('FIX-05: UI.showAlert inserts validation error alerts inside modal body when modal is active', () => {
  let insertedLocation = null;
  const mockModalBody = {
    insertBefore(el, ref) { insertedLocation = 'modal-body'; }
  };
  const mockModal = {
    classList: { contains(c) { return c === 'show'; } },
    querySelector(sel) { if (sel === '.modal-body') return mockModalBody; return null; }
  };
  const mockContainer = {
    insertBefore(el, ref) { insertedLocation = 'container'; }
  };

  const { exported } = createSandbox({}, {
    querySelector: (sel) => {
      if (sel === '#addBookModal') return mockModal;
      if (sel === '.container') return mockContainer;
      if (sel === '.table') return {};
      if (sel === '#libraryForm') return { addEventListener() {} };
      return undefined;
    }
  });

  exported.UI.showAlert('Please enter a title!', true);
  assert.equal(insertedLocation, 'modal-body', 'Error alert when modal is active must be inserted inside modal-body');

  // Success alert should be inserted in main container (outside modal)
  exported.UI.showAlert('Book added.', false);
  assert.equal(insertedLocation, 'container', 'Success alert must be inserted inside container');
});
