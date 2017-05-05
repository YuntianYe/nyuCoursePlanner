var fs= require('fs');

const HREADER = `BEGIN:VCALENDAR
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

const FOOTER = `END:VCALENDAR`;
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

var generateEvent = (sd, ed, st, et, bd, title) => {
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

var placeEvent = (e) => {
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
    return generateEvent(dates[0], dates[1], times[0], times[1], days, `${e.topic} - ${inst}`);
  } catch (er) {
    return "";
  }
}

var addEvents = (e) => {
  var c = "";
  for (i in e) {
    c += placeEvent(e[i]);
  }
  return HREADER + c + FOOTER;
}

exports.addEvents = addEvents;

exports.generate = (e, callback) => {
  var cal = addEvents(e);
  var fname = `nyuCoursePlanner-${new Date().Format("hhmmss")}${("" + Math.random()).slice(3,8)}.ics`;
  fs.writeFile( "./ics/" + fname, cal, () => {callback(fname);});
}
