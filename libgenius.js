/*
CSE 154: Creative Project Ajax
Name: Daniel Fonseca Yarochewsky
TA: Kyle
This app searches and displays results of films available at UW Library
Special Collections
*/

(function() {
  "use strict";

  var API_URL = "https://server16786.contentdm.oclc.org/dmwebservices/index.php?q=";
  var API_SITE = "https://cdm16786.contentdm.oclc.org/utils/";
  var collectionName = "filmarch";

  var $ = function(id) { return document.getElementById(id); };

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
    setResultsView();
    $("loading").classList.remove("hidden");
    var queryString = $("query").value;
    if(queryString) {
      var processedQueryString = queryString.replace(/ /g, "+");
      var collectionInfo = getCollectionSize(collectionName);
      collectionInfo
        .then(function(collectionSize) {
          var items = retrieveRecords(queryString, collectionName,
                                      collectionSize);
          items
            .then(function(matches) {
              $("records").innerHTML = ""; //clear previous results, if any
              $("loading").classList.add("hidden"); // start loading animation
              // dispplay number of records found
              $("number-found").innerHTML = matches.records.length + " results";
              populateResults(matches.records);
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
    $("copyright").classList.add("hidden");
    $("searcharea").classList.add("results-mode");
    $("results").classList.remove("hidden");
    $("query").classList.remove("search-onboard-mode");
    $("query").classList.add("search-results-mode");
    document.body.style.backgroundImage = "none";
  }

  // gets an object with all the matches retrieved from the query, and populates
  // the results container with the matches from this query.
  function populateResults(items) {
    for(var i = 0; i < items.length; i++) {
      var title = items[i].title;
      getThumbnail(collectionName, items[i].pointer);

      var itemContainer = document.createElement("div");
      itemContainer.classList.add("record");

      var itemContainerTitle = document.createElement("div");
      var overlay = document.createElement("div");
      overlay.classList.add("record-title-overlay");
      itemContainer.appendChild(overlay);
      itemContainerTitle.innerHTML = title;
      itemContainerTitle.classList.add("record-title");
      overlay.appendChild(itemContainerTitle);

      // either display custom description by archivist, or original description
      // if the former is not available
      var description = items[i].clip ? items[i].clip : items[i].filmvi;
      description = description ? description : "no description available for this clip.";
      var itemContainerDescription = document.createElement("div");
      itemContainerDescription.innerHTML = description;
      itemContainerDescription.classList.add("record-description");
      itemContainer.appendChild(itemContainerDescription);


      var imagePath = "./images/" + items[i].pointer + ".jpg";
      itemContainer.style.backgroundImage = "url(" + imagePath + ")";
      $("records").appendChild(itemContainer);
    }
  }

  // given a query string, searches for the record that matches the parameters,
  // and if successful, returns an object with the item's pointer, filetype,
  // and find property.
  function retrieveRecords(queryString, collectionName, collectionSize) {
    var endpointString = ("dmQuery/" + collectionName + "/CISOSEARCHALL^"
                          + queryString + "^all^and/!title!clip!filmvi/nosort/" + collectionSize
                          + "/0/1/0/1//0/0/0/json"
                          );
    var requestRecord = new AjaxGetPromise(API_URL + endpointString);
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
    var getCollectionInfo = new AjaxGetPromise(API_URL + endpointString);
    return getCollectionInfo
      .then(function(response) {
        var records = JSON.parse(response).pager.total;
        return records;
      })
      .catch(function(error) {
        return error;
      });
  }

  // given a collection name and an item id, downloads the thumbanil image
  // of that item to the images folder
  function getThumbnail(collectionName, pointer) {
    var endpointString = ("getthumbnail/collection/" + collectionName
                            + "/id/" + pointer);
    var picture = API_SITE + endpointString;
    var data = {"image" : picture, "pointer" : pointer};
    var saveImage = new AjaxPostPromise("./saveimage.php", data);
    saveImage
      .then(function() {
        console.log("saved image");
      })
      .catch(function() {
        console.log("cant save image");
      });
  }

    // function getItemInfo(collectionName, itemPointer) {
    //   var endpointString = ("dmGetItemInfo/" + collectionName + "/" +
    //                         itemPointer + "/json");
    //   var itemRequest = new AjaxGetPromise(API_URL + endpointString);
    //   return itemRequest
    //     .then(function(response) {
    //       return JSON.parse(response);
    //     })
    //     .catch(function(error) {
    //       return error;
    //     });
    // }

})();
