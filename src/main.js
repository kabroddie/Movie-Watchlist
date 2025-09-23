class MovieWatchlistApp {
  constructor() {
    this.movieContainer = document.querySelector(".movie-container");
    this.searchBtn = document.getElementById("search-btn");
    this.searchBar = document.getElementById("search-bar");
    this.watchlistPage = document.getElementById('watchlist-page');
    this.movieIds = new Set();
    this.apiKey = '700adaac';
    this.baseURL = 'http://www.omdbapi.com/';
    this.fallbackImage = './poster-unavailable.png';
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      if (this.watchlistPage) {
        this.renderWatchListMovies();
      }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search functionality
    this.searchBtn?.addEventListener('click', () => this.performSearch());
    this.searchBar?.addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        this.performSearch();
      }
    });

    // Watchlist operations
    window.addEventListener('click', (e) => this.handleWatchlistClick(e));
  }

  async renderWatchListMovies() {
    if (!this.watchlistPage) return;

    if (this.isWatchlistEmpty()) {
      this.displayEmptyWatchlist();
      return;
    }

    this.watchlistPage.innerHTML = "";
    const movies = await this.fetchWatchlistMovies();
    this.renderMovies(movies, this.watchlistPage, true);
  }

  isWatchlistEmpty() {
    return localStorage.length === 0;
  }

  displayEmptyWatchlist() {
    this.watchlistPage.innerHTML = `
      <section class="no-film">
        <div class="start-exploring empty-watchlist">
          <h2>Your watchlist is looking a little empty...</h2>
          <div class="add-movies-container">
            <i class="fa fa-circle-plus"></i>
            <a href="index.html" class="watchlist-link">Let's add some movies!</a>
          </div>
        </div>  
      </section>
    `;
  }

  async fetchWatchlistMovies() {
    const moviePromises = Object.keys(localStorage).map(async (imdbId) => {
      try {
        return await this.fetchMovieById(imdbId);
      } catch (error) {
        console.error(`Error fetching movie ${imdbId}:`, error);
        return null;
      }
    });
    
    const movies = await Promise.all(moviePromises);
    return movies.filter(movie => movie !== null);
  }

  async fetchMovieById(imdbId) {
    const url = `${this.baseURL}?i=${imdbId}&type=movie&apikey=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie with ID: ${imdbId}`);
    }
    
    const movie = await response.json();
    
    if (movie.Error) {
      throw new Error(`Movie API Error: ${movie.Error}`);
    }
    
    return movie;
  }

  async fetchMovieByTitle(title) {
    const url = `${this.baseURL}?t=${encodeURIComponent(title)}&type=movie&apikey=${this.apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie: ${title}`);
    }
    
    const movie = await response.json();
    
    if (movie.Error) {
      throw new Error(`Movie API Error: ${movie.Error}`);
    }
    
    return movie;
  }

  handleWatchlistClick(e) {
    const { imdbid: imdbId, title, remove } = e.target.dataset;
    
    if (!imdbId) return;
    
    e.preventDefault();

    if (remove) {
      this.removeFromWatchlist(imdbId);
    } else {
      this.addToWatchlist(imdbId, title, e.target);
    }
  }

  addToWatchlist(imdbId, title, targetElement) {
    if (localStorage.getItem(imdbId)) return;

    const watchListContainer = targetElement.parentElement;
    watchListContainer.innerHTML = `
      <h4 class="movie-selected" data-imdbid="${imdbId}" data-title="${title}">Added</h4>
    `;
    
    localStorage.setItem(imdbId, title);
  }

  removeFromWatchlist(imdbId) {
    localStorage.removeItem(imdbId);
    this.renderWatchListMovies();
  }

  async performSearch() {
    const searchTerm = this.searchBar?.value?.trim();
    
    if (!searchTerm) return;

    try {
      const url = `${this.baseURL}?s=${encodeURIComponent(searchTerm)}&type=movie&apikey=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      this.movieContainer.innerHTML = "";
      this.movieIds.clear();

      if (!data.Search) {
        this.displayNoResults();
        return;
      }

      await this.fetchAndRenderSearchResults(data.Search);
    } catch (error) {
      console.error('Search error:', error);
      this.displayNoResults();
    }
  }

  displayNoResults() {
    this.movieContainer.innerHTML = `
      <section class="no-film">
        <div class="start-exploring try-again">
          <i class="fa fa-face-frown"></i>
          <h2>Oops we can't find movies with that name...</h2>
          <h3>Try searching for others</h3>
        </div>  
      </section>
    `;
  }

  async fetchAndRenderSearchResults(searchResults) {
    const moviePromises = searchResults.map(async (movieObj) => {
      try {
        const movie = await this.fetchMovieByTitle(movieObj.Title);
        
        if (!this.movieIds.has(movie.imdbID)) {
          this.movieIds.add(movie.imdbID);
          return movie;
        }
      } catch (error) {
        console.error(`Error fetching movie ${movieObj.Title}:`, error);
      }
      return null;
    });

    const movies = await Promise.all(moviePromises);
    const validMovies = movies.filter(movie => movie !== null);
    
    this.renderMovies(validMovies, this.movieContainer, false);
  }

  renderMovies(movies, container, isWatchlistPage = false) {
    movies.forEach(movie => {
      const movieHTML = this.createMovieHTML(movie, isWatchlistPage);
      container.innerHTML += movieHTML;
    });
  }

  createMovieHTML(movie, isWatchlistPage = false) {
    const posterSrc = this.getPosterSrc(movie.Poster);
    const watchlistButton = isWatchlistPage 
      ? this.createRemoveButton(movie)
      : this.createAddButton(movie);

    return `
      <div class="movie-item">
        <img class="movie-poster" 
          src="${posterSrc}" 
          onerror="this.src='${this.fallbackImage}'; this.onerror=null;"
          alt="${movie.Title} poster"/>
        <div class="movie-details">
          <div class="movie-row-1">
            <h3>${movie.Title}</h3>
            <i class="fa fa-star"></i>
            <h4 class="rating">${movie.imdbRating || 'N/A'}</h4>
          </div>
          <div class="movie-row-2">
            <h4>${movie.Runtime || 'N/A'}</h4>
            <h4>${movie.Genre || 'N/A'}</h4>
            <div class="watchlist-container">
              ${watchlistButton}
            </div>
          </div>
          <p class="movie-summary">${movie.Plot || 'No plot available.'}</p>
        </div>
      </div>
    `;
  }

  getPosterSrc(poster) {
    return poster && poster !== 'N/A' ? poster : this.fallbackImage;
  }

  createAddButton(movie) {
    const isInWatchlist = localStorage.getItem(movie.imdbID);
    
    if (isInWatchlist) {
      return `<h4 class="movie-selected" data-imdbid="${movie.imdbID}" data-title="${movie.Title}">Added</h4>`;
    }
    
    return `
      <i class="fa-solid fa-circle-plus" data-imdbid="${movie.imdbID}" data-title="${movie.Title}"></i>
      <h4 data-imdbid="${movie.imdbID}" data-title="${movie.Title}">Watchlist</h4>
    `;
  }

  createRemoveButton(movie) {
    return `
      <i class="fa-solid fa-circle-minus" data-imdbid="${movie.imdbID}" data-title="${movie.Title}" data-remove="#"></i>
      <h4 data-imdbid="${movie.imdbID}" data-title="${movie.Title}" data-remove="#">Remove</h4>
    `;
  }
}

// Initialize the app
const movieApp = new MovieWatchlistApp();