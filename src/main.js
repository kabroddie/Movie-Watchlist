const movieContainer = document.querySelector(".movie-container")
const searchBtn = document.getElementById("search-btn")
const searchBar = document.getElementById("search-bar")
const movieIds = new Set()

searchBtn.addEventListener('click', performSearch)

searchBar.addEventListener('keydown', e => {
  if (e.key === "Enter") {
    performSearch()
  }
})

async function performSearch() {
  const searchURL = `http://www.omdbapi.com/?s=${searchBar.value}&type=movie&apikey=700adaac`
  const response = await fetch(searchURL)
  const movies = await response.json()

  // console.log(movies.Search)
  movieContainer.innerHTML = ""
  movieIds.clear()
  fetchMovies(movies.Search)
}

async function fetchMovies(moviesObj) {

  
  moviesObj.forEach(async movieObj => {
    try {
      
      const response = await fetch(`http://www.omdbapi.com/?t=${movieObj.Title}&type=movie&apikey=700adaac`)

      if (!response.ok) {
        return
      }
      
      const movie = await response.json()
      
      if (!movieIds.has(movie.imdbID)) {
        movieIds.add(movie.imdbID)
        constructMovieTemplate(movie)
      }

    } catch (error) {
      return
    }
  })
}

const constructMovieTemplate = movie => {
  const fallbackImage = './poster-unavailable.png'

  let html = `
      <div class="movie-item">
        <img class="movie-poster" 
          src="${movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : fallbackImage}" 
          onerror="this.src='${fallbackImage}'; this.onerror=null;"
          alt="${movie.Title} poster"/>
        <div class="movie-details">
          <div class="movie-row-1">
            <h3>${movie.Title}</h3>
            <i class="fa fa-star"></i>
            <h4 class="rating">${movie.imdbRating}</h4>
          </div>
          <div class="movie-row-2">
            <h4>${movie.Runtime}</h4>
            <h4>${movie.Genre}</h4>
            <div class="watchlist-container">
              <i class="fa-solid fa-circle-plus"></i>
              <h4>Watchlist</p>
            </div>
          </div>
          <p class="movie-summary">${movie.Plot}</p>
          </div>
        </div>
      </div>
  `
  movieContainer.innerHTML += html
} 