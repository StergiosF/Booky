import { useState, useEffect } from "react";
import "./App.css";
import StarRating from "./StarRating";
import { useLocalStorageState } from "./useLocalStorageState";

export default function App() {
  const [query, setQuery] = useState("");
  const [bookList, setBookList] = useState([]);
  const [readBookList, setReadBookList] = useLocalStorageState([], "read");
  const [selectedKey, setSelectedKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleSelected(key) {
    if (selectedKey === key) setSelectedKey(null);
    else setSelectedKey(key);
  }

  function handleAddBook(book) {
    setReadBookList((readBookList) => [...readBookList, book]);
  }

  function handleCloseBook() {
    setSelectedKey(null);
  }

  function handleDeleteBook(key) {
    const removedBook = readBookList.find((book) => book.key === key);

    setReadBookList((list) => list.filter((book) => book !== removedBook));
  }

  useEffect(
    function () {
      setIsLoading(true);
      async function fetchData() {
        try {
          const res = await fetch(
            `https://openlibrary.org/search.json?q=${query.replace(
              " ",
              "+"
            )}&fields=key,title,author_name,number_of_pages_median,first_publish_year,cover_i,ratings_average&limit=10`
          );

          if (!res.ok)
            throw new Error("Something went wrong with fetching books");

          const data = await res.json();

          setBookList(data.docs);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
    },
    [query]
  );

  return (
    <div className="app">
      <NavBar
        bookList={bookList}
        setQuery={setQuery}
        setSelectedKey={setSelectedKey}
      />
      <Main
        bookList={bookList}
        readBookList={readBookList}
        setReadBookList={setReadBookList}
        isLoading={isLoading}
        selectedKey={selectedKey}
        onSelected={handleSelected}
        onAddBook={handleAddBook}
        onCloseBook={handleCloseBook}
        onDeleteBook={handleDeleteBook}
      />
    </div>
  );
}

function NavBar({ bookList, setQuery, setSelectedKey }) {
  return (
    <div className="nav-bar">
      <Logo />
      <Search setQuery={setQuery} setSelectedKey={setSelectedKey} />
      <NumResults bookList={bookList} />
    </div>
  );
}

function Logo() {
  return <img src="logo-full.png" alt="books logo" className="logo" />;
}

function Search({ setQuery, setSelectedKey }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setQuery(value);
    setValue("");
    setSelectedKey(null);
  }

  function handleValue(e) {
    e.preventDefault();
    setValue(e.target.value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => handleValue(e)}
        type="text"
        className="search-input"
        placeholder="Search your favorite book..."
        autoFocus
      />
    </form>
  );
}

function NumResults({ bookList }) {
  return (
    <h3 className="num-results">
      Found <span>{bookList.length}</span> Books
      {bookList.length > 0 ? "!" : " 😥"}
    </h3>
  );
}

function Loader() {
  return (
    <div className="loader-container">
      <div className="loader">
        <div className="inner-circle"></div>
      </div>
    </div>
  );
}

function Main({
  bookList,
  readBookList,
  isLoading,
  selectedKey,
  onSelected,
  onAddBook,
  onCloseBook,
  onDeleteBook,
}) {
  return (
    <div className="main">
      <Box bookList={bookList}>
        {isLoading ? (
          <Loader />
        ) : (
          <BookList
            bookList={bookList}
            selectedKey={selectedKey}
            onSelected={onSelected}
          />
        )}
      </Box>
      <Box>
        {selectedKey ? (
          <BookDetails
            bookList={bookList}
            selectedKey={selectedKey}
            key={selectedKey}
            onAddBook={onAddBook}
            onCloseBook={onCloseBook}
            readBookList={readBookList}
          />
        ) : (
          <>
            <ReadSummary readBookList={readBookList} />
            <ReadBookList
              readBookList={readBookList}
              onDeleteBook={onDeleteBook}
            />
          </>
        )}
      </Box>
    </div>
  );
}

function Box({ children }) {
  return <div className="box">{children}</div>;
}

function BookList({ bookList, selectedKey, onSelected }) {
  return (
    <ul className="book-list">
      {bookList?.map((book) => (
        <Book
          book={book}
          key={book.key}
          selectedKey={selectedKey}
          onSelected={onSelected}
        />
      ))}
    </ul>
  );
}

function Book({ book, onSelected }) {
  const cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;

  const { first_publish_year: published, title } = book;

  return (
    <li className="book" onClick={() => onSelected(book.key)}>
      <img src={!book.cover_i ? "no-cover.png" : cover} alt="book cover" />
      <div>
        <h3>{title}</h3>
        <span>📅 {published}</span>
      </div>
    </li>
  );
}

function BookDetails({
  bookList,
  selectedKey,
  onAddBook,
  onCloseBook,
  readBookList,
}) {
  const [userRating, setUserRating] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [book, setBook] = useState({});

  function findBook(bookList, selectedKey) {
    return bookList.find((book) => book.key === selectedKey);
  }

  const bookData = findBook(bookList, selectedKey);

  useEffect(
    function () {
      setIsLoading(true);

      async function getBookDetails() {
        try {
          const res = await fetch(`https://openlibrary.org${selectedKey}.json`);

          const data = await res.json();

          setBook(data);
          setIsLoading(false);
        } catch (error) {
          console.log(error);
        }
      }
      getBookDetails();
    },
    [selectedKey]
  );

  const allDetails = { ...book, ...bookData };

  const cover = `https://covers.openlibrary.org/b/id/${allDetails.cover_i}-L.jpg`;

  const {
    author_name: author,
    description,
    first_publish_year: published,
    title,
    subjects,
    ratings_average: ratingsAverage,
    number_of_pages_median: pages,
    cover_i,
  } = allDetails;

  useEffect(
    function () {
      if (!title) return;
      document.title = title;

      return function () {
        document.title = "Booky";
      };
    },
    [title]
  );

  useEffect(
    function () {
      function callBack(e) {
        if (e.code === "Escape") {
          onCloseBook();
        }
      }

      document.addEventListener("keydown", callBack);

      return function () {
        document.removeEventListener("keydown", callBack);
      };
    },
    [onCloseBook]
  );

  function addBook() {
    const newReadBook = {
      key: selectedKey,
      title,
      published,
      pages,
      ratingsAverage,
      userRating,
      cover_i,
    };

    onAddBook(newReadBook);
    onCloseBook();
  }

  const includesBook = readBookList
    .map((book) => book)
    .map((book) => book.key)
    .includes(selectedKey);

  return (
    <div className="book-details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className="top-container">
            <button onClick={onCloseBook}>&larr;</button>
            <img
              src={!allDetails.cover_i ? "no-cover.png" : cover}
              alt="book cover"
            />
            <div className="details">
              <h2>{title}</h2>
              <p>
                {published} • {pages} pages
              </p>
              <p>
                {subjects ? subjects.slice(0, 3).join(", ") : "Subjects: N/A"}
              </p>
              <p>
                <span>⭐</span>
                {ratingsAverage ? ratingsAverage.toFixed(1) : "N/A"} Average
                rating
              </p>
            </div>
          </div>
          <div className="bottom-container">
            <div className="rating">
              {includesBook ? (
                <p>
                  You rated this book{" "}
                  <b>
                    {
                      readBookList.find((book) => book.key === selectedKey)
                        .userRating
                    }{" "}
                    ⭐
                  </b>
                </p>
              ) : (
                <>
                  <StarRating
                    maxRating={5}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating ? (
                    <button className="btn-add" onClick={addBook}>
                      + Add to list
                    </button>
                  ) : null}
                </>
              )}
            </div>
            <p>
              <em>
                {description
                  ? allDetails.description.value || description
                  : "No Description"}
              </em>
            </p>
            <p>
              {author?.length > 1
                ? `Authors: ${author.join().replace(",", ", ")}`
                : `Author: ${author}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ReadSummary({ readBookList }) {
  const countPages = readBookList.map((book) => book.pages);

  const avgPages =
    countPages.reduce((acc, init) => acc + init, 0) / countPages.length;

  const countRating = readBookList.map((book) => book.ratingsAverage);

  const avgRating =
    countRating.reduce((acc, init) => acc + init, 0) / countRating.length;

  const countUserRating = readBookList.map((book) => book.userRating);

  const avgUserRating =
    countUserRating.reduce((acc, init) => acc + init, 0) /
    countUserRating.length;

  return (
    <div className="read-summary">
      <h3>BOOKS YOU READ</h3>
      <div>
        <span>📚 {readBookList.length} books</span>
        <span>⭐ {avgRating ? avgRating.toFixed(1) : 0}</span>
        <span>🌟 {avgUserRating ? avgUserRating.toFixed(1) : 0}</span>
        <span>🧾 {avgPages ? Math.round(avgPages) : 0} Avg. pages</span>
      </div>
    </div>
  );
}

function ReadBookList({ readBookList, onDeleteBook }) {
  return (
    <ul className="read-book-list">
      {readBookList?.map((book) => (
        <ReadBook book={book} key={book.key} onDeleteBook={onDeleteBook} />
      ))}
    </ul>
  );
}

function ReadBook({ book, onDeleteBook }) {
  const cover = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;

  return (
    <li className="read-book">
      <img src={cover} alt="book image" />
      <div className="read-book-details">
        <h3>{book.title}</h3>
        <div>
          <span>
            ⭐ {book.ratingsAverage ? book.ratingsAverage.toFixed(1) : "N/A"}
          </span>
          <span>🌟 {book.userRating.toFixed(1)}</span>
          <span>🧾 {book.pages ? Math.round(book.pages) : "N/A"} pages</span>
        </div>
      </div>

      <button onClick={() => onDeleteBook(book.key)}>&times;</button>
    </li>
  );
}
