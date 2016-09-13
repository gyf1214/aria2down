$(document).ready(function() {
  chrome.storage.local.get({ rpc: 'http://localhost:6800/jsonrpc' }, function (res) {
    var rpc = res.rpc;
    $('#url').val(rpc);
    $('#save').click(function() {
      rpc = $('#url').val();
      chrome.storage.local.set({ rpc: rpc });
      chrome.runtime.sendMessage({});
    });
  });
});
