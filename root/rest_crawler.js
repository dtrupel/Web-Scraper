const axios = require("axios").default;
const axiosCookieJarSupport = require("axios-cookiejar-support").default;

module.exports.crawlRestaurant = function crawlRestaurant(url, day) {

  axiosCookieJarSupport(axios);

  return getBody(url).then(html => {
    const dom = createJSDOM(html);
    const submit = dom.window.document.getElementsByName("submit");
    const theUrl = getUrl(url, submit[0].value);
    const options = sendLoginRequest(theUrl).then(res => {
      return getOptions(res, day);
    })

    return options.then(ops => {
      let times = [];
      for(let i = 0; i < ops.length; i++) {
        let string = ops[i].value;
        times[i] = string.substring(3, 5) +
          "-" + string.substring(5, 7);
      }
      return times;
    })
  })
}

function getOptions(res, day) {
  const divName = getDivByDay(day);
  const dom = createJSDOM(res.data);
  return dom.window.document.querySelector("."+divName).
    querySelectorAll("." + "MsoNormal" + " input[name='group1']");
}

function getDivByDay(day) {

  switch(day) {
    case "Friday": return "WordSection2";
    case "Saturday": return "WordSection4";
    case "Sunday": return "WordSection6";
  }
}

async function sendLoginRequest(url) {

  const uname = 'zeke';
  const pw = 'coys';

  return await axios.post(url, {
    username: uname,
    password: pw
  }, {
    jar: true,
    withCredentials: true,
  }).then(auth => {
    return auth;
  }).catch(e => {
    return e;
  })

}

function getUrl(url, appendix) {
  return url + "/" + appendix;
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
