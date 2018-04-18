var sentiment = require('node-sentiment');
var math = require('mathjs');
var moment = require('moment');


let sources = ['abc-news','cnn','fox-news','bbc-news']

$(document).ready(function() {
  $(".row").html('');
  getSources();

  $("#submit").on('click', function(event) {
    $('.row').html('');
    let date = $("#date").val();
    let search = $("#search").val();
    // startDate = $("#startdate").val();
    sources.forEach(function(source) {
      getNews(getUrl(source, date, date, search));
    })
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

function getUrl(source, endDate, startDate, q) {
  let apiKey = 'a3cc5c9a78684254890806d68909de6e'
  let pageSize = 5;
  let newsApiBaseUrl = 'https://accesscontrolalloworiginall.herokuapp.com/https://newsapi.org/v2/everything?'
  let qEncoded = encodeURI(q);
  let sortBy = 'relevancy'
  return `${newsApiBaseUrl}apiKey=${apiKey}&pageSize=${pageSize}&from=${startDate}&to=${endDate}&sources=${source}&q=${qEncoded}&sortBy=${sortBy}`
}

function getNews(url) {
  return $.get(url, function(data) {
      console.log('data requested');
      console.log(url);
    })
    .then(function(data) {
      console.log(data);
      return sortNews(data);
    })
    .then(function (data) {
      return showData(data)
    })
    .fail(function () {
      console.log('whyyyy');
    })
};

function sortNews(data) {
  let allArticles = []

  let scores = []
  data.articles.forEach(function(e) {

    let article = {
      title: e.title,
      description: e.description,
      urlToImage: e.urlToImage,
      url: e.url,
      sourceName: e.source.name,
      sourceId: e.source.id,
      sentimentTitle: sentiment(e.title).comparative,
      sentimentDescription: sentiment(e.description).comparative
    }

    scores.push(sentiment(e.description).comparative);
    allArticles.push(article);
  });

  let sourceInfo = {
    articles: allArticles,
    sourceName: allArticles[0].sourceName,
    sourceId: allArticles[0].sourceId,
    score: math.mean(scores)
  }
  console.log(sourceInfo);
  return sourceInfo;
}

function showData(data) {
  let $sourceName = $("<div>").text(data.sourceName).addClass("col-md-3").addClass('title').addClass(`${data.sourceId}`);
  let emojiUrl = getEmoji(data.score);
  let $emojiScore = $("<img>").attr('src', emojiUrl).addClass('emoji');

  let $score = $("<p>").text(math.round(data.score,3))
  $('.row').append($sourceName);
  $(`.${data.sourceId}`).append($emojiScore);
  $(`.${data.sourceId}`).append($score);

  data.articles.forEach(function(e) {
      let roundedScore = math.round(e.sentimentDescription,3)
      $article = $("<p>").text(`${e.title} : ${roundedScore}`).addClass("article");
      $(`.${data.sourceId}`).append($article);
  });
};

function getEmoji(data) {
  let happy = 'http://www.emoji.co.uk/files/apple-emojis/smileys-people-ios/6-smiling-face-with-open-mouth-and-smiling-eyes.png'
  let sad =  'https://cdn.shopify.com/s/files/1/1061/1924/files/Sad_Face_Emoji.png?9898922749706957214'
  let neutral = 'http://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-11/256/neutral-face.png'
  if(data > 0.05) {
    return happy;
  }
  else if(data > -0.05) {
    return neutral;
  }
  else {
    return sad;
  }
}
