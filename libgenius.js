/*
Name: Daniel Fonseca Yarochewsky
This app searches and displays results of films available at UW Library
Special Collections
*/

// last updated 3:29

(function() {

  "use strict";

  var API_SITE = "https://cdm16786.contentdm.oclc.org/utils/";
  var collectionName = "filmarch";

  var $ = function(id) { return document.getElementById(id); };
  var qs = function(query) { return document.querySelector(query); };

  window.onload = function() {
    $("go-search").disabled = true;
    $("go-search").onclick = search;
    $("query").focus();
    $("query").addEventListener("keyup", function(event) {
      if(event.keyCode == 13) {
        search();
      }
    });
    $("query").onkeydown = checkText;
  };


  function checkText() {
    if($("query").value) {
      $("go-search").disabled = false;
    } else {
      $("go-search").disabled = true;
    }
  }

  // searches for matches of the typed string on the special collections
  // database.
  function search() {
    var queryString = $("query").value;
    if(queryString) {
      setResultsView();
      $("loading").classList.remove("hidden");
      var collectionInfo = getCollectionSize(collectionName);
      collectionInfo
        .then(function(collectionSize) {
          var items = retrieveRecords(queryString, collectionName,
                                      collectionSize);
          items
            .then(function(matches) {
              $("records").innerHTML = ""; //clear previous results, if any
              // dispplay number of records found
              var resultsPhrasing = " results";
              if(matches.records.length == 1) {
                resultsPhrasing = " result";
              }
              $("number-found").innerHTML = matches.records.length + resultsPhrasing;
              for(var i = 0; i < matches.records.length; i++) {
                populateResults(matches.records[i]);
              }
              // populateResults(matches.records);
              $("loading").classList.add("hidden"); // stop loading animation
              // unlock UI for new search
              $("query").disabled = false;
              $("query").value = "";
            })
            .catch(function(error) {
              $("results").innerHTML = ("Error while retrieving search results:" + error);
            });
        })
        .catch(function(error) {
          $("results").innerHTML = ("Error while computing collection size: " + error);
        })
    }
  }

  // disable UI elements to prepare to show the reuslts from the query.
  function setResultsView() {
    $("titles").classList.add("hidden");
    $("query").disabled = true;
    $("go-search").disabled = true;
    $("copyright").classList.add("footer-results-mode");
    $("searcharea").classList.add("results-mode");
    $("results").classList.remove("hidden");
    $("query").classList.remove("search-onboard-mode");
    $("query").classList.add("search-results-mode");
    $("beta").classList.remove("hidden");
    document.body.style.backgroundImage = "none";
  }

  function populateResults(item) {
    var title = item.title;

    var itemContainer = document.createElement("div");
    itemContainer.classList.add("record");

    var image = new Image();
    image.onload = function() {
      itemContainer.style.backgroundImage = "url(" + image.src + ")";
      $("records").appendChild(itemContainer);
    };
    var imagePath = "https://cdm16786.contentdm.oclc.org/utils/getthumbnail/collection/filmarch/id/" + item.pointer + "/json";
    image.src = imagePath;

    var itemContainerTitle = document.createElement("span");
    var overlay = document.createElement("div");
    overlay.classList.add("record-title-overlay");
    itemContainer.appendChild(overlay);
    itemContainerTitle.innerHTML = title;
    itemContainerTitle.classList.add("record-title");
    overlay.appendChild(itemContainerTitle);

    // either display custom description by archivist, or original description
    // if the former is not available
    var description = item.clip ? item.clip : item.filmvi;
    description = description ? description : "no description available for this clip.";
    var itemContainerDescription = document.createElement("div");
    itemContainerDescription.classList.add("record-description");

    var descriptionText = document.createElement("p");
    descriptionText.innerHTML = description;
    descriptionText.classList.add("record-description-text");
    itemContainerDescription.appendChild(descriptionText);

    itemContainer.appendChild(itemContainerDescription);

    var info = document.createElement("div");
    info.classList.add("modal");
    info.classList.add("hidden");

    // insert animation inside modal to show loading...
    var modalLoadingAnimation = document.createElement("img");
    modalLoadingAnimation.src = "loader.gif";
    modalLoadingAnimation.classList.add("hidden");
    info.appendChild(modalLoadingAnimation);

    var openButton = document.createElement("button");
    openButton.textContent = "More";
    openButton.classList.add("modal-open");

    var modalContent = null;

    openButton.onclick = function() {
      info.classList.toggle("hidden");
      modalLoadingAnimation.classList.toggle("hidden");
      if(modalContent) {
        modalLoadingAnimation.classList.toggle("hidden");
      } else {
        var itemMetadata = getItemInfo(collectionName, item.pointer);
        itemMetadata
          .then(function(response) {
            modalContent = document.createElement("div");
            modalContent.classList.add("modal-content");
            var content = {};
            content['Summary'] = response.clip;
            content['Duration'] = response.durati;
            content['Source of the Clip'] = response.creato;
            content['Participants/Performers'] = response.partic;
            content['Notes'] = response.notes;
            content['Subjects (LCSH)'] = response.subjea;
            content['Location Depicted'] = response.locati;
            content['Date Created'] = response.type;
            content['Language'] = response.langub;
            content['Digital Collection'] = response.digita;
            content['Order Number'] = response.order;
            content['Ordering Information'] = response.orderi;
            content['Repository'] = response.reposi;
            content['Repository Collection'] = response.reposa;
            content['Repository Collection Guide'] = response.reposb;
            content['Digital Reproduction Information'] =  response.digitb;
            content['Rights'] = response.righta;
            content['Type'] = response.typa;
            var titleSpan = document.createElement("div");
            titleSpan.innerHTML = title;
            titleSpan.classList.add("clip-title");
            modalContent.appendChild(titleSpan);

            var metadata = document.createElement("table");

            var contentKeys = Object.keys(content);
            for(var i = 0; i < contentKeys.length; i++) {
              // add data if it's and object, and it has any data, or
              // if it's just a string
              if((content[contentKeys[i]].constructor == Object &&
                  Object.keys(content[contentKeys[i]]).length) ||
                  (content[contentKeys[i]].constructor == String)) {
                var item = document.createElement("tr");
                var category = document.createElement("td");
                category.innerHTML = contentKeys[i];
                item.appendChild(category);
                var categoryText = document.createElement("td");
                var contentString = content[contentKeys[i]];
                var patternSite = /http(s)?:\/\/www(\.[a-z]*)*([\/a-z\._])*/i;
                var matchedSite = patternSite.exec(contentString);
                // insert links on the content text where appropriate
                if(matchedSite) {
                  var linkedText = ("<a href=" + matchedSite[0] + " >" +
                                    matchedSite[0] + "</a>");
                  contentString = contentString.replace(patternSite, linkedText);
                }
                categoryText.innerHTML = contentString;
                item.appendChild(categoryText);
                metadata.appendChild(item);
              }
            }
            modalContent.appendChild(metadata);
            info.appendChild(modalContent);
            modalLoadingAnimation.classList.toggle("hidden");
          })
          .catch(function(error) {
            console.log(error);
          });
      }
    };


    var playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.classList.add("modal-open");

    var videoSrc = play(item.pointer);
    var video = document.createElement("video");
    video.autoPlay = true;
    video.controls = true;
    video.classList.add("hidden");
    info.appendChild(video);


    playButton.onclick = function() {
      if(modalContent) { // if play is clicked before more...
        modalContent.classList.add("hidden");
      }
      modalLoadingAnimation.classList.remove("hidden");
      video.src = videoSrc;
      video.addEventListener("loadeddata", function() {
        modalLoadingAnimation.classList.add("hidden");
        video.classList.remove("hidden");
        video.play();
      });
      info.classList.toggle("hidden");
    };

    itemContainerDescription.appendChild(playButton);

    var closeButton = document.createElement("button");
    closeButton.classList.add("modal-close");
    closeButton.onclick = function() {
      info.classList.toggle("hidden");
      if(modalContent) {
        modalContent.classList.add("hidden");
      }
      video.pause();
      video.src = "";
      // video.stopVideo();
      video.classList.add("hidden");
    };
    info.appendChild(closeButton);

    var downloadButton = document.createElement("button");
    downloadButton.textContent = "Download";
    downloadButton.classList.add("modal-open");
    itemContainerDescription.appendChild(downloadButton);
    downloadButton.onclick = function() {
      download(item.pointer);
    };
    itemContainerDescription.appendChild(openButton);
    itemContainer.appendChild(info);
  }


  // plays the video stream of the given item id
  function play(itemId) {
    var endpointString = ("getstream/collection/filmarch/id/" + itemId);
    var videoUrl = API_SITE + endpointString;
    return videoUrl;
  }

  // downloads a video, given an id for the item
  function download(itemId) {
    var endpointString = ("getfile/collection/filmarch/id/" + itemId);
    var fileSource = API_SITE + endpointString;
    window.location = fileSource;
  }

  // MAKE THIS SEARCH SMARTER!!! SEARCH FOR "OR" INSTEAD OF AND TO FIND BETTER RESULTS
  // given a query string, searches for the record that matches the parameters,
  // and if successful, returns an object with the item's pointer, filetype,
  // and find property.
  function retrieveRecords(queryString, collectionName, collectionSize) {
    var endpointString = ("dmQuery/" + collectionName + "/CISOSEARCHALL^"
                          + queryString + "^all^and/!title!clip!filmvi/nosort/"
                          + collectionSize + "/0/1/0/1//0/0/0/json"
                          );
    var requestRecord = new AjaxGetPromise("server.php?url=" + endpointString);
    return requestRecord
      .then(function(response) {
        return JSON.parse(response);
      })
      .catch(function(error) {
        return error;
      });
  }

  // given a collection name, retrieves how many items are there
  function getCollectionSize(collectionName) {
    var endpointString = ("dmQuery/" + collectionName + "/json");
    var getCollectionInfo = new AjaxGetPromise("server.php?url=" + endpointString);
    return getCollectionInfo
      .then(function(response) {
        var records = JSON.parse(response).pager.total;
        return records;
      })
      .catch(function(error) {
        return error;
      });
  }

    function getItemInfo(collectionName, itemPointer) {
      var endpointString = ("dmGetItemInfo/" + collectionName + "/" +
                            itemPointer + "/json");
      var itemRequest = new AjaxGetPromise("server.php?url=" + endpointString);
      return itemRequest
        .then(function(response) {
          return JSON.parse(response);
        })
        .catch(function(error) {
          return error;
        });
    }

})();
