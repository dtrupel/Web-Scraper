const axios = require("axios");

const crawlCalendar = require("./calendar_crawler.js");
const crawlCinema = require("./cinema_crawler.js");
const crawlRestaurant = require("./rest_crawler.js");

module.exports.run = function scrape(url) {

  getBody(url).then(html => {
    return getAnchors(html);
  }).then(anchors => {
    const days = crawlCalendar.crawlCalendar(anchors[0].href);
    const final = days.then(days => {
      printStatus();
      return iterate(anchors, days, 0, null, []);
      })
    final.then(res => {
      printRecommendations(res)
    })
    })

}

function printStatus() {
  process.stdout.write("Crawling calendar.....");
  sleep(0.5);
  process.stdout.write(" OK");
  console.log()
  process.stdout.write("Crawling showtimes.....");
  sleep(0.5);
  process.stdout.write(" OK")
  console.log()
  process.stdout.write("Crawling reservations.....");
  sleep(0.5);
  process.stdout.write(" OK")
  console.log();
  sleep(1);
  process.stdout.write("RECOMMENDATIONS\n")
  process.stdout.write("==============================")
  console.log()
  sleep(0.2);
}

function sleep(seconds){
  let waitUntil = new Date().getTime() + seconds*1000;
  while(new Date().getTime() < waitUntil);
}

function iterate(anchors, days, count, schedule, list) {

  if(count >= days.length) {
    return list;
  }

  const movies = crawlCinema.crawlCinema(anchors[1].href, days[count]);
  schedule =  movies.then(movies => {
    const listMovies = movies.keys();
    const restTimes = crawlRestaurant.crawlRestaurant(anchors[2].href, days[count]);
    return restTimes.then(restTimes => {
      return getMutualSchedule(days[count], listMovies, movies, restTimes)
      })
    })

    return schedule.then(sch => {
      list[count++] = sch;
      return iterate(anchors, days, count, sch, list);
    })
}
function printRecommendations(schedule) {

  let output = "";
  let newLineFlag = true;

  let i = 0;
  while(i < schedule.length) {
    let newString = getOutput(schedule, newLineFlag, output, i);
    output += getOutput(schedule, newLineFlag, output, i).substring(4, newString.length);
    i++;
  }
  console.log(output);

}

function getOutput(schedule, output, newLineFlag, index) {
  const data = schedule[index]; // Get map object from the list
  const dataKeys = data.keys(); // Take all the day keys

  const theDay = dataKeys.next().value;
  const valuesForDay = data.get(theDay); // Take inner map with movie keys
  const valuesForDayKeys = valuesForDay.keys(); // Take all the movie keys

  let j = 0;

  while (j < 3) {
    const theMovie = valuesForDayKeys.next().value;
    const valuesForMovie = valuesForDay.get(theMovie); // Take inner map with starting time keys
    const values = valuesForMovie.keys();
    let k = 0;
    while (true) {
      const theTime = values.next().value;
      const restTimes = valuesForMovie.get(theTime);
      if (theTime === undefined) {
        newLineFlag = false;
        break;
      }
      k++;
      output += "On " + theDay + ', the movie "' + theMovie + '" starts at ' + theTime + ":00 and there is a free table between ";
      for (let m = 0; m < restTimes.length; m++) {
        output += restTimes[m] + ":00-" + (restTimes[m] + 2) + ":00.";
      }
      newLineFlag = true;
      output += "\n";
    }
    j++;
  }

  return output;
}

function getMutualSchedule(day, moviesIterator, moviesMap, restTimes) {

  const map = new Map();
  const movieTimesMap = new Map();

  for(let o = 0; o < 3; o++) {
    const restMovieMap = new Map();
    let nextMovie = moviesIterator.next().value;
    let movieTimes = moviesMap.get(nextMovie);
    for(let i = 0; i < movieTimes.length; i++) {
      if(movieTimes[i] === 0)
        continue;
      let restTimesForMovies = [];
      for(let j = 0; j < restTimes.length; j++) {
        let index = 0;
        const restResStart = parseInt(restTimes[j].substring(0, 2));
        if(movieTimes[i] + 2 <= restResStart)
          restTimesForMovies[index++] = restResStart;
      }
      if(restTimesForMovies.length !== 0) {
        restMovieMap.set(movieTimes[i], restTimesForMovies);
      }
    }
    movieTimesMap.set(nextMovie, restMovieMap);
  }
  map.set(day, movieTimesMap);
  return map;
}

function getAnchors(body) {
  const dom = createJSDOM(body);
  return dom.window.document.getElementsByTagName("a");
}

async function getBody(url) {
  const response = await axios.get(url);
  return response.data;
}

function createJSDOM(body) {
  const jsdom = require("jsdom");
  const { JSDOM } = jsdom;
  return new JSDOM(body);
}
