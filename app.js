const restify = require("restify");
const builder = require("botbuilder");
const translate = require("@vitalets/google-translate-api");
const chrono = require("chrono-node");
const methods = require("./methods");

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  methods.consoleLog(`${server.name} listening to ${server.url}`);
});

const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
});

server.post("/api/messages", connector.listen());
const bot = new builder.UniversalBot(connector, "/");
const LuisModelUrl = ""; //https://westus.api.cognitive.....
const luisRecognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(luisRecognizer);
const luisIntents = new builder.IntentDialog({
  recognizers: [luisRecognizer],
  intentThreshold: 0.5
}).onDefault("/none");
bot.dialog("/", luisIntents);

var usedLanguage = "en";
bot.use({
  botbuilder: function(session, next) {
    session.send();
    session.sendTyping();
    next();
  },
  receive: (e, next) => {
    translate(e.text, { to: "en" })
      .then(res => {
        usedLanguage = res.from.language.iso;
        e.text = res.text;
        methods.consoleLog(`USED LANG: ${usedLanguage}`);
        next();
      })
      .catch(err => {
        methods.consoleLog(err);
        next();
      });
  }
});

bot.dialog("/none", [
  session => {
    session.send("Sorry, I don't know. This is the default dialog");
    session.endDialog();
  }
]);

bot
  .dialog("/greetings", [
    session =>
      session.endDialog([
        "Hello there, I'm a bot! You can ask me the weather information in  any location using your native language. ;)",
        "What's up? I'm a bot! You can ask me the weather information in any location using your native language. ;)"
      ])
  ])
  .triggerAction({
    matches: /\b(hello|hi|howdy)\b/i
  });

luisIntents.matches("WeatherInCity", [
  async (session, args) => {
    session.sendTyping();
    let CityName = builder.EntityRecognizer.findEntity(
      args.entities,
      "CityName"
    );
    if (CityName) {
      let weatherInfo = await methods.getWeatherForecast(
        CityName.entity,
        "",
        usedLanguage
      );
      session.send(weatherInfo);
    } else {
      session.beginDialog("/none");
    }
  }
]);

luisIntents.matches("WeatherInCityWithDate", [
  async (session, args) => {
    session.sendTyping();
    let CityName = builder.EntityRecognizer.findEntity(
      args.entities,
      "CityName"
    );
    let DateCalendar = builder.EntityRecognizer.findEntity(
      args.entities,
      "DateCalendar"
    );
    if (CityName && DateCalendar) {
      var dateParser = chrono.parse(DateCalendar.entity);
      console.log(dateParser);
      var date = dateParser[0].start.date();
      let weatherInfo = await methods.getWeatherForecast(
        CityName.entity,
        date,
        usedLanguage
      );
      session.send(weatherInfo);
    } else {
      session.beginDialog("/none");
    }
  }
]);
