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

var switchData = (d, e) => {
  if (reqData.hasOwnProperty(d)) {
    reqData[d] = e;
    $(`tx#${d}`).html(e);
    return 1;
  }
  return 0;
};

var search = (e) => {
  if (reqData == $("#navinp").val()) return;
  reqData.data = $("#navinp").val();
  
  for (i in reqData) {
    if (reqData[i] == "" && i != "data") {
      $("#navinp").val("");
      reqData.data = "";
      $("#navinp").css("background-color", "indianred");
      e.preventDefault();
      return;
    }
  }
  $("#navinp").css("background-color", "");
  
  socket.emit("search", reqData);
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

var createBlock = (id, start, end, title, addon, color) => {
  var p = $(`#${id}`).html();
  p += `<div class="course" style="top:${start}%;height:${end-start}%;background-color:${Colors[color]}" course="${title}" addonData="${addon}">${end-start > 50 ? title : ""}</div>`
  $(`#${id}`).html(p);
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
  
  createBlock("cr_" + d + "_" + tv[0].hour, tv[0].minute / 60 * 100, 100, c.id, c.topic, co);
  for (var i = tv[0].hour + 1; i < tv[1].hour; i++) {
    createBlock("cr_" + d + "_" + i, 0, 100, c.id, c.topic, co);
  }
  if (tv[1].minute != 0)
    createBlock("cr_" + d + "_" + tv[1].hour, 0, tv[1].minute / 60 * 100, c.id, c.topic, co);
}

var hookBlock = () => {
  
}

var listcourse = (e) => {
  $("#courselist").html("");
  var myhtml = ""
  for (i in e) {
    myhtml += `<li><a href="javascript:addClass('${e[i].id}');"><b>${e[i].title}</b><br /><small>${e[i].id}</small></a></li><li class="divider"></li>`;
  }
  myhtml += `<li><a href='javascript:$("#courselist").css("display", "none");'><b>Close</b></a></li>`;
  $("#courselist").html(myhtml);
}

var listcart = () => {
  $("#cart").html("");
  var myhtml = "";
  for (i in cart) {
    myhtml += `<dl onclick="removecart(${i});" class="palette cartitem" style="background-color: ${Colors[i]}"><dt>${cart[i].id}</dt><dd>${cart[i].title}</dd></dl>`
  }
  $("#cart").html(myhtml);
}

var removecart = (e) => {
  cart.splice(e, 1);
  listcart();
}

var addClass = (id) => {
  if (!cachedCourse.hasOwnProperty(id)) return;
  
  cart.push(cachedCourse[id]);
  listcart();
}

var parseCourse = (raw) => {
  
  for (i in raw) {
    if (!cachedCourse.hasOwnProperty(raw[i].id)) cachedCourse[raw[i].id] = raw[i];
  }
  listcourse(raw);
}

var startplan = () => {
  socket.emit("plan", cart);
}

var showplan = (e) => {
  if (result.length <= e) return;
  
  $("#pagenum").html((e + 1) + "/" + (result.length));
  for (var i in result[e]) {
    var co = parseInt(Math.random() * Colors.length);
    for (var j in result[e][i].days)
      insertTable(Days[result[e][i].days[j]] + 1, result[e][i].schedule, result[e][i], co);
  }
  
}

$(window).on("load", () => {
  initTable();
});

$("#navinp").on("keyup", (e) => {
  search(e);
});

$("#navinp").on("focusin", (e) => {
  $("#courselist").css("display", "");
});

$("#courselist").on("focusout", (e) => {
  $("#courselist").css("display", "none");
});


var socket = io.connect(window.location.href.substring(0, window.location.href.length - 1));

socket.on("search", (e) => {
    parseCourse(e);
});

socket.on("plan", (e) => {
    result = e;
    if (e.length > 0) {
      curpage = 1;
      initTable();
      showplan(curpage - 1);
    }
});

var preplan = () => {
  if (curpage > 1) {
    curpage --;
    initTable();
    showplan(curpage - 1);
  }
}

var aftplan = () => {
  if (curpage < result.length) {
    curpage ++;
    initTable();
    showplan(curpage - 1);
  }
}