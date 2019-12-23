var exphbs = require("express-handlebars");
var express = require("express");
var mongojs = require("mongojs");
var axios = require("axios");
var cheerio = require("cheerio");

var app = express();

var PORT = process.env.PORT || 8080;

app.use(express.static("public"));

var databaseUrl = "apScraper";
var collections = ["articles"];

var db = mongojs(databaseUrl, collections);

db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.get("/", function(req, res) {
  res.redirect("/scrape");
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
        .text();

      var timeStamp = $(element)
        .children(".post-header")
        .children(".post-meta")
        .children(".post-date-time")
        .children("time")
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
        snippet: snippet,
        saved: false
      };

      newArray.push(itemObject);

      if (title && snippet) {
        db.articles.insert(
          {
            title: title,
            link: link,
            author: author,
            timeStamp: timeStamp,
            snippet: snippet,
            saved: false
          },
          function(err, inserted) {
            if (err) {
              console.log(err);
            }
          }
        );
      }
    });

    res.redirect("/find");
  });
});

app.get("/find", function(req, res) {
  db.articles.find({}, function(error, found) {
    if (error) {
      console.log(error);
    } else {
      res.render("index", { articles: found });
    }
  });
});

app.get("/clear", function(req, res) {
  db.articles.drop();
  res.redirect("/find");
});

app.get("/saved", function(req, res) {
  db.articles.find({ saved: true }, function(error, found) {
    if (error) {
      console.log(error);
    } else {
      res.render("saved", { articles: found });
    }
  });
});

app.post("/api/saved", function(req, res) {
  var title = req.body.title;

  db.articles.findAndModify(
    {
      query: { title: title },
      update: { $set: { saved: true } }
    },
    function(err, doc, lastErrorObject) {
      console.log("article saved");
    }
  );
});

app.post("/api/delete", function(req, res) {
  var title = req.body.title;
  // res.redirect("/saved");

  db.articles.findAndModify(
    {
      query: { title: title },
      update: { $set: { saved: false } }
    },
    function(err, doc, lastErrorObject) {
      console.log("article deleted");
    }
  );
});

app.listen(PORT, function() {
  console.log("Server listening on: http://localhost:" + PORT);
});
