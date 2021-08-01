const axios = require("axios");

module.exports.crawlCinema = function crawlCinema(url, dayName) {
  return getBody(url).then(html => {
    const dom = createJSDOM(html);
    const day = detectDay(dayName);
    const movieSelections = dom.window.document.getElementById("movie");
    let movieValues = [];
    let movies = [];
    for(let i = 1; i < movieSelections.length; i++) {
      movieValues[i - 1] = movieSelections[i].value;
      movies[i-1] = movieSelections[i].innerHTML;
    }

    return crawlMovies(url, day, movieValues, movieSelections.length-1, 0, [[],[],[]]).then(positions => {
      return getMap(movies, positions);
    })
  })

}

function getMap(movies, positions) {

  const map = new Map();
  const timedPositions = translateTimes(positions);
  for(let i = 0; i < movies.length; i++) {
    map.set(movies[i], timedPositions[i]);
  }
  return map;
}

function translateTimes(positions) {
  const realTimes = [16, 18, 21];
  const movieTimes = [[], [], []];
  for(let i = 0; i < positions.length; i++) {
    for(let j = 0; j < positions.length; j++) {
      if(positions[i][j] === 0)
        movieTimes[i][j] = 0;
      else
        movieTimes[i][j] = realTimes[j];
    }
  }
  return movieTimes;
}

function detectDay(name) {
  switch(name) {
    case 'Friday': return '05';
    case 'Saturday': return '06';
    case 'Sunday': return '07';
    default:
      return null;
  }
}

function crawlMovies(url, day, movies, length, index, pos) {

  if(index === pos.length)
    return pos;

  let newUrl = url + "/check?day="+day+"&movie="+movies[index];
  const positions = getBody(newUrl).then(p => {
    return crawlAvailableTimes(p, length, [0, 0, 0]);
  }).then(movieTimes => {
    pos[index-1] = movieTimes;
    return pos;
  });

  index += 1;

  return positions.then(p => {
    return crawlMovies(url, day, movies, length, index, p);
  })

}

function crawlAvailableTimes(json, length, positions) {
  let i = 0;
  while(i < length) {
    if(json[i].status === 1) {
      positions[i] = 1;
    }
    i++;
  }
  return positions;
}

function createJSDOM(body) {
  const jsdom = require("jsdom");
  const { JSDOM } = jsdom;
  return new JSDOM(body);
}

async function getBody(url) {
  const response = await axios.get(url);
  return response.data;
}

