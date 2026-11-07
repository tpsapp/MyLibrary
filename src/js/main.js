// Classes

// Book Class: Holds information regarding the books in the list.
// Book.title = The title of the book.
// Book.author = The author of the book.
// Book.isbn = The ISBN for the book.
// Book.category = The category the book belongs to.
class Book {
    constructor(title, author, isbn, category) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
    }
}

// UI Class:  Provides helper functions for accessing and controlling the UI.
// UI.displayBooks = A function to display any books located in the local storage.
// UI.createBookRow = A function to create and return a table row DOM element for a given book.
// UI.addBook = A function to add a book to the UI list and local storage.
// UI.removeBook = A function to remove a book from the UI and local storage.
// UI.showAlert = A function to show an alert messages in the UI.
// UI.clearFields = A function to clear all input fields in the UI.
// UI.filterList = A function to filter the list of books based on the input from the search filter input element.
class UI {
    static createBookRow(book) {
        // Create a table row element for the current book
        const row = document.createElement('tr');

        // Create a table column element for the book title
        const title = document.createElement('td');
        title.innerText = book.title;
        row.appendChild(title);

        // Create a table column element for the book author
        const author = document.createElement('td');
        author.innerText = book.author;
        row.appendChild(author);

        // Create a table column element for the book isbn
        const isbn = document.createElement('td');
        isbn.innerText = book.isbn;
        row.appendChild(isbn);

        // Create a table column element for the book category
        const category = document.createElement('td');
        category.innerText = book.category;
        row.appendChild(category);
        
        // Create a table column element for the delete button
        const deleteBtn = document.createElement('td');
        deleteBtn.className = 'd-flex justify-content-end';
        deleteBtn.innerHTML = '<button type="button" class="btn btn-danger btn-sm delete" aria-label="Delete book">X</button>';
        row.appendChild(deleteBtn);

        return row;
    }

    static displayBooks() {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Grab the table body with the id of bookList to add the books too.
        const bookListElems = document.querySelector('#bookList');

        // iterate through each book and add it to the UI
        bookList.forEach((book) => {            
            const row = UI.createBookRow(book);
            bookListElems.appendChild(row);
        });

        // Clear all text fields
        UI.clearFields();
    }

    static addBook(e) {
        // Prevent any form submission
        e.preventDefault();
    
        // Get the title, author, isbn, and category of the book from the respective form elements (trimmed)
        const title = document.querySelector('#title').value.trim();
        const author = document.querySelector('#author').value.trim();
        const isbn = document.querySelector('#isbn').value.trim();
        const category = document.querySelector('#category').value.trim();

        // Check to make sure each required field has been filled in appropriately
        if (title === '') {
            // Show an error alert advising the user to enter a title
            UI.showAlert('Please enter a title!', true);
            // Place the focus on the title field to make it easier to fill in the required information
            document.querySelector('#title').focus();
        }
        else if (author === '') {
            // Show an error alert advising the user to enter an author
            UI.showAlert('Please enter an author!', true);
            // Place the focus on the author field to make it easier to fill in the required information
            document.querySelector('#author').focus();
        }
        else if (isbn === '') {
            // Show an error alert advising the user to enter an ISBN
            UI.showAlert('Please enter an ISBN!', true);
            // Place the focus on the isbn field to make it easier to fill in the required information
            document.querySelector('#isbn').focus();
        }
        else if (category === '') {
            // Show an error alert advising the user to enter a category
            UI.showAlert('Please choose a category!', true);
            // Place the focus on the category field to make it easier to fill in the required information
            document.querySelector('#category').focus();
        }
        // Check to see if the book already exists in the local storage by checking for the corresponding ISBN
        else if (Storage.bookExists(isbn)) {
            // Show an error stating that the book already exists in the library
            UI.showAlert(title + ' already exists.', true);
        }
        else {
            // Create a new book class for the currently entered data
            const book = new Book(title, author, isbn, category);
            
            // Get the table body that contains the current list of books
            const bookList = document.querySelector('#bookList');
            const row = UI.createBookRow(book);
            bookList.appendChild(row);

            // Add the book to local storage
            Storage.addBook(book);

            // Show an alert to notify the user that the book has been added
            UI.showAlert(title + ' has been added.', false);

            // Clear all form fields to make it easier to enter information
            UI.clearFields();
        }
    }

    static removeBook(e) {
        // Verify that the target of the click is a delete button by checking its classList or closest ancestor
        const deleteBtn = e.target.closest('.delete');
        if (deleteBtn) {
            // Prevent default action (page jumping or form submission)
            e.preventDefault();

            // Locate the closest table row containing the book
            const row = deleteBtn.closest('tr') || deleteBtn.parentNode.parentNode;
            if (!row) return;

            // Get the name of the current book from the first element of the row
            const bookName = row.firstElementChild ? row.firstElementChild.textContent : '';
            // Get the isbn of the current book from the third element of the row
            const isbn = row.children[2] ? row.children[2].textContent : '';

            // Remove the current table row from the UI
            row.remove();

            // Remove the current book from the local storage based on its isbn
            Storage.removeBook(isbn);

            // Show an alert that the book has been removed
            UI.showAlert(bookName + ' removed.', false);
        }
    }

