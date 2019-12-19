var exphbs = require("express-handlebars");
var express = require("express");
var mongojs = require("mongojs");
var axios = require("axios");
var cheerio = require("cheerio");

var app = express();

var PORT = process.env.PORT || 8080;

app.use(express.static("app/public"));

var databaseUrl = "apScraper";
var collections = ["articles"];

var db = mongojs(databaseUrl, collections);

db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
  db.articles.find({}, function(error, found) {
    if (error) {
      console.log(error);
    } else {
      res.render("index", { articles: found });
    }
  });
  // res.render("index", { quotes: data });
});

app.get("/scrape", function(req, res) {
  db.articles.drop();

  axios.get("https://www.androidpolice.com/").then(function(response) {
    console.log(
      "\nStatus Code: " + response.status + ", " + response.statusText + "\n"
    );
    var $ = cheerio.load(response.data);

    var newArray = [];

    $(".post").each(function(i, element) {
      var title = $(element)
        .children(".post-header")
        .children("h2")
        .text();

      var link = $(element)
        .children(".post-header")
        .children("h2")
        .children("a")
        .attr("href");

      var author = $(element)
        .children(".post-header")
        .children(".post-meta")
        .children(".post-author")
        // .children("a")
        .text();

      var timeStamp = $(element)
        .children(".post-header")
        .children(".post-meta")
        .children(".post-date-time")
        .children("time")
        // .next()
        // .children("time")
        .text()
        .slice(10, 18)
        .trim();

      var snippet = $(element)
        .children($(".post-content"))
        .children("p")
        .text();

      var itemObject = {
        title: title,
        link: link,
        author: author,
        timeStamp: timeStamp,
        snippet: snippet
      };

      newArray.push(itemObject);

      if (title && snippet) {
        db.articles.insert(
          {
            title: title,
            link: link,
            author: author,
            timeStamp: timeStamp,
            snippet: snippet
          },
          function(err, inserted) {
            if (err) {
              console.log(err);
            } else {
              console.log(inserted);
            }
          }
        );
      }
    });

    res.redirect("/");
  });
});

app.listen(PORT, function() {
  console.log("Server listening on: http://localhost:" + PORT);
});
