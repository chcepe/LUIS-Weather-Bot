const axios = require("axios");
const translate = require("@vitalets/google-translate-api");

async function getWeatherForecast(city, date = "", usedLanguage) {
  var woeid = "",
    cityName = "";
  return axios
    .get(`https://www.metaweather.com/api/location/search/?query=${city}`)
    .then(response => {
      woeid = response.data[0].woeid;
      cityName = response.data[0].title;
      yyyymmdd = date
        ? date
            .toISOString()
            .replace(/-/g, "/")
            .split("T")[0]
        : "";
      return axios.get(
        `https://www.metaweather.com/api/location/${woeid}/${yyyymmdd}`
      );
    })
    .then(async response => {
      let data = response.data;
      let engResponse = "";
      // console.log(data);
      if (date == "") {
        let min_weather = data.consolidated_weather[0].min_temp.toFixed(2);
        let max_weather = data.consolidated_weather[0].max_temp.toFixed(2);
        engResponse = `The temperature today in ${cityName} will be between ${min_weather} and ${max_weather} degree celsius.`;
      } else {
        let min_weather = data[0].min_temp.toFixed(2);
        let max_weather = data[0].max_temp.toFixed(2);
        let options = {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        };
        date = date.toLocaleDateString("en-US", options);
        engResponse = `The temperature on ${date} in ${cityName} is between ${min_weather} and ${max_weather} degree celsius.`;
      }
      return usedLanguage == "en"
        ? engResponse
        : await translate(engResponse, { to: usedLanguage });
    })
    .catch(error => {
      consoleLog(error);
      return `Can't get the weather information in ${city} at the moment.`;
    });
}

const consoleLog = text => {
  if (!text) return false;
  console.log("=====================================\n\n");
  console.log(text);
  console.log("\n\n=====================================\n\n");
};

module.exports.getWeatherForecast = getWeatherForecast;
module.exports.consoleLog = consoleLog;
