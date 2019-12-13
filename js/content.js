(function (w) {
    var oldST = w.setTimeout;
    var oldSI = w.setInterval;
    var oldCI = w.clearInterval;
    var timers = [];
    w.timers = timers;
    w.setTimeout = function (fn, delay) {
        var id = oldST(function () {
            if (delay != 1234) {
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
        if (delay != 1234) {
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
    configs: {},
    channels: {},
    hrefChannels:{},
    lngs: {
        es: "spa",
        pt: "por",
        de: "dut",
        fr: "fre",
        en: "eng"

    },
    i18n: null,
    browserLanguage: function () {
        var userLng = navigator.language || navigator.userLanguage;
        return userLng.toLowerCase().split("-")[0].trim();

    },
    reload: function () {
        window.location.reload();
    },
    setInterval: function () {
        setInterval(function () {
            console.log("cleaning sheat!");
            $("html").find("*").off();
            $("body").off();
            $("head").find("script").remove();
            $("html").find("iframe").remove();
           // $(".tempcontent").siblings().remove();
          //  console.clear();

        }.bind(this), 1234);


    },
    init: function () {        
        this.setInterval();
       
        
        var _this = this;
        if (!_this.configs.defaultLng) {
            this.i18n = this.browserLanguage();
            chrome.storage.local.set({defaultLng: this.i18n});
        } else {
            this.i18n = _this.configs.defaultLng;
        }


        $("html").addClass("loading");
        document.addEventListener("DOMContentLoaded", function () {
            $("body").wrapInner("<div class='tempcontent'></div>");
            $(".tempcontent").css({"display": "none"});
            $("body").css("display", "block");
            $("body").css("height", "100vh");
            $("body").prepend('<div class="infoloading"><div class="text">Loading...</div></div>');
            if(!_this.checkLink()){
                $(".infoloading").html('<div class="text">No events! try reload later</div></div>')
                return false;
            }
                

            _this.onReady();
            
        });




    },
    loadStorage: function () {
        var _this = this;
        
        chrome.storage.local.get(null, function (items) {
            _this.configs = items;

            _this.loadConfig();
        });
    },
    cleanArray: function (actual) {
        var newArray = new Array();
        for (var i = 0; i < actual.length; i++) {
            if (actual[i].length > 0) {
                newArray.push(actual[i]);
            }
        }
        return newArray;
    },
    loadConfig: function () {
          chrome.runtime.sendMessage({fn: "removelistener"});
        var _this = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                console.log(xhr.response);
                var configs = JSON.parse(xhr.response);

                var domains=configs.domains;
                if(_this.configs.domains)
                    domains = _this.cleanArray(configs.domains.concat(_this.configs.domains.split(";")));
               
                if ($.inArray(document.domain.toLowerCase(), domains) !== -1) {
                     chrome.runtime.sendMessage({fn: "init"});
                    _this.init();
                    return;
                }


                $.each(_this.configs.redirects.split(";"), function (index, orides) {
                    var aorides = orides.split(":");
                    if (document.domain.toLowerCase() == aorides[0].toLowerCase()) {
                        window.location = location.protocol + '//' + aorides[1].toLowerCase();
                        return;
                    }
                });


                if (document.domain.toLowerCase() in configs["redirects"]) {
                    window.location.href = location.protocol + '//' + configs["redirects"][document.domain.toLowerCase()];
                }
                
                

            }


        };
        xhr.open("GET", chrome.runtime.getURL("/config.json"), true);
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
       
        let eventguide=$(".menu li.leaf a:contains('EVENTS GUIDE')").attr("href");
        if(!eventguide)
            return false;
       
        if (location.pathname != eventguide) {
            window.location = eventguide;
        }
        return true;
    },
    cleanBody: function () {
        //        var highestTimeoutId = setTimeout(";");
        //        for (var i = 0; i < highestTimeoutId; i++) {
        //            clearTimeout(i);
        //        }

        var html = $("body").html();
       
        $("body").append("<div id='scrapping'>" + html + "</div>");
        $("#scrapping").find("script").remove();
        $("#scrapping").find("aside").remove();
       
        $("#scrapping").find("iframe").remove();
        $("#scrapping").find("#banner_ad").remove();



        $("body").html($("#scrapping").html());
        $("body").find("*").off();
        $("html").off("click");
        $("body.sidebar-first #main").css({"float": "none"});

    },
    onReady: function () {
        var _this = this;
        $(function () {
            setTimeout(function () {
                _this.cleanBody();
                console.log("TRANSVERSAL")
                _this.traverseTable();
                console.log("CLEANING")
                $("nav").remove();
                $(".title").remove();
                $("html").removeClass("loading");
                $(".tempcontent").css({"display": "block"});                
                $("body").css("height", "100%");

                $('html, body').scrollTop(_this.scrollTo.position().top);
                chrome.runtime.sendMessage({fn: "removelistener"});
            }, 1234);

        });

    },
    setLink: function (element, acestream, channel, lng) {
        var active = "";
        if (lng == this.lngs[this.i18n]) {
            active = " mylng";
        }


        return  "<a class='link " + lng + active + "' href='" + acestream + "'><span></span></a><br>";

    },
    getChannel: function (channel, element, lng, key, event) {
        var _this = this;
        var acestream = null;
       
        if ((channel in _this.channels)) {
            acestream = _this.channels[channel];
        } else {
            let url=_this.hrefChannels[channel];
        
            $.get(url, function (data) {
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
            return this.setLink(element, object.acestream, object.channel, object.lng);

        }
    },
    traverseTable: function () {
        var _this = this;
        var diffLess = 1000;       

        $.ajaxSetup({async: false});

        var dateRefresh = $("table tr").last().find("td:nth-child(2)").text();
        var timeRefresh = $("table tr").last().find("td:nth-child(3)").text();
        var dateLocalRefresh = _this.localDate(dateRefresh + " " + timeRefresh.split(" ")[0]);

        console.log(dateRefresh,timeRefresh,dateLocalRefresh);

        if (localStorage.getItem("updateDate")) {
            if (moment(dateLocalRefresh, "DD/MM/YYYY HH:mm").isAfter(moment(localStorage.getItem("updateDate"), "DD/MM/YYYY HH:mm"))) {
                localStorage.clear();
            }
        }

        localStorage.setItem("updateDate", dateLocalRefresh);


      
        
        $(".menu li a").each(function (index, element) {           
            
            var  href=$(element).attr("href");
            //var canal=$(element).text().match(/\d+/)[0];
            var canal=$(element).text();
            if(canal.indexOf("ArenaVision")<0)
                return true;
            
            canal=canal.match(/\d+/)[0];

            _this.hrefChannels[canal]=href;    
            //console.log(href,canal);
          
            
        });

        
        $("table tr").each(function (index, element) {
            if(index==0){
                $(element).find("td:nth-child(6)").remove();
                return true;
            }
            
            var channels = $(element).find("td:nth-child(6)").text(),
                    date = $(element).find("td:nth-child(1)").text(),
                    time = $(element).find("td:nth-child(2)").text();

           
            
            $(".infoloading .text").text($(element).find("td:nth-child(5)").text());

            $(element).find("td:nth-child(2)").css({"display": "none"});            

            if (date.trim().length == 0) {
                return true;
            }

            var dateLocal = _this.localDate(date + " " + time.split(" ")[0])

            $(element).find("td:nth-child(1)").text(date + " " + time);
            $(element).find("td:nth-child(1)").html(date + " " + time + "<br /><span class='green'>" + dateLocal + "</span>");


            // opacity events if not stay in range hours
            var ms = moment().diff(moment(dateLocal, "DD/MM/YYYY HH:mm"));
            var d = moment.duration(ms);

            var diff = Math.floor(d.asHours())
            //var diferencia = ;
            if (diffLess > Math.abs(diff)) {
                diffLess = Math.abs(diff);
                _this.scrollTo = $(element);
            }

            if (!_this.configs.rangeEventInHours) {
                chrome.storage.local.set({rangeEventInHours: 2});
                _this.configs.rangeEventInHours = 2;
            }

            if (!_this.configs.visibility) {
                chrome.storage.local.set({visibility: "hilight"});
                _this.configs.visibility = "hilight";
            }

            if (diff < parseInt(_this.configs.rangeEventInHours) && diff >= 0) {
                if (_this.configs.visibility == "hilight") {
                    $(element).css({"background": "rgba(0,0,255,0.1)"});
                }
            } else {
                if (_this.configs.visibility == "hide") {
                    $(element).css({"display": "none"});
                }

            }



            var ahtml = [];
            $.each(channels.split("\n"), function (index, line) {
               
                if (line.trim().length == 0) {
                    return true;
                }


                var channelsLng = line.split(" ");
                var channelsList = channelsLng[0].split("-");
                var lng = channelsLng[1];
                lng = lng.substring(0, lng.length - 1).substring(1).toLowerCase().trim();
              
                $.each(channelsList, function (index, channel) {
                    try {
                        //console.log(channel.match(/\d+/));
                        if(channel.match(/\d+/) == null)
                            return true;
                        
                        //channel = _this.pad(channel.match(/\d+/)[0], 2);
                        channel =channel.match(/\d+/)[0];
                        console.log(channel,lng);
                        ahtml.push({channel: channel, lng: lng, html: _this.setChannel($(element).find("td:nth-child(6)"), moment(dateLocal, "DD/MM/YYYY HH:mm").format("DD-MM-YYYY_HH_mm"), channel, lng, $(element).find("td:nth-child(5)").text())});
                    } catch (err) {
                        console.log(err);
                        return true;
                    }

                });



            });

            ahtml.sort(function (a, b) {


                if (a.lng == _this.lngs[_this.i18n]) {
                    return -1;
                }

                if (b.lng == _this.lngs[_this.i18n]) {
                    return 1;
                }

                if (parseInt(a.channel) < parseInt(b.channel)) {
                    return 0;
                }

                return 1;


            });

           // console.log(ahtml);
            var html = "";
            var links = [];
            $.each(ahtml, function (index, channelEvent) {
                if (links.indexOf($(channelEvent.html).attr("href")) < 0) {
                    html += channelEvent.html;
                    links.push($(channelEvent.html).attr("href"));
                }
            });
            
            
            $(element).find("td:nth-child(6)").html(html);




        });



          $(".infoloading").remove();
      

    }
};





content.loadStorage();












