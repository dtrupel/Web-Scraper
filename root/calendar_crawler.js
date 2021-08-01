
const axios = require("axios");

module.exports.crawlCalendar = function crawlCalendar(url) {

  return getBody(url).
  then(
    html => {
      const dom = createJSDOM(html);
      return dom.window.document.getElementsByTagName("a");}).
  then(
    anchors => {
      return crawlSchedule(url, anchors, 0, [1, 1, 1]);
    }
  ).then(schedule => {
    return days(available(schedule));
  });

}

function crawlSchedule(url, anchors, index, pos) {

  if(index === pos.length)
    return pos;

  const newUrl = url + "/" + anchors[index].href;
  let positions = getBody(newUrl).then(
    html => {
      const dom = createJSDOM(html);
      return dom.window.document.getElementsByTagName("td")
    }).then(
    cells => {
      pos[crawlTable(cells, cells.length)] = 0;
      return pos;
    })

  index += 1;

  return positions.then(p => {
    return crawlSchedule(url, anchors, index, p);
  })
}

function crawlTable(cells, length) {
  let i = 0;
  while(i < length) {
    if(cells[i].innerHTML.toUpperCase() !== "OK") {
      return i;
    }
    i++;
  }
  return -1;
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

function available(schedule) {
  const pos = []
  let index = 0;
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i] === 1) {
      pos[index++] = i;
    }
  }
  return pos;
}

function days(positions) {
  let days = [];
  let index = 0;
  for(let i = 0; i < positions.length; i++) {
    switch(positions[i]) {
      case 0:
        days[index++] = "Friday";
        break;
      case 1:
        days[index++] = "Saturday";
        break;
      case 2:
        days[index++] = "Sunday";
    }
  }
  return days;
}