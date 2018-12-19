var Alberts = {
    "2018 Spring": {
        "NYU Shanghai": "albert/nyushanghai-2018s.json"
    },
    "2017 Fall": {
        "NYU Shanghai": "albert/nyushanghai-2017f.json"
    },
}

var coreLoad = () => {
    var existTag = {};
    var shtml = ""; 
    var lhtml = "";
    for (var i in Alberts) {
        for (var j in Alberts[i]) {
            let li = i;
            let lj = j;
            $.get(Alberts[li][lj]).done((e) => {
                Alberts[li][lj] = e;
            });
            if (!(j in existTag)) {
                existTag[j] = true;
                lhtml += `<li><a dataplace="dataswitcher" href="javascript:" data1="location" data2="${j}">${j}</a></li>`;
            }
        }
        if (!(i in existTag)) {
            existTag[i] = true;
            shtml += `<li><a dataplace="dataswitcher" href="javascript:" data1="semester" data2="${i}">${i}</a></li>`;
        }
    }
    $("#toAddSemester").html(shtml);
    $("#toAddLocation").html(lhtml);
    addHook();
}

var addHook = () => {
  $("a[dataplace=\"dataswitcher\"]").on("click", (e) => {
    let $t = $(e.target);
    switchData($t.attr("data1"), $t.attr("data2"));
  });
}

var coreSearch = (data) => {
    var e = data;
    if (data.data == "") {
        parseCourse([]);
    } else if (!Alberts.hasOwnProperty(data.semester)) {
        Toaston("Please Select the Semester First!", 5000);
        parseCourse([]);
    } else if (!Alberts[data.semester].hasOwnProperty(data.location)) {
        Toaston("Please Select the Location First!", 5000);
        parseCourse([]);
    } else {
        var course = Alberts[data.semester][data.location];
        var myc = [];
        var myid = {};
        for (var i = 0; i < course.Count; i++) {
          if (inEngine(course.Content[i].topic, e["data"]) != -1 || inEngine(course.Content[i].instructor, e["data"]) != -1 ||
          inEngine(course.Content[i].id, e["data"]) != -1 || inEngine(("num["+course.Content[i].classNum+"]"), ("num["+e["data"])) != -1) {
            if (!myid.hasOwnProperty(course.Content[i].id)) {
              myc.push({
                id: course.Content[i].id,
                title: course.Content[i].topic
              });
              myid[course.Content[i].id] = true;
            }
          }
        }
        parseCourse(myc);
    }
}

var corePlan = (data) => {
    if (!Alberts.hasOwnProperty(data.semester)) {
        Toaston("Please Select the Semester First!", 5000);
        receivedPlan([]);
    } else if (!Alberts[data.semester].hasOwnProperty(data.location)) {
        Toaston("Please Select the Location First!", 5000);
        receivedPlan([]);
    } else {
        try {
            var course = Alberts[data.semester][data.location];
            var e = data["cart"];
            var clen = 0;
            var courses = {};
            var coursename = [];
            for (var i in e) {
              if (courses.hasOwnProperty(e[i].id)) continue;
              courses[e[i].id] = [];
              courses[e[i].id+"-rec"] = [];
              courses[e[i].id+"-lab"] = [];
              for (var c in course.Content) {
                if (course.Content[c].id == e[i].id) {
                  if (course.Content[c].component == "Recitation") {
                    if (course.Content[c].schedule != "")
                      courses[e[i].id+"-rec"].push(course.Content[c]);
                  } else if (course.Content[c].component == "Laboratory"){
                    if (course.Content[c].schedule != "")
                      courses[e[i].id+"-lab"].push(course.Content[c]);
                  } else {
                    if (course.Content[c].schedule != "")
                      courses[e[i].id].push(course.Content[c]);
                  }
                }
              }
              var myDate = "";
              if (courses[e[i].id].length > 0) {
                clen++;
                myDate = courses[e[i].id][0].session;
                coursename.push(e[i].id);
              }
              else {
                delete courses[e[i].id];
              }
              if (courses[e[i].id+"-rec"].length > 0) {
                clen++;
                for (var ii in courses[e[i].id+"-rec"]) {
                  courses[e[i].id+"-rec"][ii].session = myDate;
                }
                coursename.push(e[i].id+"-rec");
              }
              else {
                delete courses[e[i].id+"-rec"];
              }
              if (courses[e[i].id+"-lab"].length > 0) {
                clen++;
                for (var ii in courses[e[i].id+"-lab"]) {
                  courses[e[i].id+"-lab"][ii].session = myDate;
                }
                coursename.push(e[i].id+"-lab");
              }
              else {
                delete courses[e[i].id+"-lab"];
              }
            }
            // Find All Possibilities
            if (clen > 10) receivedPlan([]);
            var planner = [];
            plannerD(planner, courses, coursename, 0, clen, []);
            var i = 0;
            
            receivedPlan(planner);
          } catch (er) {
            receivedPlan([]);
          }
    }
}

