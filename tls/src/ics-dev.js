var saveAs = saveAs || (function(view) {
  "use strict";
  if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
      return;
  }
  var
      doc = view.document
      , get_URL = function() {
          return view.URL || view.webkitURL || view;
      }
      , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
      , can_use_save_link = "download" in save_link
      , click = function(node) {
          var event = new MouseEvent("click");
          node.dispatchEvent(event);
      }
      , is_safari = /constructor/i.test(view.HTMLElement) || view.safari
      , is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
      , throw_outside = function(ex) {
          (view.setImmediate || view.setTimeout)(function() {
              throw ex;
          }, 0);
      }
      , force_saveable_type = "application/octet-stream"
      , arbitrary_revoke_timeout = 1000 * 40
      , revoke = function(file) {
          var revoker = function() {
              if (typeof file === "string") {
                  get_URL().revokeObjectURL(file);
              } else {
                  file.remove();
              }
          };
          setTimeout(revoker, arbitrary_revoke_timeout);
      }
      , dispatch = function(filesaver, event_types, event) {
          event_types = [].concat(event_types);
          var i = event_types.length;
          while (i--) {
              var listener = filesaver["on" + event_types[i]];
              if (typeof listener === "function") {
                  try {
                      listener.call(filesaver, event || filesaver);
                  } catch (ex) {
                      throw_outside(ex);
                  }
              }
          }
      }
      , auto_bom = function(blob) {
          if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
              return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
          }
          return blob;
      }
      , FileSaver = function(blob, name, no_auto_bom) {
          if (!no_auto_bom) {
              blob = auto_bom(blob);
          } 
          var
                filesaver = this
              , type = blob.type
              , force = type === force_saveable_type
              , object_url
              , dispatch_all = function() {
                  dispatch(filesaver, "writestart progress write writeend".split(" "));
              }
              , fs_error = function() {
                  if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
                      var reader = new FileReader();
                      reader.onloadend = function() {
                          var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                          var popup = view.open(url, '_blank');
                          if(!popup) view.location.href = url;
                          filesaver.readyState = filesaver.DONE;
                          dispatch_all();
                      };
                      reader.readAsDataURL(blob);
                      filesaver.readyState = filesaver.INIT;
                      return;
                  }
                  if (!object_url) {
                      object_url = get_URL().createObjectURL(blob);
                  }
                  if (force) {
                      view.location.href = object_url;
                  } else {
                      var opened = view.open(object_url, "_blank");
                      if (!opened) {
                          view.location.href = object_url;
                      }
                  }
                  filesaver.readyState = filesaver.DONE;
                  dispatch_all();
                  revoke(object_url);
              }
          ;
          filesaver.readyState = filesaver.INIT;

          if (can_use_save_link) {
              object_url = get_URL().createObjectURL(blob);
              setTimeout(function() {
                  save_link.href = object_url;
                  save_link.download = name;
                  click(save_link);
                  dispatch_all();
                  revoke(object_url);
                  filesaver.readyState = filesaver.DONE;
              });
              return;
          }

          fs_error();
      }  
      , FS_proto = FileSaver.prototype
      , saveAs = function(blob, name, no_auto_bom) {
          return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
      }
  ;
  if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
      return function(blob, name, no_auto_bom) {
          name = name || blob.name || "download";

          if (!no_auto_bom) {
              blob = auto_bom(blob);
          }
          return navigator.msSaveOrOpenBlob(blob, name);
      };
  }

  FS_proto.abort = function(){};
  FS_proto.readyState = FS_proto.INIT = 0;
  FS_proto.WRITING = 1;
  FS_proto.DONE = 2;

  FS_proto.error =
  FS_proto.onwritestart =
  FS_proto.onprogress =
  FS_proto.onwrite =
  FS_proto.onabort =
  FS_proto.onerror =
  FS_proto.onwriteend =
      null;

  return saveAs;
}(  
     typeof self !== "undefined" && self
  || typeof window !== "undefined" && window
  || this.content
));  

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

