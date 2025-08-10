const API_KEY = "9a668541"; // Replace with your OMDb key
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const moviesDiv = document.getElementById("movies");
const errorMessage = document.getElementById("error-message");
const loadingDiv = document.getElementById("loading");
const searchBtn = form.querySelector("button");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const modeToggleBtn = document.getElementById("mode-toggle");

let currentPage = 1;
let currentQuery = "";
let totalResults = 0;
let darkMode = true; // default dark

// Debounce function to limit API calls while typing
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// Enable/disable search button based on input
input.addEventListener("input", () => {
  searchBtn.disabled = input.value.trim().length === 0;
  debouncedSearch(input.value.trim());
});

// Debounced live search (500ms after typing stops)
const debouncedSearch = debounce((query) => {
  if (query.length > 0) {
    currentPage = 1;
    performSearch(query, currentPage);
  } else {
    clearResults();
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim() === "") return;
  currentPage = 1;
  performSearch(input.value.trim(), currentPage);
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    performSearch(currentQuery, currentPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage * 10 < totalResults) {
    currentPage++;
    performSearch(currentQuery, currentPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

modeToggleBtn.addEventListener("click", () => {
  darkMode = !darkMode;
  if (darkMode) {
    document.body.classList.remove("light-mode");
    modeToggleBtn.textContent = "Dark Mode";
  } else {
    document.body.classList.add("light-mode");
    modeToggleBtn.textContent = "Light Mode";
  }
});

// Clear previous results
function clearResults() {
  moviesDiv.innerHTML = "";
  errorMessage.textContent = "";
  loadingDiv.style.display = "none";
  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

// Show loading spinner
function showLoading(show) {
  loadingDiv.style.display = show ? "block" : "none";
}

async function performSearch(query, page) {
  currentQuery = query;
  errorMessage.textContent = "";
  moviesDiv.innerHTML = "";
  showLoading(true);
  searchBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${API_KEY}&s=${encodeURIComponent(
        query
      )}&page=${page}`
    );
    const data = await res.json();

    if (data.Response === "False") {
      errorMessage.textContent = data.Error;
      showLoading(false);
      searchBtn.disabled = false;
      return;
    }

    totalResults = parseInt(data.totalResults);
    // Fetch full details for each movie for plot etc
    const detailsPromises = data.Search.map((movie) =>
      fetch(
        `https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`
      ).then((res) => res.json())
    );
    const moviesDetails = await Promise.all(detailsPromises);

    moviesDiv.innerHTML = "";
    moviesDetails.forEach((movie) => {
      const movieEl = document.createElement("div");
      movieEl.classList.add("movie");
      movieEl.innerHTML = `
        <img src="${
          movie.Poster !== "N/A"
            ? movie.Poster
            : "https://via.placeholder.com/220x320?text=No+Image"
        }" alt="${movie.Title}" />
        <div class="movie-info">
          <h3>${movie.Title}</h3>
          <span>${movie.Year} | ${movie.Genre || "Genre N/A"}</span>
          <p>${movie.Plot !== "N/A" ? movie.Plot : "Plot not available."}</p>
          <span>IMDb Rating: ${
            movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A"
          }</span>
        </div>
        <div class="expanded-details">
          <p><strong>Director:</strong> ${movie.Director || "N/A"}</p>
          <p><strong>Actors:</strong> ${movie.Actors || "N/A"}</p>
          <p><strong>Runtime:</strong> ${movie.Runtime || "N/A"}</p>
          <p><strong>Language:</strong> ${movie.Language || "N/A"}</p>
          <p><strong>Country:</strong> ${movie.Country || "N/A"}</p>
        </div>
      `;
      moviesDiv.appendChild(movieEl);

      // Expand details toggle on click
      movieEl.addEventListener("click", () => {
        movieEl.classList.toggle("expanded");
      });
    });

    // Enable/disable pagination buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage * 10 >= totalResults;
  } catch (err) {
    console.error(err);
    errorMessage.textContent = "Something went wrong. Please try again.";
  } finally {
    showLoading(false);
    searchBtn.disabled = false;
  }
}

// On page load disable search button since input is empty
searchBtn.disabled = true;

moviesDetails.forEach((movie) => {
  const movieEl = document.createElement("div");
  movieEl.classList.add("movie");
  movieEl.innerHTML = `
    <img src="${
      movie.Poster !== "N/A"
        ? movie.Poster
        : "https://via.placeholder.com/220x320?text=No+Image"
    }" alt="${movie.Title}" />
    <div class="movie-info">
      <h3>${movie.Title}</h3>
      <span>${movie.Year} | ${movie.Genre || "Genre N/A"}</span>
      <p>${movie.Plot !== "N/A" ? movie.Plot : "Plot not available."}</p>
      <span>IMDb Rating: ${
        movie.imdbRating !== "N/A" ? movie.imdbRating : "N/A"
      }</span>
      <button class="trailer-btn" type="button">Watch Trailer</button>
    </div>
    <div class="expanded-details">
      <p><strong>Director:</strong> ${movie.Director || "N/A"}</p>
      <p><strong>Actors:</strong> ${movie.Actors || "N/A"}</p>
      <p><strong>Runtime:</strong> ${movie.Runtime || "N/A"}</p>
      <p><strong>Language:</strong> ${movie.Language || "N/A"}</p>
      <p><strong>Country:</strong> ${movie.Country || "N/A"}</p>
    </div>
  `;

  moviesDiv.appendChild(movieEl);

  // Expand details toggle on click (but not on trailer button)
  movieEl.addEventListener("click", (e) => {
    if (!e.target.classList.contains("trailer-btn")) {
      movieEl.classList.toggle("expanded");
    }
  });

  