var parseTime = (d, e) => {
    var t = d * 24 * 60;
    if (e.indexOf("PM") != -1 && e.indexOf("12") == -1) {
      t += 12 * 60;
    }
    e = e.replace("PM", "");
    e = e.replace("AM", "");
    e = e.replace(/ /g, "");
    
    t += parseInt(e.split(".")[0]) * 60;
    t += parseInt(e.split(".")[1]);
    
    return t;
}

var inEngine = (a, b) => {
    return a.toLowerCase().replace(/[^0-9a-z]/g, "").indexOf(b.toLowerCase().replace(/[^0-9a-z]/g, ""));
}

var sort = (a, b) => {
    return a.start - b.start;
}

var checkAva = (e) => {
    var mytime = [];
    for (var i in e) {
      for (var d in e[i].days) {
        var mt = {};
        mt.start = parseTime(Days[e[i].days[d]], e[i].schedule.split("-")[0]);
        mt.end = parseTime(Days[e[i].days[d]], e[i].schedule.split("-")[1]);
        mytime.push(mt);
      }
    }
    mytime.sort(sort);
    for (i = 1; i < mytime.length; i++) {
      if (mytime[i].start < mytime[i-1].end)
        return false;
    }
    return true;
}

var plannerD = (l, c, cn, s, e, nowlist) => {
    if (s < e) {
      for (var cs in c[cn[s]]) {
        nowlist.push(c[cn[s]][cs]);
        plannerD(l, c, cn, s+1, e, nowlist);
        nowlist.pop();
      }
    } else {
      if (checkAva(nowlist)) {
        l.push(JSON.parse(JSON.stringify(nowlist)));
      }
    }
}

/*     main      */

const Colors = ["#1ABC9C","#16A085","#2ECC71","#27AE60","#3498DB","#2980B9","#9B59B6","#8E44AD","#F1C40F","#F39C12","#E67E22","#D35400","#E74C3C","#C0392B","#ECF0F1","#BDC3C7","#95A5A6","#7F8C8D"];
const Days = {
  "Mon": 0,
  "Tue": 1,
  "Wed": 2,
  "Thu": 3,
  "Fri": 4
};

var reqData = {
  semester: "",
  location: "",
  data: ""
}

var curpage = 1;
var cart = [];
var result = [];
var cachedCourse = {};
var fixedCourse = [];
var ToastTimer = null;

var switchData = (d, e) => {
  if (reqData.hasOwnProperty(d)) {
    reqData[d] = e;
    reqData.data = "";
    localStorage.setItem("NCPData", JSON.stringify(reqData));
    $(`tx#${d}`).html(e);
    return 1;
  }
  return 0;
};

var displayData = () => {
  for (var i in reqData) {
    if (i != "data") {
      if (reqData[i] != "") $(`tx#${i}`).html(reqData[i]);
    }
  }
}

var search = (e) => {
  if (reqData == $("#navinp").val()) return;
  reqData.data = $("#navinp").val();
  
  for (var i in reqData) {
    if (reqData[i] == "" && i != "data") {
      $("#navinp").val("");
      reqData.data = "";
      $("#navinp").css("background-color", "indianred");
      Toaston("Please Select Semester and Location.", 5000);
      e.preventDefault();
      return;
    }
  }
  $("#navinp").css("background-color", "");
  Toastoff();
  
  coreSearch(reqData);
};

var serializeInt = (e) => {return e > 9 ? "" + e : "0" + e;}

var initTable = () => {
  var mycal = "";
  
  mycal += "<tr><td>Weekly</td><td>Monday</td><td>Tuesday</td><td>Wednesday</td><td>Thursday</td><td>Friday</td></tr>";
  
  for (var i = 7; i < 21; i++) {
    mycal += `<tr><td>&nbsp;<br />${serializeInt(i)}:00 - ${serializeInt(i+1)}:00<br />&nbsp;</td>`;
    for (var j = 1; j < 6; j++) {
      mycal += `<td id="cr_${j + "_" + i}"></td>`
    }
    mycal += "</tr>";
  }
  $("#cal").html(mycal);
}

