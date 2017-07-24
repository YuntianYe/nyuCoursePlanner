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
      Toaston("Please Select Semester and Location.", 5000);
      e.preventDefault();
      return;
    }
  }
  $("#navinp").css("background-color", "");
  Toastoff();
  
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
  
  var addon = `${c.topic}<br /><b>${c.instructor}</b>`;
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
  socket.emit("plan", {
      semester: reqData.semester,
      location: reqData.location,
      cart: cart
  });
}

var showplan = (e) => {
  if (result.length <= e) return;
  
  $("#pagenum").html((e + 1) + "/" + (result.length));
  for (var i in result[e]) {
    //var co = parseInt(Math.random() * Colors.length);
    for (var j in result[e][i].days)
      insertTable(Days[result[e][i].days[j]] + 1, result[e][i].schedule, result[e][i], i);
  }
  hookBlock();
}

$("#navinp").on("keyup", (e) => {
  search(e);
});

$("#navinp").on("focusin", (e) => {
  $("#courselist").css("display", "");
});

$("#courselist").on("focusout", (e) => {
  $("#courselist").css("display", "none");
});

var myURL = window.location.href.substring(0, window.location.href.length - 1);
var socket = io.connect(myURL);

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

socket.on("genics", (e) => {
  var icsurl = `${myURL}/${e}`;
  console.log(icsurl);
  window.open(icsurl);
})

var preplan = () => {
  if (curpage > 1) {
    var topage = curpage - 1;
    while (topage >= 1) {
      var flag = true;
      for (i in fixedCourse) {
        var hasNum = false;
        for (j in result[topage - 1]) {
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
      for (i in fixedCourse) {
        var hasNum = false;
        for (j in result[topage - 1]) {
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
  socket.emit("genics", result[curpage - 1]);
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

$("#snackbar").on("click", (e) => {
    Toastoff();
});

$(window).on("load", () => {
  initTable();
  Toaston("NYUCourse by YuunoHibiki.", 5000);
});