    static showAlert(message, isError, duration = 3000) {
        // Create the div element for the alert
        const alertDiv = document.createElement('div');
        
        // Check to see if this alert is an error or not
        if (isError) {
            // Set the divs classes to indicate it is an error
            alertDiv.className = "alert alert-danger mt-3";
        }
        else {
            // Set the divs classes to indicate it is not an error
            alertDiv.className = "alert alert-success mt-3";
        }

        // Add a text node containing the message for the alert
        alertDiv.appendChild(document.createTextNode(message));

        const modal = document.querySelector('#addBookModal');
        const modalBody = (modal && typeof modal.querySelector === 'function') ? modal.querySelector('.modal-body') : null;
        const libraryForm = document.querySelector('#libraryForm');

        // If the modal is currently active/open on an error, insert alert inside modal to avoid backdrop occlusion
        if (isError && modal && modal.classList.contains('show') && modalBody && libraryForm) {
            modalBody.insertBefore(alertDiv, libraryForm);
        } else {
            // Get the main container element from the DOM
            const cont = document.querySelector('.container');
            // Get the table that contains the book list from the DOM
            const table = document.querySelector('.table');
            if (cont && table) {
                // Insert the alert div before the table
                cont.insertBefore(alertDiv, table);
            }
        }

        if(!isError) {
            $('#addBookModal').modal('hide')
        }

        // Set a timeout to remove the specific alert instance after the specified duration
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
    }

    static clearFields() {
        // Set the value of all text inputs on the page to an empty string
        document.querySelector('#searchFilter').value = '';
        document.querySelector('#title').value = '';
        document.querySelector('#author').value = '';
        document.querySelector('#isbn').value = '';
        // Set the selected item of the category selector to the first option
        document.querySelector('#category').selectedIndex = 0;
    }

    static filterList(e) {
        // Get the text from the search filter input in lowercase and trimmed
        const filter = e.target.value.toLowerCase().trim();
    
        // Get an array of the table rows containing all the book information
        const bookList = document.querySelectorAll('#bookList tr');
    
        // Iterate through the table row array
        bookList.forEach((book) => {
            // Get the complete text content of the row
            const rowText = book.textContent.toLowerCase();
            
            // Check to see if the search term appears in any column (title, author, isbn, category)
            if (rowText.includes(filter)) {
                // Set the display of the table row to make it visible
                book.style.display = 'table-row';
            }
            else {
                // Set the display of the table row to none so it will not be visible
                book.style.display = 'none';
            }
        });
    }
}

// Storage Class:  Provides helper functions for accessing the local storage.
// Storage.getBooks = A function to get the list of books from local storage.
// Storage.addBook = A function to add a book to the local storage.
// Storage.removeBook = A function to remove a book from the local storage.
class Storage {
    static getBooks() {
        // Instantiate a variable to contain the list of books from local storage
        let bookList = [];
        const storedBooks = localStorage.getItem('bookList');

        // Check to see if the local storage contains a saved list of books
        if (storedBooks !== null) {
            try {
                const parsed = JSON.parse(storedBooks);
                if (Array.isArray(parsed)) {
                    bookList = parsed;
                } else {
                    console.warn('Storage.getBooks: stored bookList is not an array, falling back to empty list.');
                }
            } catch (err) {
                console.error('Storage.getBooks: failed to parse stored books JSON:', err);
            }
        }

        // Return the book list array
        return bookList;
    }

    static addBook(book) {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Add the specified book to the array
        bookList.push(book);

        // Write the array back to local storage
        localStorage.setItem('bookList', JSON.stringify(bookList));
    }

    static removeBook(isbn) {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Filter out books matching the target ISBN
        const updatedBookList = bookList.filter((book) => book.isbn !== isbn);

        // Write the array back to local storage
        localStorage.setItem('bookList', JSON.stringify(updatedBookList));
    }

    static bookExists(isbn) {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Check if any book matches the specified ISBN with early exit
        return bookList.some((book) => book.isbn === isbn);
    }
}

// Events

// Display books on page load
document.addEventListener('DOMContentLoaded', UI.displayBooks);

// Add a book to the UI and local storage
document.querySelector('#libraryForm').addEventListener('submit', UI.addBook);

// Remove a book form the UI and local storage
document.querySelector('#bookList').addEventListener('click', UI.removeBook);

// Filter books on search terms
document.querySelector('#searchFilter').addEventListener('keyup', UI.filterList);