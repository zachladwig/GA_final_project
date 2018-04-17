var sentiment = require('node-sentiment');
var math = require('mathjs');


let sources = ['abc-news','cnn','fox-news','cnbc']
let endDate = '2018-03-15'
let startDate = '2018-03-11'
let newsApiBaseUrl = `https://accesscontrolalloworiginall.herokuapp.com/https://newsapi.org/v2/everything?apiKey=a3cc5c9a78684254890806d68909de6e&pageSize=5&from=${startDate}&to=${endDate}&sources=`

$(document).ready(function() {
  $(".row").html('');
  getSources();
  sources.forEach(function(source) {
    getNews(newsApiBaseUrl, source);
  })
});

function getSources() {
  let url = 'https://accesscontrolalloworiginall.herokuapp.com/https://newsapi.org/v2/sources?apiKey=a3cc5c9a78684254890806d68909de6e'

  return $.get(url, function(data) {
    console.log('data requested niche');
    console.log(data.sources)
  })
  .then(function(data) {
    let newsSources = ['fox-news', 'associated-press', 'bloomberg', 'cbs-news', 'cnn', 'bbc-news', 'abc-news', 'espn', 'financial-post', 'newsweek', 'the-washington-post', 'the-wall-street-journal']
    let realNews = [];
    data.sources.forEach(function(el) {
      if(newsSources.includes(el.id)) {
        realNews.push(el);
      }
    })
    return realNews;
  })
  .then(function(data) {
    showSources(data);
  })
}

function showSources(data) {
  let $listSources = $('#sources')
  data.forEach(function(el) {
    $listSources.append(`<a class="dropdown-item" href = "#">${el.name}</a>`)
  })
}


function getNews(url, source) {
  return $.get(url+source, function(data) {
      console.log('data requested');
    })
    .then(function(data) {
      console.log(data);
      return sortNews(data, source);
    })
    .then(function (data) {
      return showData(data)
    })
    .fail(function () {
      console.log('whyyyy');
    })
};

function sortNews(data, source) {
  let allArticles = []

  let scores = []
  data.articles.forEach(function(e) {

    let article = {
      title: e.title,
      description: e.description,
      urlToImage: e.urlToImage,
      url: e.url,
      source: e.source.name,
      sentimentTitle: sentiment(e.title).comparative,
      sentimentDescription: sentiment(e.description).comparative
    }

    scores.push(sentiment(e.description).comparative);
    allArticles.push(article);
  });

  let sourceInfo = {
    articles: allArticles,
    name: source,
    score: math.mean(scores)
  }
  console.log(sourceInfo);
  return sourceInfo;
}

function showData(data) {
  let $sourceName = $("<div>").text(data.name).addClass("col-md-3").addClass('title').addClass(`${data.name}`);
  let emojiUrl = getEmoji(data.score);
  let $emojiScore = $("<img>").attr('src', emojiUrl).addClass('emoji');

  let $score = $("<p>").text(math.round(data.score,3))
  $('.row').append($sourceName);
  $(`.${data.name}`).append($emojiScore);
  $(`.${data.name}`).append($score);

  data.articles.forEach(function(e) {
      let roundedScore = math.round(e.sentimentDescription,3)
      $article = $("<p>").text(`${e.title} : ${roundedScore}`).addClass("article");
      $(`.${data.name}`).append($article);
  });
};

function getEmoji(data) {
  let happy = 'http://www.emoji.co.uk/files/apple-emojis/smileys-people-ios/6-smiling-face-with-open-mouth-and-smiling-eyes.png'
  let sad =  'https://cdn.shopify.com/s/files/1/1061/1924/files/Sad_Face_Emoji.png?9898922749706957214'
  let neutral = 'http://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-11/256/neutral-face.png'
  if(data > 0.1) {
    return happy;
  }
  else if(data > -0.1) {
    return neutral;
  }
  else {
    return sad;
  }
}
