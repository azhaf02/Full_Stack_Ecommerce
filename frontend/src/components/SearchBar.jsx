import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const searchText = query.trim();

    if (searchText === "") {
      return;
    }

    navigate("/search?q=" + encodeURIComponent(searchText));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="d-flex flex-grow-1 mx-4"
    >
      <input
        type="text"
        className="form-control"
        placeholder="Search products..."
        value={query}
        maxLength={100}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button type="submit" className="btn btn-light ms-2">
        Search
      </button>
    </form>
  );
}

export default SearchBar;