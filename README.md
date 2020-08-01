# MyLibrary

This is a site to allow you to keep track of the books you own.  All data is saved in the browsers local storage.

The main.js has comments for what each function does but below is a list of each class and what it's functions are for.

## Classes

### Book Class

Holds information regarding the books in the list.

* Book.title = The title of the book.
* Book.author = The author of the book.
* Book.isbn = The ISBN for the book.
* Book.category = The category the book belongs to.

### UI Class

Provides helper functions for accessing and controlling the UI.

* UI.displayBooks = A function to display any books located in the local storage.
* UI.addBook = A function to add a book to the UI list and local storage.
* UI.removeBook = A function to remove a book from the UI and local storage.
* UI.showAlert = A function to show an alert messages in the UI.
* UI.clearFields = A function to clear all input fields in the UI.
* UI.filterList = A function to filter the list of books based on the input from the search filter input element.

### Storage Class

Provides helper functions for accessing the local storage.

* Storage.getBooks = A function to get the list of books from local storage.
* Storage.addBook = A function to add a book to the local storage.
* Storage.removeBook = A function to remove a book from the local storage.

## Events

* Display books on page load
    document.addEventListener('DOMContentLoaded', UI.displayBooks);

* Add a book to the UI and local storage
    document.querySelector('#libraryForm').addEventListener('submit', UI.addBook);

* Remove a book form the UI and local storage
    document.querySelector('#bookList').addEventListener('click', UI.removeBook);

* Filter books on search terms
    document.querySelector('#searchFilter').addEventListener('keyup', UI.filterList);