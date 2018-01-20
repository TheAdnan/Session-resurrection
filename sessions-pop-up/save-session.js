var tabsLogged = [];
var jsonSession = "";

function logTabs(tabs) {
    var jsonSession = "{";
    for (let tab of tabs) {
        jsonSession += ("'" + tab.url + "',");
        tabsLogged.push(tab.url);
    }
    jsonSession += "}";
    saveToJSON(jsonSession, 'session-' + Date.now() + '.json');
}

function onError(error) {
    console.log(`Error: ${error}`);
}

function saveToJSON(text, name) {
    var a = document.createElement("a");
    var file = new Blob([text], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = "../saved-sessions/" + name;
	browser.downloads.download({
      url : a.href,
      saveAs : true
	});
}

$(document).ready(function() {
    $("#button").click(function() { 
        var toAdd = $("input[name=checkListItem]").val();
        $('.list').append('<div class="item">'+toAdd+"</div>");
    });
    $(document).on('click', '.item', function() {
        $(this).toggleClass("scratch");
    });
});
    
var querying = browser.tabs.query({
    currentWindow: true
});
querying.then(logTabs, onError);