var sentiment = require('node-sentiment');
var math = require('mathjs');
var moment = require('moment');


let sources = ['abc-news','cnn','fox-news','bbc-news']

$(document).ready(function() {
  $(".newsSource").remove();
  getSources();
  dbSearches.get()
  $("#submit").on('click', function(event) {
    $(".newsSource").remove();
    let date = $("#date").val();
    let search = $("#search").val();
    sources.forEach(function(source) {
      getNews(getUrl(source, date, date, search));
    })
    dbSearches.add(search);
    dbSearches.get()
  })
});

function getSources() {
  let url = 'https://accesscontrolalloworiginall.herokuapp.com/https://newsapi.org/v2/sources?apiKey=c1539b29d33348d4a4e4b681623d9e0e'

  return $.get(url, function(data) {
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
  let apiKey = 'c1539b29d33348d4a4e4b681623d9e0e'
  let pageSize = 30;
  let language = 'en'
  let newsApiBaseUrl = 'https://accesscontrolalloworiginall.herokuapp.com/https://newsapi.org/v2/everything?'
  let qEncoded = encodeURI(q);
  let sortBy = 'relevancy'
  return `${newsApiBaseUrl}apiKey=${apiKey}&pageSize=${pageSize}&from=${startDate}&to=${endDate}&sources=${source}&q=${qEncoded}&sortBy=${sortBy}&language=${language}`
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
      sentimentDescription: sentiment(e.description).comparative,
      publishedAt: e.publishedAt
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
  let emojiUrl = getEmoji(data.score);

  let sourceSummary = `
  <div class="col-md newsSource title ${data.sourceId}">
    <div class="summaryContainer">
      <p>${data.sourceName}</p>
      <img src= ${emojiUrl} class="emoji"/>
    </div>
    <div class="articlesContainer ${data.sourceId}"></div>
  </div>
  `

  let $score = $("<p>").text(math.round(data.score,3))
  $('#news').append(sourceSummary);

  data.articles.forEach(function(e, i) {

    let articleTime = moment(e.publishedAt).format('LLL');

    if(i < 5) {
      let roundedScore = math.round(e.sentimentDescription,3);
      let articleEmoji = getEmoji(e.sentimentDescription);

      let article = `
      <article class="article newsSource">
        <p class="articleContent">
          <a href=${e.url}>
          ${e.title} : ${roundedScore}
          </a>
        </p>
        <img src=${articleEmoji} class="articleEmoji"/>
        <p class="articleTime">${articleTime}</p>
      </article>
      `
      $(`.${data.sourceId}.articlesContainer`).append(article);
    }
  });
};

function getEmoji(data) {
  let happy = 'http://www.emoji.co.uk/files/apple-emojis/smileys-people-ios/6-smiling-face-with-open-mouth-and-smiling-eyes.png'
  let sad =  'https://cdn.shopify.com/s/files/1/1061/1924/files/Sad_Face_Emoji.png?9898922749706957214'
  let neutral = 'https://clipart.info/images/ccovers/1496184263Neutral-Emoji-Png-transparent-background.png'
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

let dbSearches = (function() {

  var config = {
      apiKey: "AIzaSyDcEm6il1VMxplKg-nt8B5OqNAa1kfM-sA",
      authDomain: "finalprojectg-502ca.firebaseapp.com",
      databaseURL: "https://finalprojectg-502ca.firebaseio.com",
      projectId: "finalprojectg-502ca",
      storageBucket: "finalprojectg-502ca.appspot.com",
      messagingSenderId: "124909742480"
    };
  firebase.initializeApp(config);
  var database = firebase.database();

  function getTopSearches() {
    let wordMap = {};
    var searchesRef = database.ref('searches');
    searchesRef.on('value', function(results) {
      let allSearches = results.val();
      for(let search in allSearches) {
        if(allSearches[search] === '') {
        }
        else if(allSearches[search] in wordMap) {
          wordMap[allSearches[search]]++
        }
        else {
          wordMap[allSearches[search]] = 1;
        }
      }
      let topSearches = Object.keys(wordMap).sort(function(a,b){return wordMap[b]-wordMap[a]}).slice(0,5)
      showTopSearches(topSearches);
    })
  }

  function showTopSearches(data) {
    $("#trending p").html('');
    data.forEach(function(el, i) {
      let searchTerm = `<p class="searchTerm"><a href='#'>${el}</a></p>`
      $('#trending').append(searchTerm);
    })
  }

  function addSearch(data) {
    const searchesReference = database.ref('searches');
    searchesReference.push(data.replace(/ /g,'').toLowerCase());
  }

  return {
    get: getTopSearches,
    add: addSearch
  }
})();
