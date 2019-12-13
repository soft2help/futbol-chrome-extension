var popup = {
    tabid: null,
    configs: null,
    loadConfig: function () {
        var _this = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                _this.configs = JSON.parse(xhr.response);
            }


        };
        xhr.open("GET", chrome.runtime.getURL("/config.json"), true);
        xhr.send();
    },
    refreshTab: function () {
        var code = 'content.reload();';
        chrome.tabs.executeScript(this.tabid, {code: code});
    }

};


$(document).ready(function () {
    popup.loadConfig();
    console.log("popup");
    chrome.storage.local.get(null, function (items) {
        console.log(items);
        //  items = [ { "phasersTo": "awesome" } ]
        $("input[name=domains]").val(items.domains);
        $("input[name=redirects]").val(items.redirects);
        $("select[name=defaultLng]").val(items.defaultLng);
        $("select[name=rangeEvents]").val(items.rangeEventInHours);
        $("select[name=visibility]").val(items.visibility);
    });

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var currentTab = tabs[0]; // there will be only one in this array
        console.log(currentTab);
        var hostname = (new URL(currentTab.url)).hostname.toLocaleString().toLowerCase();
        if ($.inArray(hostname, popup.configs.domains) !== -1) {
            $(".configs").css({"display": "block"});
            popup.tabid = currentTab.id;
        }


    });




    $("input[name=domains]").on("blur", function () {
        chrome.storage.local.set({domains: $(this).val().replace(/ /g, '')});
        popup.refreshTab();

    });
    $("input[name=redirects]").on("blur", function () {
        chrome.storage.local.set({redirects: $(this).val().replace(/ /g, '')});
        popup.refreshTab();
    });

    $("select[name=defaultLng]").on("change", function () {
        chrome.storage.local.set({defaultLng: $(this).val()});
        popup.refreshTab();
    });
    $("select[name=rangeEvents]").on("change", function () {
        chrome.storage.local.set({rangeEventInHours: $(this).val()});
        popup.refreshTab();
    });

    $("select[name=visibility]").on("change", function () {
        chrome.storage.local.set({visibility: $(this).val()});
        popup.refreshTab();
    });

});
