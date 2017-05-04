var app = require('express')()
    , server = require('http').createServer(app)
    , express = require('express')
    , io = require('socket.io').listen(server)
    , conf = require('./config.json');
var allcourse = {};
var snakes = [];
const Days = {
  "Mon": 0,
  "Tue": 1,
  "Wed": 2,
  "Thu": 3,
  "Fri": 4
}

var readConfig = () => {
    var CourseNum = 0;
    for (var s in conf) {
        allcourse[s] = {};
        for (var l in conf[s]) {
            try {
                allcourse[s][l] = require(conf[s][l]);
                CourseNum ++;
            } catch (er) {
                
            }
        }
    }
    console.log(CourseNum + " Alberts Loaded.");
}

readConfig();
server.listen(8888);

app.use(express.static('index'));

app.get('/', (req, res) => {
    res.sendfile('./index/index.html');
});

io.sockets.on('connection', function (socket) {
    socket.on("search", (e) => {
        socket.emit("search", searchCourse(e));
    });
    
    socket.on("plan", (e) => {
        socket.emit("plan", planCourse(e));
    });
});

var searchCourse = (e) => {
    if (e["data"] == "") return [];
    try {
      var course = allcourse[e["semester"]][e["location"]];
      var myc = [];
      var myid = {};
      for (var i = 0; i < course.Count; i++) {
        if (course.Content[i].topic.toLowerCase().indexOf(e["data"].toLowerCase()) != -1 || course.Content[i].instructor.toLowerCase().indexOf(e["data"].toLowerCase()) != -1) {
          if (!myid.hasOwnProperty(course.Content[i].id)) {
            myc.push({
              id: course.Content[i].id,
              title: course.Content[i].topic
            });
            myid[course.Content[i].id] = true;
          }
        }
      }
      return myc;
    } catch (er) {
      return [];
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

var sort = (a, b) => {
  return a.start - b.start;
}

var checkAva = (e) => {
  var mytime = [];
  for (i in e) {
    for (d in e[i].days) {
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
    for (cs in c[cn[s]]) {
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

var planCourse = (ep) => {
    try {
      var course = allcourse[ep["semester"]][ep["location"]];
      e = ep["cart"];
      var clen = 0;
      courses = {}
      coursename = []
      for (i in e) {
        if (courses.hasOwnProperty(e[i].id)) continue;
        courses[e[i].id] = [];
        courses[e[i].id+"-rec"] = [];
        courses[e[i].id+"-lab"] = [];
        for (c in course.Content) {
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
        if (courses[e[i].id].length > 0) {
          clen++;
          coursename.push(e[i].id);
        }
        else {
          delete courses[e[i].id];
        }
        if (courses[e[i].id+"-rec"].length > 0) {
          clen++;
          coursename.push(e[i].id+"-rec");
        }
        else {
          delete courses[e[i].id+"-rec"];
        }
        if (courses[e[i].id+"-lab"].length > 0) {
          clen++;
          coursename.push(e[i].id+"-lab");
        }
        else {
          delete courses[e[i].id+"-lab"];
        }
      }
      // Find All Possibilities
      if (clen > 10) return [];
      planner = [];
      plannerD(planner, courses, coursename, 0, clen, []);
      var i = 0;
      
      return planner;
    } catch (er) {
      return [];
    }
}