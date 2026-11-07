const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function createStorageContext(initialStore = {}) {
  const store = { ...initialStore };
  const mockStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { for (const k in store) delete store[k]; }
  };

  const sandbox = {
    localStorage: mockStorage,
    document: { addEventListener() {}, querySelector() { return { addEventListener() {} }; } },
    window: {},
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'main.js'), 'utf8');
  const { Storage, Book } = vm.runInContext(code + '\n;({Storage, Book})', sandbox);

  return { Storage, Book, store };
}

test('TC-STO-01: Storage.getBooks returns deserialized array of books', () => {
  const seed = [
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', category: 'Fiction' },
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Non-Fiction' }
  ];
  const { Storage } = createStorageContext({ bookList: JSON.stringify(seed) });
  const books = Storage.getBooks();
  assert.equal(books.length, 2);
  assert.equal(books[0].title, 'The Hobbit');
  assert.equal(books[1].author, 'Robert C. Martin');
});

test('TC-STO-02: Storage.addBook adds book to local storage as JSON string', () => {
  const { Storage, store } = createStorageContext();
  Storage.addBook({ title: '1984', author: 'George Orwell', isbn: '9780451524935', category: 'Fiction' });
  
  assert.ok(store.bookList, 'bookList must be populated in store');
  const parsed = JSON.parse(store.bookList);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].title, '1984');
});

test('TC-STO-03: Storage.removeBook removes single book by ISBN', () => {
  const seed = [
    { title: 'Book A', author: 'Author A', isbn: 'AAA', category: 'Fiction' },
    { title: 'Book B', author: 'Author B', isbn: 'BBB', category: 'Non-Fiction' }
  ];
  const { Storage, store } = createStorageContext({ bookList: JSON.stringify(seed) });
  Storage.removeBook('AAA');
  const remaining = Storage.getBooks();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].isbn, 'BBB');
  assert.equal(JSON.parse(store.bookList).length, 1);
});

test('TC-STO-04: Storage.removeBook removes all duplicate ISBN occurrences without skipping elements', () => {
  const seed = [
    { title: 'Copy 1', author: 'Author', isbn: 'DUP123', category: 'Fiction' },
    { title: 'Copy 2', author: 'Author', isbn: 'DUP123', category: 'Fiction' },
    { title: 'Copy 3', author: 'Author', isbn: 'DUP123', category: 'Fiction' },
    { title: 'Unique', author: 'Author', isbn: 'UNI456', category: 'Non-Fiction' }
  ];
  const { Storage } = createStorageContext({ bookList: JSON.stringify(seed) });
  Storage.removeBook('DUP123');
  const remaining = Storage.getBooks();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].isbn, 'UNI456');
});

test('TC-STO-05: Storage.removeBook on non-existent ISBN leaves collection untouched', () => {
  const seed = [{ title: 'Dune', author: 'Frank Herbert', isbn: '123', category: 'Fiction' }];
  const { Storage } = createStorageContext({ bookList: JSON.stringify(seed) });
  Storage.removeBook('NON_EXISTENT');
  assert.equal(Storage.getBooks().length, 1);
});

test('TC-STO-06: Storage.getBooks on uninitialized storage returns empty array', () => {
  const { Storage } = createStorageContext();
  const books = Storage.getBooks();
  assert.equal(Array.isArray(books), true);
  assert.equal(books.length, 0);
});

test('TC-STO-07: Storage.getBooks on corrupted JSON safely recovers to empty array', () => {
  const { Storage } = createStorageContext({ bookList: '{syntax-error:::' });
  const books = Storage.getBooks();
  assert.equal(Array.isArray(books), true);
  assert.equal(books.length, 0);
});

test('TC-STO-08: Storage.getBooks on non-array stored value recovers to empty array', () => {
  const { Storage } = createStorageContext({ bookList: '{"custom": "object"}' });
  const books = Storage.getBooks();
  assert.equal(Array.isArray(books), true);
  assert.equal(books.length, 0);
});

test('TC-STO-09 & TC-STO-10: Storage.bookExists returns true for hit and false for miss', () => {
  const seed = [
    { title: 'Dune', author: 'Frank Herbert', isbn: '0441172717', category: 'Fiction' }
  ];
  const { Storage } = createStorageContext({ bookList: JSON.stringify(seed) });
  assert.equal(Storage.bookExists('0441172717'), true);
  assert.equal(Storage.bookExists('9999999999'), false);
});
