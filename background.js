var enable = false;
var count = 0;
var rpc, secret;

chrome.browserAction.onClicked.addListener(function() {
  if (enable) {
    chrome.browserAction.setIcon({path: 'icon_disable.png'});
    count = 0;
    chrome.browserAction.setBadgeText({text: ''});
  } else {
    chrome.browserAction.setIcon({path: 'icon_enable.png'});
  }
  enable = !enable;
});

function getCookie(url, cb) {
  chrome.cookies.getAll({ url: url }, function (cookies) {
    cookie_str = cookies.map(function (cookie) {
      return cookie.name + "=" + cookie.value
    }).join("; ");
    cb('Cookie: ' + cookie_str);
  })
}

var xhr;
var Ajax = $.ajaxSettings.xhr;
$.ajaxSettings.xhr = function () {
  xhr = Ajax();
  return xhr;
}

function resolveRedirect(url, cb) {
  $.ajax({
    type: 'HEAD',
    url: url,
    success: function () {
      cb(xhr.responseURL);
    },
    error: function (err) {
      console.warn(err);
      cb(url);
    }
  });
}

chrome.downloads.onCreated.addListener(function (item) {
  if (enable) {
    resolveRedirect(item.url, function (url) {
      getCookie(url, function (cookie) {
        var options = { header: [cookie] };
          if (item.referrer) {
            options.header.push('Referrer: ' + item.referrer);
          }
          fire(url, options);
        });
    });
    chrome.downloads.erase({id: item.id});
  }
});

function request_auth(url) {
  return url.match(/^(?:(?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(?:\/\/)?(?:([^:@]*(?::[^:@]*)?)?@)?/)[1];
}

function remove_auth(url) {
  return url.replace(/^((?![^:@]+:[^:@\/]*@)[^:\/?#.]+:)?(\/\/)?(?:(?:[^:@]*(?::[^:@]*)?)?@)?(.*)/, '$1$2$3');
}

function update() {
  chrome.storage.local.get({ rpc: 'http://localhost:6800/jsonrpc' }, function (res) {
    rpc = res.rpc;
    var auth = request_auth(rpc);
    if (auth && auth.indexOf('token:') == 0) {
      secret = auth;
      rpc = remove_auth(rpc);
    }
    $.jsonRPC.setup({ endPoint: rpc, namespace: 'aria2'});
  });
}

function fire(url, options) {
  params = [[url], options];
  if (secret) params.unshift(secret);
  $.jsonRPC.request('addUri', { params: params,
    success: function() {
      ++count;
      chrome.browserAction.setBadgeText({ text: count + '' });
    },
    error: function(err) {
      console.warn(err);
    }
  });
}

chrome.runtime.onMessage.addListener(update);

update();
