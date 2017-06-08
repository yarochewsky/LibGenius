// This is a library for the promises used by the web app. It includes a GET
// promise, and a Thumbnail promise to retrieve thumbnails from the server.
// Author: Daniel Fonseca Yarochewsky
// Spring '17

// standard GET request, given a url. Resolves on 200 response codes.
AjaxGetPromise = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      if(this.status == 200) {
        resolve(this.responseText);
      } else {
        reject("Status : " + this.status);
      }
    };
    xhr.onerror = function(error) {
      reject(error);
    };
    xhr.open("GET", url, true);
    xhr.send();
  });
};

// takes a url and creates an image object for which the source url will be
// injected on. Resolves once image is loaded.
ItemThumbnailPromise = function(url) {
  return new Promise(function(resolve, reject) {
    var image = new Image();
    image.onload = function() {
      resolve(image.src);
    };
    image.onerror = function() {
      reject("not_found.png")
    };
    image.src = url;
  });
};