var createBlock = (id, start, end, title, addon, color, s, ccid, myclass) => {
  var p = $(`#${id}`).html();
  var msg = "";
  if (!s && end - start > 50) {
    msg = `<b>${title}</b><br /><small>${addon}</small>`;
  }
  p += `<div class="course ${myclass}" style="top:${start}%;height:${end-start}%;background-color:${Colors[color]}" course="${ccid}" addonData="${addon}">${msg}</div>`
  $(`#${id}`).html(p);
  return msg == "" ? false : true;
}

var insertTable = (d, t, c, co) => {
  var ts = t.split("-");
  var tv = [];
  for (var i in ts) {
    var add = 0;
    if (ts[i].indexOf("PM") != -1 && ts[i].indexOf("12") == -1) add = 12;
    tv.push({
      "hour":   parseInt(ts[i].split(".")[0]) + add,
      "minute": parseInt(ts[i].split(".")[1].replace("PM", "").replace("AM", ""))
    })
  }
  
  var hl = false;
  if (fixedCourse.indexOf(c.classNum) != -1) hl = true;
  
  var addon = `${c.topic}<br /><b>${c.instructor}</b><br />${c.classNum}`;
  var isShown = false;
  isShown = createBlock("cr_" + d + "_" + tv[0].hour, tv[0].minute / 60 * 100, 100, c.id, addon, co, isShown, c.classNum, hl ? "highlight-top highlight-side" : "");
  for (var i = tv[0].hour + 1; i < tv[1].hour; i++) {
    var nc = "highlight-side";
    if (i == tv[1].hour - 1 && tv[1].minute == 0) nc += " highlight-bottom";
    isShown = createBlock("cr_" + d + "_" + i, 0, 100, c.id, addon, co, isShown, c.classNum, hl ? nc : "");
  }
  if (tv[1].minute != 0)
    isShown = createBlock("cr_" + d + "_" + tv[1].hour, 0, tv[1].minute / 60 * 100, c.id, addon, co, isShown, c.classNum, hl ? "highlight-bottom highlight-side" : "");
}

var hookBlock = () => {
  $("div.course").on("click", (e) => {
    e.preventDefault();
    var s = $(e.target);
    while (!s.attr("course")) s = s.parent();
    var num = s.attr("course");
    if (fixedCourse.indexOf(num) == -1) {
      fixedCourse.push(num);
    } else {
      fixedCourse.splice(fixedCourse.indexOf(num), 1);
    }
    showplan(curpage - 1);
  })
}

var listcourse = (e) => {
  $("#courselist").html("");
  var myhtml = ""
  for (var i in e) {
    myhtml += `<li><a href="javascript:" listcoursedata="${e[i].id}"><b listcoursedata="${e[i].id}">${e[i].title}</b><br /><small listcoursedata="${e[i].id}">${e[i].id}</small></a></li><li class="divider"></li>`;
  }
  myhtml += `<li><a id="closecart" href="javascript:"><b>Close</b></a></li>`;
  $("#courselist").html(myhtml);
  addClassHook();
}

var addClassHook = () => {
  $("a[listcoursedata]").on("click", (e) => {
    let $t = $(e.target);
    addClass($t.attr("listcoursedata"));
  });
  $("#closecart").on("click", () => {
    $("#courselist").css("display", "none");
  });
}

var listcart = (isStored=false) => {
  if (!isStored) {
    localStorage.setItem("NCPCart", JSON.stringify(cart));
  }
  $("#cart").html("");
  var myhtml = "";
  for (var i in cart) {
    myhtml += `<dl removecartdata="${i}" class="palette cartitem" style="background-color: ${Colors[i]}"><dt removecartdata="${i}">${cart[i].id}</dt><dd removecartdata="${i}">${cart[i].title}</dd></dl>`
  }
  $("#cart").html(myhtml);
  rmClassHook();
}

var rmClassHook = () => {
  $("dl[removecartdata]").on("click", (e) => {
    let $t = $(e.target);
    removecart($t.attr("removecartdata"));
  });
}

var removecart = (e) => {
  cart.splice(e, 1);
  listcart();
}

var addClass = (id) => {
  if (!cachedCourse.hasOwnProperty(id)) return;
  
  cart.push(cachedCourse[id]);
  listcart();

  $("#courselist").css("display", "none");
}

var parseCourse = (raw) => {
  
  for (var i in raw) {
    if (!cachedCourse.hasOwnProperty(raw[i].id)) cachedCourse[raw[i].id] = raw[i];
  }
  listcourse(raw);
}

