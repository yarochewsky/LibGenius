// My Ajax implementation of a promise

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
}

AjaxPostPromise = function(url, data) {
  return new Promise(function(resolve, reject)) {
    var xhr = new XMLHttpRequest();
    var postData = FormData();
    for(key in data) {
      postData.append(key, data[key]);
    }
    xhr.onload = function() {
      if(this.status == 200) {
        resolve(this.responseText);
      } else {
        reject("Status : " + this.status);
      }
    };
    xhr.onerror = function(error) {
      reject(error);
    }
    xhr.open("POST", url, true);
    xhr.send(postData);
  }
}
