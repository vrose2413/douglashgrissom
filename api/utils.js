const unirest = require("unirest");
const { headers } = require("./constants.js");

const curlContent = async (url) => {
  return new Promise((resolve, reject) => {
    let dataBody = "";
    unirest
      .request({
        uri: url,
        headers: headers,
        gzip: true,
      })
      .on("error", (error) => {
        resolve("err");
      })
      .on("data", (data) => {
        dataBody += data;
      })
      .on("end", () => {
        resolve(dataBody);
      });
  });
};

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const ucwords = (str) => {
  let strVal = [];
  str = str.split(" ");
  for (var chr = 0; chr < str.length; chr++) {
    strVal[chr] =
      str[chr].substring(0, 1).toUpperCase() +
      str[chr].substring(1, str[chr].length);
  }
  return strVal.join(" ");
};

const limitWords = (str, int) => {
  str = str.split(" ");
  if (str.length <= int) {
    return str.join(" ");
  } else {
    let res = [];
    for (let i = 0; i < int; i++) {
      res.push(str[i]);
    }
    return res.join(" ");
  }
};

module.exports = { curlContent, sleep, ucwords, limitWords };