var startplan = () => {
  corePlan({
    semester: reqData.semester,
    location: reqData.location,
    cart: cart
  });
}

var showplan = (e) => {
  if (result.length <= e) return;

  localStorage.setItem("NCPCurPage", e + 1);
  
  $("#pagenum").html((e + 1) + "/" + (result.length));
  for (var i in result[e]) {
    //var co = parseInt(Math.random() * Colors.length);
    for (var j in result[e][i].days)
      insertTable(Days[result[e][i].days[j]] + 1, result[e][i].schedule, result[e][i], i);
  }
  hookBlock();
}

var receivedPlan = (e, toPage=1, isStored=false) => {
  result = e;
  if (!isStored) {
    localStorage.setItem("NCPStorage", JSON.stringify(result));
    localStorage.setItem("NCPCurPage", 1);
  }

  if (e.length > 0) {
    curpage = toPage;
    initTable();
    showplan(curpage - 1);
  }
};

var preplan = () => {
  if (curpage > 1) {
    var topage = curpage - 1;
    while (topage >= 1) {
      var flag = true;
      for (var i in fixedCourse) {
        var hasNum = false;
        for (var j in result[topage - 1]) {
          if (result[topage - 1][j].classNum == fixedCourse[i]) hasNum = true;
        }
        if (!hasNum) {
          flag = false;
          break;
        }
      }
      if (flag) break;
      topage--;
      if (topage < 1) {
        return;
      }
    }
    curpage = topage;
    initTable();
    showplan(curpage - 1);
  }
}

var aftplan = () => {
  if (curpage < result.length) {
    var topage = curpage + 1;
    while (topage <= result.length) {
      var flag = true;
      for (var i in fixedCourse) {
        var hasNum = false;
        for (var j in result[topage - 1]) {
          if (result[topage - 1][j].classNum == fixedCourse[i]) hasNum = true;
        }
        if (!hasNum) {
          flag = false;
          break;
        }
      }
      if (flag) break;
      topage++;
      if (topage > result.length) {
        return;
      }
    }
    curpage = topage;
    initTable();
    showplan(curpage - 1);
  }
}

var genics = () => {
  if (curpage <= 0) return;
  else if (result.length <= 0) return;
  generateICS(result[curpage - 1]);
}

var loadHistory = () => {
  var flag = false;
  try {

    var datas = JSON.parse(localStorage.getItem("NCPData"));
    if (datas != null && "semester" in datas && "location" in datas) {
      flag = true;
      reqData = datas;
      displayData();
    }

    var carts = JSON.parse(localStorage.getItem("NCPCart"));
    if (carts != null) {
      flag = true;
      cart = carts;
      listcart(true);
    }

    var plans = JSON.parse(localStorage.getItem("NCPStorage"));
    var pages = localStorage.getItem("NCPCurPage");
    if (plans != null && pages != null) {
      flag = true;
      receivedPlan(plans, pages, true);
    }
    
    return flag;
  } catch(e) {
    return flag;
  }
}

var Toaston = (content, timer) => {
    $("#snackbar>p").text(content);
    $("#snackbar").removeClass("snackbar-hide");
    $("#snackbar").addClass("snackbar-show");
    if (timer && !isNaN(timer)) {
        if (ToastTimer) clearTimeout(ToastTimer);
        ToastTimer = setTimeout(() => {
            Toastoff();
        },timer);
    }
};

var Toastoff = () => {
    ToastTimer = null;
    $("#snackbar>p").text("");
    $("#snackbar").removeClass("snackbar-show");
    $("#snackbar").addClass("snackbar-hide");
}

$(window).on("load", () => {
  initTable();
  coreLoad();
  if (loadHistory()) {
    Toaston("History Loaded - NHibiki", 5000);
  } else {
    Toaston("NYUCourse by YuunoHibiki.", 5000);
  }
  
  $("#startplan").on("click", () => {startplan();});
  $("#icsdown").on("click", () => {genics();});
  $("#preva").on("click", () => {preplan();});
  $("#nexta").on("click", () => {aftplan();});
  $("#navinp").on("keyup", (e) => {search(e);});
  $("#navinp").on("focusin", (e) => {$("#courselist").css("display", "");});
  $("#courselist").on("focusout", (e) => {$("#courselist").css("display", "none");});
  $("#snackbar").on("click", (e) => {Toastoff();});
});


/*    ics     */

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
    for (var i in e.days) {
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
  for (var i in e) {
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