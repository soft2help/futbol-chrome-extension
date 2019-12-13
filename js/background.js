
 var callback= function (details) { 
     console.log(details);
            if(details.type=="script" && details.url.indexOf("chrome-extension")!=0){
                 return {cancel: true};
            }
           return {cancel: false};
            
        };

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request.fn);
    if (request.fn == "init"){

    chrome.webRequest.onBeforeRequest.addListener(callback,
        {urls: ["<all_urls>"]},
        ["blocking"]);
    
    
    }
    if(request.fn == "removelistener"){       
         chrome.webRequest.onBeforeRequest.removeListener(callback);
    }
    
    
});



