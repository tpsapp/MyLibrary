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
// UI.addBook = A function to add a book to the UI list and local storage.
// UI.removeBook = A function to remove a book from the UI and local storage.
// UI.showAlert = A function to show an alert messages in the UI.
// UI.clearFields = A function to clear all input fields in the UI.
// UI.filterList = A function to filter the list of books based on the input from the search filter input element.
class UI {
    static displayBooks() {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Grab the table body with the id of bookList to add the books too.
        const bookList = document.querySelector('#bookList');

        // iterate through each book and add it to the UI
        bookList.forEach((book) => {            
            // Create a table row element for the current book
            const row = document.createElement('tr');

            // Create a table column element for the book title
            const title = document.createElement('td');
            // Set the inner text to the title of the book
            title.innerText = book.title;
            // Append the table column to the table row
            row.appendChild(title);

            // Create a table column element for the book author
            const author = document.createElement('td');
            // Set the inner text to the author of the book
            author.innerText = book.author;
            // Append the table column to the table row
            row.appendChild(author);

            // Create a table column element for the book isbn
            const isbn = document.createElement('td');
            // Set the inner text to the isbn of the book
            isbn.innerText = book.isbn;
            // Append the table column to the table row
            row.appendChild(isbn);

            // Create a table column element for the book category
            const category = document.createElement('td');
            // Set the inner text to the category of the book
            category.innerText = book.category;
            // Append the table column to the table row
            row.appendChild(category);
            
            // Create a table column element for the delete button
            const deleteBtn = document.createElement('td');
            // Set the className of the table row to have it show all elements to the right
            deleteBtn.className = 'd-flex justify-content-end';
            // Set the inner HTML to a link that looks like a red button with an X
            deleteBtn.innerHTML = '<a href="#" class="btn btn-danger btn-sm delete">X</a>';
            // Append the table column to the table row
            row.appendChild(deleteBtn);

            // Append the table row to the table body.
            bookList.appendChild(row);
        });

        // Clear all text fields
        UI.clearFields();
    }

    static addBook(e) {
        // Prevent any form submission
        e.preventDefault();
    
        // Get the title, author, isbn, and category of the book from the respective form elements
        const title = document.querySelector('#title').value;
        const author = document.querySelector('#author').value;
        const isbn = document.querySelector('#isbn').value;
        const category = document.querySelector('#category').value;

        // Check to make sure each required field has been filled in appropriately
        if (title === '') {
            // Show an error alert advising the user to enter a title
            UI.showAlert('Please enter a title!', true);
            // Place the focus on the title field to make it easier to fill in the required information
            document.querySelector('#title').focus();
        }
        else if (author === '') {
            // Show an error alert advising the user to enter a author
            UI.showAlert('Please enter a author!', true);
            // Place the focus on the author field to make it easier to fill in the required information
            document.querySelector('#author').focus();
        }
        else if (isbn === '') {
            // Show an error alert advising the user to enter a author
            UI.showAlert('Please enter a isbn!', true);
            // Place the focus on the author field to make it easier to fill in the required information
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

            // Create a table row element for the current book
            const row = document.createElement('tr');

            // Create a table column element for the book title
            const titleColumn = document.createElement('td');
            // Set the inner text to the title of the book
            titleColumn.innerText = title;
            // Append the table column to the table row
            row.appendChild(titleColumn);

            // Create a table column element for the book author
            const authorColumn = document.createElement('td');
            // Set the inner text to the author of the book
            authorColumn.innerText = author;
            // Append the table column to the table row
            row.appendChild(authorColumn);

            // Create a table column element for the book isbn
            const isbnColumn = document.createElement('td');
            // Set the inner text to the isbn of the book
            isbnColumn.innerText = isbn;
            // Append the table column to the table row
            row.appendChild(isbnColumn);

            // Create a table column element for the book category
            const categoryColumn = document.createElement('td');
            // Set the inner text to the category of the book
            categoryColumn.innerText = category;
            // Append the table column to the table row
            row.appendChild(categoryColumn);
            
            // Create a table column element for the delete button
            const deleteBtn = document.createElement('td');
            // Set the className of the table row to have it show all elements to the right
            deleteBtn.className = 'd-flex justify-content-end';
            // Set the inner HTML to a link that looks like a red button with an X
            deleteBtn.innerHTML = '<a href="#" class="btn btn-danger btn-sm delete">X</a>';
            // Append the table column to the table row
            row.appendChild(deleteBtn);

            // Append the table row to the table body.
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
        // Verify that the target of the click is a delete button by checking its classList
        if (e.target.classList.contains('delete')) {
            // Get the name of the current book from the first element of the parent of the targets parent
            const bookName = e.target.parentNode.parentNode.firstElementChild.textContent;
            // Get the isbm of the current book from the third element of the parent of the targets parent
            const isbn = e.target.parentNode.parentNode.children[2].textContent;

            // Remove the current table row from the UI
            e.target.parentNode.parentNode.remove();

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

        // Get the main container element from the DOM
        const cont = document.querySelector('.container');
        // Get the table that contains the book list from the DOM
        const table = document.querySelector('.table');
        // Insert the alert div before the table
        cont.insertBefore(alertDiv, table);

        // Set a timeout to remove the alert after the specified duration or after 3 seconds if no duration is passed
        setTimeout(() => document.querySelector('.alert').remove(), duration);
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
        // Get the text from the search filter input in lowercase
        const filter = e.target.value.toLowerCase();
    
        // Get an array of the table rows containing all the book information
        const bookList = document.querySelectorAll('#bookList tr');
    
        // Iterate through the table row array
        bookList.forEach((book) => {
            // Get the name of the book from the current row
            const bookName = book.firstElementChild.textContent;
            
            // Check to see if the search term appears in the book title
            if (bookName.toLowerCase().indexOf(filter) !== -1) {
                // Set the display of the table row to make it visible
                book.style.display = 'table-row';
            }
            else {
                // Set the display of the table row to none so it will not be visible
                book.style.display = 'none';
            }
        })
    }
}

// Storage Class:  Provides helper functions for accessing the local storage.
// Storage.getBooks = A function to get the list of books from local storage.
// Storage.addBook = A function to add a book to the local storage.
// Storage.removeBook = A function to remove a book from the local storage.
class Storage {
    static getBooks() {
        // Instantiate a variable to contain the list of books from local storage
        let bookList;

        // Check to see if the local storage contains a save list of books
        if (localStorage.getItem('bookList') === null) {
            // Initialize the booklist array as an empty array since no books are stored
            bookList = [];
        }
        else {
            // Parse the JSON list of books in local storage and initialize the book list array
            bookList = JSON.parse(localStorage.getItem('bookList'));
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

        // Iterate through the array of books
        bookList.forEach((book, index) => {
            // Check to see if the current book isbn matches the one to remove
            if (book.isbn === isbn) {
                // Remove the book from the book list array by splicing it out
                bookList.splice(index, 1);
            }
        });

        // Write the array back to local storage
        localStorage.setItem('bookList', JSON.stringify(bookList));
    }

    static bookExists(isbn) {
        // Get the list of books from local storage
        const bookList = Storage.getBooks();

        // Initalize a variable to indicate if the book was found as false by default
        let result = false;

        // Iterate through the array of books
        bookList.forEach((book) => {
            // Check to see if the current book isbn matches the one specified
            if (book.isbn === isbn) {
                // Set the result to true since it was found
                result = true;
            }
        });

        // Return the result of the book search
        return result;
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