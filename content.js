(function (w) {
    var oldST = w.setTimeout;
    var oldSI = w.setInterval;
    var oldCI = w.clearInterval;
    var timers = [];
    w.timers = timers;
    w.setTimeout = function (fn, delay) {
        var id = oldST(function () {
            if (delay == 1000) {
                return;
            }
            try {
                fn && fn();
            } catch (err) {

            }
            removeTimer(id);

        }, delay);
        timers.push(id);
        return id;
    };
    w.setInterval = function (fn, delay) {
        if (delay == 0) {
            return;
        }
        var id = oldSI(function () {
            fn();
        }, delay);
        timers.push(id);

        return id;
    };
    w.clearInterval = function (id) {
        oldCI(id);
        removeTimer(id);
    };
    w.clearTimeout = w.clearInterval;

    function removeTimer(id) {
        var index = timers.indexOf(id);
        if (index >= 0)
            timers.splice(index, 1);
    }
}(window));

var content = {
    channels: {},
    lngs: {
        es: "spa",
        pt: "por",
        de: "ger",
        fr: "fre",
        en: "eng"

    },
    i18n: null,
    browserLanguage: function () {
        var userLng = navigator.language || navigator.userLanguage;
        return userLng.toLowerCase().split("-")[0].trim();

    },
    init: function () {
        if(!localStorage.getItem("defaultLng")){
         this.i18n = this.browserLanguage();
         localStorage.setItem("defaultLng",this.i18n)
        }else{
            this.i18n = localStorage.getItem("defaultLng");
        }
        
    
        $("html").addClass("loading");
        this.checkLink();
        this.onReady();
    },
    loadConfig:function(){
        var _this=this;
      var xhr=new XMLHttpRequest();
      xhr.onreadystatechange=function(){
          if(xhr.readyState===4){              
             var configs=JSON.parse(xhr.response);
             console.log(configs.domains);
             console.log(document.domain.toLowerCase());
             if($.inArray(document.domain.toLowerCase(),configs.domains)!==-1){
                 console.log("I am in the correct domain");
                 _this.init();
                 return;
             }
             
             if(document.domain.toLowerCase() in configs["redirects"]){
                  console.log("i will redirect...");
                 window.location.href=location.protocol+'//'+configs["redirects"][document.domain.toLowerCase()];
             }
             
          }
              
          
      };
      xhr.open("GET",chrome.runtime.getURL("/config.json"),true);
      xhr.send();
    },
    localDate: function (dateEvent) {
        var cest = -60;
        if (moment(dateEvent, 'DD/MM/YYYY HH:mm').isDST()) {
            cest = -120;
        }

        var localDate = new Date();
        var utcDateEvent = moment(dateEvent, 'DD/MM/YYYY HH:mm').toDate().getTime() + (cest * 60000);
        var utcTimeEvent = moment(utcDateEvent).toDate();

        var offset = localDate.getTimezoneOffset() / 60;
        var hours = utcTimeEvent.getHours();
        utcTimeEvent.setHours(hours - offset);

        return  moment(utcTimeEvent).format("DD/MM/YYYY HH:mm");
    },
    checkLink: function () {
        if (location.pathname != "/e-guide") {
            window.location = "/e-guide";
        }
    },
    cleanBody: function () {
        var highestTimeoutId = setTimeout(";");
        for (var i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }

        var html = $("body").html();
        $("body").append("<div id='scrapping'>" + html + "</div>");
        $("#scrapping").find("script").remove();
        $("#scrapping").find("aside").remove();
        $("#scrapping").find("nav").remove();
        $("#scrapping").find("iframe").remove();
        $("#scrapping").find("#banner_ad").remove();



        $("body").html($("#scrapping").html());
        $(document).find("*").off();
        $(document).off("click");
        $("body.sidebar-first #main").css({"float": "none"});

    },
    onReady: function () {
        var _this = this;
        $(function () {
            setTimeout(function () {
                _this.cleanBody();
                _this.traverseTable();
                $("html").removeClass("loading");
            }, 1500);

        });

    },
    setLink: function (element, acestream, channel, lng) {
        var active = "";
        if (lng == this.lngs[this.i18n]) {
            active = " mylng";
        }


        return  "<a class='link " + lng + active + "' href='" + acestream + "'>" + channel + "</a><br />";

    },
    getChannel: function (channel, element, lng, key, event) {
        var _this = this;
        var acestream = null;

        if ((channel in _this.channels)) {
            acestream = _this.channels[channel];
        } else {
            $.get(channel, function (data) {
                acestream = $(data).find("a[href*='acestream:']").attr("href");
                _this.channels[channel] = acestream;
            });
        }


        localStorage.setItem(key, JSON.stringify({timestamp: new Date().getTime(), event: event, acestream: acestream, channel: channel, lng: lng}));

        return _this.setLink(element, acestream, channel, lng);


    },
    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    setChannel: function (element, date_time, channel, lng, event) {
        var key = (date_time + "_" + channel).trim().split(' ').join('-');
        if (localStorage.getItem(key) === null) {
            return this.getChannel(channel, element, lng, key, event);
        } else {
            var object = JSON.parse(localStorage.getItem(key));
            //console.log(key,localStorage.getItem(key));
            return this.setLink(element, object.acestream, object.channel, object.lng);

        }
    },
    traverseTable:function() {
        var _this = this;
        var diffLess = 1000;
        var scrollTo = null;

        $.ajaxSetup({async: false});

        var dateRefresh = $("table tr").last().find().find("td:nth-child(2)").text();
        var timeRefresh = $("table tr").last().find().find("td:nth-child(3)").text();
        var dateLocalRefresh = _this.localDate(dateRefresh + " " + timeRefresh.split(" ")[0]);


        if (localStorage.getItem("updateDate")) {
            if (moment(dateLocalRefresh, "DD/MM/YYYY HH:mm").isAfter(moment(localStorage.getItem("updateDate"), "DD/MM/YYYY HH:mm"))) {
                var rangeEventInHours = localStorage.getItem("rangeEventInHours")
                localStorage.clear();
                localStorage.setItem("rangeEventInHours", rangeEventInHours)
            }
        }

        localStorage.setItem("updateDate", dateLocalRefresh);





        $("table tr").each(function (index, element) {

            var channels = $(element).find("td:nth-child(6)").text(),
                    date = $(element).find("td:nth-child(1)").text(),
                    time = $(element).find("td:nth-child(2)").text();

            $(element).find("td:nth-child(2)").css({"display": "none"});
            $(element).find("th:nth-child(2)").css({"display": "none"});

            if (date.trim().length == 0) {
                return true;
            }

            var dateLocal = _this.localDate(date + " " + time.split(" ")[0])

            $(element).find("td:nth-child(1)").text(date + " " + time);
            $(element).find("td:nth-child(1)").html(date + " " + time + "<br /><span class='green'>" + dateLocal + "</span>");


            // opacity events if not stay in range hours
            var ms = moment().diff(moment(dateLocal, "DD/MM/YYYY HH:mm"));
            var d = moment.duration(ms);
            ///console.log("DIFERENCIA:  ");
            var diff = Math.floor(d.asHours())
            //var diferencia = ;
            if (diffLess > Math.abs(diff)) {
                diffLess = Math.abs(diff);
                scrollTo = $(element);
            }

            if (!localStorage.getItem("rangeEventInHours")) {
                localStorage.setItem("rangeEventInHours", 2)
            }

            if (diff > parseInt(localStorage.getItem("rangeEventInHours")) || diff < 0) {
                $(element).css({"opacity": 0.4});
            }



            var ahtml = [];
            $.each(channels.split("\n"), function (index, line) {
                if (line.trim().length == 0) {
                    return true;
                }

                try {
                    var channelsLng = line.split(" ");
                    var channelsList = channelsLng[0].split("-");
                    var lng = channelsLng[1];
                    lng = lng.substring(0, lng.length - 1).substring(1).toLowerCase().trim();

                    $.each(channelsList, function (index, channel) {
                        channel = _this.pad(channel.match(/\d+/)[0], 2);

                        ahtml.push({lng: lng, html: _this.setChannel($(element).find("td:nth-child(6)"), moment(dateLocal, "DD/MM/YYYY HH:mm").format("DD-MM-YYYY_HH_mm"), channel, lng, $(element).find("td:nth-child(5)").text())});
                    });


                } catch (err) {
                    console.log(err);
                }




            });


            var html = ""
            $.each(ahtml, function (index, channelEvent) {

                if (channelEvent.lng == _this.lngs[_this.i18n]) {
                    html = channelEvent.html + html;

                } else {
                    html += channelEvent.html;
                }
            });
            $(element).find("td:nth-child(6)").html(html);




        });

        $('html, body').animate({
            scrollTop: scrollTo.offset().top
        }, 500);



    }
};

content.loadConfig();