const ICSHEADER = `BEGIN:VCALENDAR
PRODID:-//Yuuno Hibiki//NYU Course Planner//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VTIMEZONE
TZID:Asia/Hong_Kong
X-LIC-LOCATION:Asia/Hong_Kong
BEGIN:STANDARD
TZOFFSETFROM:+0800
TZOFFSETTO:+0800
TZNAME:HKT
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
`;

const ICSFOOTER = `END:VCALENDAR`;
const DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

Date.prototype.Format = function (fmt) {
  var o = {
      "M+": this.getMonth() + 1,
      "d+": this.getDate(),
      "h+": this.getHours(),
      "m+": this.getMinutes(),
      "s+": this.getSeconds(),
      "q+": Math.floor((this.getMonth() + 3) / 3),
      "S": this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) 
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) 
    if (new RegExp("(" + k + ")").test(fmt)) 
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}

var getNextDay = (d) => {
  return new Date(d.getTime() + 24 * 60 * 60 * 1000);
}

var getPrevDay = (d) => {
  return new Date(d.getTime() - 24 * 60 * 60 * 1000);
}

var generateICSEvent = (sd, ed, st, et, bd, title) => {
  var start  = new Date(`${sd} ${st}`);
  var start2 = new Date(`${sd} ${et}`);
  var end    = new Date(`${ed} ${et}`);
  
  var times = 0;
  while (bd.indexOf(DAYS[new Date(start).getDay()]) == -1) {
    times++;
    start = getNextDay(start);
    start2 = getNextDay(start2);
    if (times >= 7) break;
  }
  times = 0;
  while (bd.indexOf(DAYS[new Date(end).getDay()]) == -1) {
    times++;
    end = getPrevDay(end);
    if (times >= 7) break;
  }
  
  var content = "";
  content += "BEGIN:VEVENT" + "\n" +
             "UID:" + "nyuCoursePlanner" + ("" + Math.random()).slice(3,8) + "\n" +
             "DTSTAMP:" + new Date().Format("yyyyMMddThhmmss") + "Z\n" +
             "CREATED:" + new Date().Format("yyyyMMddThhmmss") + "Z\n" +
             "DTSTART:" + start.Format("yyyyMMddThhmmss") + "\n" +
             "DTEND:" + start2.Format("yyyyMMddThhmmss") + "\n" +
             "RRULE:" + "FREQ=WEEKLY;" + 
                        "UNTIL=" + end.Format("yyyyMMddThhmmss") + "Z;" + 
                        "BYDAY=" + bd + "\n" +
             "SUMMARY:" + title + "\n" +
             "END:VEVENT" + "\n";
  return content;
}

var placeICSEvent = (e) => {
  try {
    if (!e.hasOwnProperty("session") || e.session == "") return "";
    if (!e.hasOwnProperty("schedule") || e.schedule == "") return "";
    if (!e.hasOwnProperty("days") || e.days.length < 1) return "";
    var dates = e.session.toLowerCase().replace(/[a-z]/g, "").split("-");
    var times = e.schedule.replace(/\./g, ":").split("-");
    var days = "";
    for (i in e.days) {
      days += (e.days[i].slice(0,2).toUpperCase() + ",");
    }
    days = days.slice(0, days.length - 1);
    var inst = "STAFF";
    if (e.instructor.replace(/ /g, "") != "" )
      inst = e.instructor;
    return generateICSEvent(dates[0], dates[1], times[0], times[1], days, `${e.topic} - ${inst}`);
  } catch (er) {
    return "";
  }
}

var addICSEvents = (e) => {
  var c = "";
  for (i in e) {
    c += placeICSEvent(e[i]);
  }
  return ICSHEADER + c + ICSFOOTER;
}

var generateICS = (e) => {
  var cal = addICSEvents(e);
  var fname = `nyuCoursePlanner.ics`;
  var blob = new Blob([cal], {type: "text/calendar;charset=utf-8"});  
  saveAs(blob, fname);
}