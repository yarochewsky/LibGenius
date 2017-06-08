// LibGenius is a web application for browsing movies from the University of Washington Movie
// Image Collection. It's a proof of concept redesign for the old webpage, and proposes a
// more simple and clean UX.
// Author: Daniel Fonseca Yarochewsky
// Spring '17

// last updated June 8, 11:52PM

(function() {

    "use strict";

    // update here the API urls as they change
    var API_SITE = "https://cdm16786.contentdm.oclc.org/utils/";
    var COLLECTION_NAME  = "filmarch";
    var API_SERVER = ("https://server16786.contentdm.oclc.org/dmwebservices/index.php?q=dmGetStreamingFile/" +
                      COLLECTION_NAME  + "/");

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

    // disables search button if nothing was typed in the search box
    // and enables once a query was typed
    function checkText() {
      if($("query").value) {
        $("go-search").disabled = false;
      } else {
        $("go-search").disabled = true;
      }
    }

  // searches for matches of the typed string on the special collections
  // database. Shows a count of how many items were found for this query.
  // If anything matches the query parameters, triggers a population
  // of the items in the results container.
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
              // clear previous results, if any
              $("records").innerHTML = "";
              var resultsPhrasing = (matches.records.length == 1) ?
                                     (" result" : " results");
              $("number-found").innerHTML = (matches.records.length +
                                             resultsPhrasing);
              for(var i = 0; i < matches.records.length; i++) {
                populateResults(matches.records[i]);
              }
            })
            .then(function() {
              // stop loading animation
              $("loading").classList.add("hidden");
              // unlock query textbox for new search
              $("query").disabled = false;
              // clean query textbox for new search
              $("query").value = "";
            })
            .catch(function(error) {
              $("results").innerHTML = ("Error while retrieving search results:" +
                                        error);
            });
        })
        .catch(function(error) {
          $("results").innerHTML = ("Error while computing collection size: " +
                                    error);
        });
    }
  }

  // disable UI elements to prepare to show the reuslts from the query. Mainly,
  // makes room for a result container bearing all the found items from the
  // query, and changes the query box area to the new page style of the results
  // state of the page.
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

  // takes an item object, with all the data about a clip item, and create its
  // structure, populating it with content. This function makes several calls
  // to helper functions, each with a part to compose the whole item structure,
  // including filling the item's metadata, adding donwload and play actions,
  // creating a modal window, and setting the item's background thumbnail.
  function populateResults(item) {
    var itemId = item.pointer;
    var itemContainer = document.createElement("div");
    itemContainer.classList.add("record");
    var thumbnailUrl = getThumbnailUrl(itemId);
      thumbnailUrl
        .then(function(url) {
          itemContainer.style.backgroundImage = "url(" + url + ")";
        });
        var itemContainerTitle = createItemContainerTitle(item.title);

        var overlay = createItemOverlay();
        overlay.appendChild(itemContainerTitle);
        itemContainer.appendChild(overlay);


        var itemDescription = createItemDescription(item.clip, item.filmvi);
        itemContainer.appendChild(itemDescription);

        var info = createInformationModal();

        var openButton = createOpenButton(info, item.pointer);
        itemDescription.appendChild(openButton);

        var videoElement = createVideoElement();
        info.appendChild(videoElement);

        var playButton = createPlayButton(info, videoElement, item.find, item.pointer);
        itemDescription.appendChild(playButton);

        var closeButton = createCloseButton(info, videoElement);
        info.appendChild(closeButton);

        var downloadButton = createDownloadButton(info, item.pointer);
        itemDescription.appendChild(downloadButton);

        itemContainer.appendChild(info);
        $("records").appendChild(itemContainer);
  }

  // takes an item title string, and creates an item span element, bearing
  // the title inside it. Returns the DOM span.
  function createItemContainerTitle(title) {
    var itemContainerTitle = document.createElement("span");
    itemContainerTitle.innerHTML = title;
    itemContainerTitle.classList.add("record-title");
    return itemContainerTitle;
  }

  // creates a div overlay to make the effect of the transparent hover layer
  // of an item container. Returns the DOM div overlay.
  function createItemOverlay() {
    var overlay = document.createElement("div");
    overlay.classList.add("record-title-overlay");
    return overlay;
  }

  // takes an item clip description and an item filmvi description data,
  // and creates a div container bearing a superficial summary description
  // about the item. This is to be shown when the user hovers the item,
  // so that he can decide to click on more available modal-window actions.
  // Some items have the clip but no the filmvi description, and vice-versa.
  // Give preference to the clip, and if not available, use filmvi. Returns
  // the itemContainerDescription DOM div.
  function createItemDescription(clip, filmvi) {
    var description = clip ? clip : filmvi;
    description = description ? description : "no description available for this clip.";
    var itemContainerDescription = document.createElement("div");
    itemContainerDescription.classList.add("record-description");
    var descriptionText = document.createElement("p");
    descriptionText.innerHTML = description;
    descriptionText.classList.add("record-description-text");
    itemContainerDescription.appendChild(descriptionText);
    return itemContainerDescription;
  }

  // creates the structure for the info modal. This div element bears any action
  // to be taken place inside a separate, private, and overriding modal window,
  // and includes if a video is to be played inside that window, or if more
  // detailed metadata is to be shown inside it. Returns the DOM info div.
  function createInformationModal() {
    var info = document.createElement("div");
    info.classList.add("modal");
    info.classList.add("hidden");
    var modalLoadingAnimation = document.createElement("img");
    modalLoadingAnimation.src = "loader.gif";
    modalLoadingAnimation.classList.add("hidden");
    info.appendChild(modalLoadingAnimation);
    return info;
  }

  // takes the info modal element, and an unique item idenitfier, and creates
  // the interation for the donwload button. When "Download" is clicked, the
  // page is to trigger a download action on the browser's window, saving the
  // file to the browser's default downloads folder location.
  function createDownloadButton(info, itemId) {
    var downloadButton = document.createElement("button");
    downloadButton.textContent = "Download";
    downloadButton.classList.add("modal-open");
    downloadButton.onclick = function() {
      download(itemId);
    };
    return downloadButton;
  }

  // takes the info modal element, and an unique item idenitfier, and creates
  // the interation for an open button. When "More" is clicked, further metadata
  // is to  be shown, bearing relevant information for the item, such as its full
  // description, order number, participants, dates created, and etc. Returns
  // the modalContent div container. Returns the DOM open button.
  function createOpenButton(info, itemId) {
    var openButton = document.createElement("button");
    openButton.textContent = "More";
    openButton.classList.add("modal-open");
    openButton.onclick = function() {
      info.classList.toggle("hidden");
      info.firstChild.classList.toggle("hidden");
      var modalContent = $(itemId);
      if(modalContent) {
        info.firstChild.classList.toggle("hidden");
        loadCachedContent(modalContent);
      } else {
        var createModalInformation = openMoreInformation(modalContent, itemId, info);
        createModalInformation
          .then(function(loadedModalContent) {
            info.firstChild.classList.toggle("hidden");
            loadCachedContent(loadedModalContent);
          });
      }
    };
    return openButton;
  }

  // takes the info div and a video element, and stops the video, if enabled,
  // hiding its display, and closes the info modal window, returning to the
  // initial state of the item display on the page, where all of the items
  // can be selected and intreacted with, and no modal window is opened for any
  // particular item. Returns the DOM close button.
  function createCloseButton(info, video) {
    var closeButton = document.createElement("button");
    closeButton.classList.add("modal-close");
    closeButton.onclick = function() {
      info.firstChild.classList.add("hidden");
      info.classList.toggle("hidden");
      if(video.src) {
        stopVideo(video);
      }
    };
    return closeButton;
  }

  // takes a video HTML5 tag, stops its reproduction by deleting its source,
  // and triggering a pause. Hides the video element.
  function stopVideo(video) {
    video.src = "";
    video.pause();
    video.classList.add("hidden");
  }

  // creates and returns  a video HTML5 tag, with autoplay, and controls enabled.
  // Hides the element initially.
  function createVideoElement() {
    var video = document.createElement("video");
    video.autoPlay = true;
    video.controls = true;
    video.classList.add("hidden");
    return video;
  }

  // takes the info div, a video element, a video source filename, and an unique
  // item identifier, and creates the interaction of the play button, for when
  // it's clicked. A video is loaded with the videoSource filename, and shown
  // to the user, with autoplay feature. Returns the DOM play button.
  function createPlayButton(info, videoElement, videoSource, itemId) {
    var playButton = document.createElement("button");
    playButton.textContent = "Play";
    playButton.classList.add("modal-open");
    playButton.onclick = function() {
      if($(itemId)) {
        $(itemId).classList.add("hidden");
      }
      info.classList.remove("hidden");
      info.firstChild.classList.remove("hidden");
      var videoUrl = calculateVideoUrl(videoSource);
      videoElement.src = videoUrl;
      videoElement.addEventListener("loadeddata", function() {
        info.firstChild.classList.add("hidden");
        videoElement.classList.remove("hidden");
        videoElement.play();
      });
    }
    return playButton;
  }

  // takes the modalContent div, and resets is scrolling position to the
  // beginning of the window, and shows its content.
  function loadCachedContent(modalContent) {
    modalContent.classList.remove("hidden");
    modalContent.scrollTop = 0
  }

  // takes a modalContent DOM container div, an item unique identifier, and
  // a DOM div, and creates the DOM structure for the "More" container when
  // the button "More" is clicked.
  function openMoreInformation(modalContent, itemId, info) {
    var itemMetadata = getItemInfo(collectionName, itemId);
    return itemMetadata
      .then(function(response) {
        modalContent = document.createElement("div");
        modalContent.classList.add("modal-content");
        modalContent.id = itemId;
        info.appendChild(modalContent);
        return response;
      })
      .then(function(response) {
        var content = {};
        loadMetadata(response, content);
        return content;
      })
      .then(function(content) {
        var titleSpan = document.createElement("div");
        titleSpan.innerHTML = content['Title'];
        titleSpan.classList.add("clip-title");
        modalContent.appendChild(titleSpan);
        return content;
      })
      .then(function(content) {
        var metadata = document.createElement("table");
        populateMetadataTable(content, metadata);
        modalContent.appendChild(metadata);
        return modalContent;
      });
  }

  // takes a content object with metadata from an item, and a metadata DOM table
  // tag, and populates a table of metadata to be displayed about a movie item.
  // Each table row bears the data from an entry inside the content object
  // dictionary, and its key is used as a category table definition that is
  // going to tell which data is being shown. For example, Title -> "Foo Bar".
  // The table also checks for any links inside the metadata, and restructures
  // it with the link HTML tag.
  function populateMetadataTable(content, metadata) {
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
  }

  // given the response object from a getInfo request, and a content object,
  // loads the relevant data from the response into the content, renaming
  // the keys for better reading and manipulation. The used data can be seen
  // below, as they are each added to the content object.
  function loadMetadata(response, content) {
    content['Title'] = response.title;
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
  }

  // given an item unique identifier (pointer, as in ContentDM notation),
  // calculates and returns an item's thumbnail image url, to be sourced into
  // an image tag.
  function getImagePath(itemId) {
    return (API_SITE + "getthumbnail/collection/" + COLLECTION_NAME "/id/" +
            itemId + "/json");
  }

  // given an item unique identifier, retrieves and returns the url of the image
  // thumbnail for that item. If the thumbnail failed to be retrieved, returns
  // the url of a default error image to be placed in the item instead.
  function getThumbnailUrl(itemId) {
    var imageUrl = getImagePath(itemId);
    var thumbnailPromise = new ItemThumbnailPromise(imageUrl);
    return thumbnailPromise
      .then(function(url) {
        return url;
      })
      .catch(function(errorUrl) {
        return errorUrl;
      })
  }

  // given a filename for an item, as stored on the server, retrieves and
  // returns an HTTP Streaming url, to be sourced into a video tag.
  function calculateVideoUrl(itemSourceFile) {
    return (API_SERVER + itemSourceFile + "/byte/json");
  }

  // given an item unique identifier (pointer, as in ContentDM notation),
  // triggers a window download action on the browser, saving the file
  // with filename as stored in the collection, and saving it to client's
  // browser downloads destination i.e its downloads folder.
  function download(itemId) {
    var endpointString = ("getfile/collection/" + COLLECTION_NAME +
                          "/id/" + itemId);
    var fileSource = API_SITE + endpointString;
    window.location = fileSource;
  }

  // MAKE THIS SEARCH SMARTER!!! SEARCH FOR "OR" INSTEAD OF AND TO FIND BETTER RESULTS
  // given a query string, a collection name, and a collection size - to limit
  // how many items to try to match the query, searches for items within
  // the collection that have names related to the query tokens.
  // Search mechanism is currently configured to match all of the tokens in
  // the query string linked by an "and" logical relationship, meaning
  // results are excludent by any query terms that are together.
  // Upon success, returns a parsed JSON object containing title of the item,
  // short description, if available, and the filename of the item as stored
  // on the server.
  function retrieveRecords(queryString, collectionName, collectionSize) {
    var endpointString = ("dmQuery/" + collectionName + "/CISOSEARCHALL^"
                          + queryString + "^all^and/!title!clip!filmvi/nosort/"
                          + collectionSize + "/0/1/0/1//0/0/0/json"
                          );
    var requestRecord = new AjaxGetPromise("server.php?url=" + endpointString);
    return requestRecord
      .then(JSON.parse)
      .then(function(parsedResponse) {
        return parsedResponse;
      })
      .catch(function(error) {
        return error;
      });
  }

  // given a collection name, retrieves how many records are currently
  // stored in the collection. Upon success, returnsa string of the number of
  // items available.
  function getCollectionSize(collectionName) {
    var endpointString = ("dmQuery/" + collectionName + "/json");
    var getCollectionInfo = new AjaxGetPromise("server.php?url=" + endpointString);
    return getCollectionInfo
      .then(JSON.parse)
      .then(function(parsedResponse) {
        return parsedResponse.pager.total;
      })
      .then(function(totalCollectionSize) {
        return totalCollectionSize;
      })
      .catch(function(error) {
        return error;
      });
  }

  // given a collection name, and an item id pointer, retrieves metadata
  // from the given file with corresponding id. Upon success, returns as
  // parsed JSON object.
  function getItemInfo(collectionName, itemPointer) {
    var endpointString = ("dmGetItemInfo/" + collectionName + "/" +
                          itemPointer + "/json");
    var itemRequest = new AjaxGetPromise("server.php?url=" + endpointString);
    return itemRequest
      .then(JSON.parse)
      .then(function(parsedResponse) {
        return parsedResponse;
      })
      .catch(function(error) {
        return error;
      });
  }

})();
