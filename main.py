import os
import re
import datetime
import json
import time

from selenium import webdriver
from selenium.webdriver.common.keys import Keys

class Map:
    def __init__(self):
        self.map = {}
        self.feature_a = re.compile('-00[0-9]')
        self.feature_b = re.compile('W-[0-9]+')

    def get_content(self):
        with open('class.txt', 'r', encoding="utf-8") as f:
            topics = f.readlines()
        for topic in topics:
            if '-SHU' in topic and topic != '\n':
                topic = topic.split('\t')
                if self.feature_a.search(topic[1]):
                    topic[1] = topic[1].replace(self.feature_a.search(topic[1]).group(), '')
                if 'CCCF-SHU101W' in (topic[0] + topic[1]):
                    topic[1] = topic[1].replace('-', '')
                if '/' in topic[0]:
                    topic[0] = topic[0].split('/')
                    if topic[0][0] not in self.map or topic[0][1] not in self.map:
                        self.map[topic[0][0] + ' ' + topic[1]] = topic[2].strip()
                        self.map[topic[0][1] + ' ' + topic[1]] = topic[2].strip()
                else:
                    if topic[0] not in self.map:
                        self.map[topic[0] + ' ' + topic[1]] = topic[2].strip()

    def get_map(self, origin):
        mapping = self.map
        print("Candidate:", len(mapping))
        print("Target   :", len(origin))
        for detail in origin:
            if detail['id'] in mapping:
                detail['topic'] = mapping[detail['id']]
                print("Hit:", detail['id'])
    
    def dump_map(self, origin, omap, re):
        for detail in origin:
            if detail['id'] not in omap:
                continue
            if re.search(detail['title']):
                detail['topic'] = omap[detail['id']]
            else:
                if omap[detail['id']] not in detail['topic']:
                    detail['topic'] = omap[detail['id']] + " " + detail['topic']

class Course:
    def __init__(self):
        self.demo = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        self.pattern = re.compile('[0-9]+\.[0-9]{2} [A-Z]{2} - [0-9]+\.[0-9]{2} [A-Z]{2}')

    def parseCourse(self, course):
        c = {}
        if 'Class Status: Open' in course:
            c["status"] = 1
        elif 'Class Status: Close' in course:
            c["status"] = -1
        else:
            c["status"] = 0

        start = course.find('Topic: ')
        if start != -1:
            c["topic"] = course[start + 7: course.find('|', start)].strip()
            start = course.find('|', start) + 1
        else:
            c["topic"] = course[: course.find('|')].strip()
            start = course.find('|') + 1
        topc = c["topic"].split("\n")
        c["title"] = c["topic"].split("\n")[0].strip()
        if len(topc) > 1:
            c["id"] = c["topic"].split("\n")[1].strip()
        else:
            c["id"] = c["topic"].split("\n")[0].strip()
        c["credit"] = course[start: course.find('|', start)].strip()
        c["credit"] = c["credit"].replace("units", "").strip()
        cpos = course.find('Class#:')
        c["classNum"] = course[cpos + 7: course.find("|", cpos)].strip()
        cpos = course.find('Session:')
        c["session"] = course[cpos + 8: course.find("|", cpos)].strip()
        cpos = course.find('Section:')
        c["section"] = course[cpos + 8: course.find("\n", cpos)].strip()
        cpos = course.find('Component:')
        c["component"] = course[cpos + 10: course.find("\n", cpos)].strip()
        c["schedule"] = ""
        if self.pattern.search(course):
            c["schedule"] = self.pattern.search(course).group()
        c["schedule"].strip()
        pos = course.find(c["schedule"])
        c["instructor"] = ""
        if 'with' in course[pos+len(c["schedule"]):pos+len(c["schedule"])+5]:
            for i in course[pos+len(c["schedule"])+5:]:
                if i != '\n':
                    c["instructor"] += i
                else:
                    break
        c["days"] = []
        for day in self.demo:
            if day in course:
                c["days"].append(day)
        c["raw"] = course
        return c

class NYUSubmitter():
    def __init__(self):
        self.SLEEPTIME = 2
        self.doc = {}
        self.nyucourse = []
        self.netid = ""
        self.netpasswd = ""
        self.docre = re.compile('[A-Z]+\-[A-Z]+ [0-9]+\S+')
        self.logined = False
        self.options = webdriver.ChromeOptions()
        self.options.add_argument(
            '--user-agent=Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36')
        self.driver = webdriver.Chrome(chrome_options=self.options)

    def login(self):
        self.netid = input("Please Input Your Netid > ")
        self.netpasswd = input("Please Input Your Password > ")
        os.system("cls")
        os.system("clear")
        print("Albert Spyder Version 1.1")
        self.logined = True

    def backToCourses(self, driver):
        driver.execute_script(
            "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'NYU_CLS_DERIVED_BACK');")

    def goToCourse(self, driver, number):
        driver.execute_script(
            "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'LINK1$" + str(number) + "');")

    def intoAlbert(self, saveRaws=False):
        if not self.logined:
            self.login()
        try:
            self.driver.get("http://albert.nyu.edu")
            time.sleep(2)

            self.driver.find_element_by_xpath("//*[@id=\"userid\"]").send_keys(self.netid)
            self.driver.find_element_by_xpath("//*[@id=\"pwd\"]").send_keys(self.netpasswd)
            self.driver.find_element_by_xpath("//*[@class=\"psloginbutton\"]").click()
            time.sleep(5)

            # self.driver.find_element_by_xpath("//*[@title=\"Visit the Student Center for your Registration, Bursar, Financial Aid, and Personal Records\"]").click()
            self.driver.execute_script("window.document.querySelector('img[alt=\"Student Center\"]').click()")
            time.sleep(5)

            self.driver.execute_script(
                "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'DERIVED_SSS_SCL_SSS_GO_4$83$');")
            time.sleep(2)

            self.driver.execute_script("window.frames['TargetContent'].document.querySelector('option[value=\"NYU Shanghai\"]').selected=true")
            self.driver.execute_script(
                "window.frames['TargetContent'].document.querySelector('option[value=\"NYU Shanghai\"]').selected=true")
            self.driver.execute_script(
                "window.frames['TargetContent'].document.querySelector('select[class=\"PSDROPDOWNLIST\"]').onchange()")
            self.driver.execute_script("window.frames['TargetContent'].document.querySelector('input[id=\"NYU_CLS_WRK_NYU_SPRING\"]').click()")
            self.currentSemester = "2018"
            time.sleep(2)

            for i in range(5, 50):
                try:
                    s = str(i)
                    time.sleep(self.SLEEPTIME * 2)
                    self.driver.execute_script("window.frames[\"TargetContent\"].document.querySelectorAll(\"a[ptlinktgt='pt_peoplecode']\")[" + s + "].click()")
                    time.sleep(self.SLEEPTIME)
                    # Do Something...
                    MAXIC = 100
                    self.driver.switch_to.frame('TargetContent')
                    time.sleep(self.SLEEPTIME)
                    CLASSNUM = self.driver.find_element_by_id("NYU_CLS_WRK_DESCR100").text
                    pggStart = CLASSNUM.find("results for:")
                    pgTitle  = CLASSNUM[pggStart + 13:CLASSNUM.find("|", pggStart) - 1]
                    CLASSNUM = int(CLASSNUM[CLASSNUM.find("Total Class Count:") + 18:].strip())
                    NOWNUM = 0
                    pgPrint = self.driver.find_element_by_id("win0div$ICField3$0").text
                    try:
                        DocPage = pgPrint.split("\n")
                        for pg in DocPage:
                            if "-SHU " in pg and "description for" not in pg and "»" not in pg and "requisite" not in pg:
                                if pg.find("-SHU ") > 20:
                                    continue
                                if self.docre.search(pg):
                                    pgid = self.docre.search(pg).group().strip()
                                    if pgid not in self.doc:
                                        self.doc[pgid] = pg.replace(pgid, "").strip()
                    except Exception:
                        pass
                    pgRaw = self.driver.find_element_by_id("win0div$ICField3$0").get_attribute("innerHTML")
                    for j in range(MAXIC):
                        try:
                            elenum = "NYU_CLS_DERIVED_TERM$" + str(j)
                            if elenum in pgRaw:
                                self.driver.execute_script(
                                "window.submitAction_win0(window.document.win0,'" + elenum + "');")
                                time.sleep(self.SLEEPTIME)
                        except Exception:
                            pass
                    pgRaw = self.driver.find_element_by_id("win0div$ICField3$0").get_attribute("innerHTML")
                    if saveRaws:
                        with open("./rawPage/" + pgTitle + ".html", "w", encoding="utf-8") as f:
                            f.write(pgRaw)
                    for j in range(MAXIC):
                        try:
                            elenum = "ACE_NYU_CLS_DTL_CLASS_NBR$" + str(j)
                            if elenum in pgRaw:
                                theText = self.driver.find_element_by_id(elenum).text
                                if self.currentSemester in theText:
                                    self.nyucourse.append(theText)
                                NOWNUM += 1
                            if NOWNUM >= CLASSNUM:
                                break
                        except Exception:
                            pass
                    print("Get Course:", len(self.nyucourse))
                    if saveRaws:
                        with open("./rawPage/all.json", "w", encoding="utf-8") as f:
                            f.write(json.dumps(self.nyucourse))
                    self.driver.switch_to.parent_frame()
                    time.sleep(self.SLEEPTIME)
                    self.backToCourses(self.driver)
                    time.sleep(self.SLEEPTIME)
                except Exception as e:
                    print("Inner Error:", e)
            print("Get Total Course:", str(len(self.nyucourse)))
            # print(self.nyucourse)
        except Exception:
            print ("[Login Error]")
            self.logined = False

    def parse(self):
        parser = Course()
        lst = []
        for i in self.nyucourse:
            lst.append(parser.parseCourse(i))
        return lst
    
    def saveCourses(self):
        a = Map()
        content = self.parse()
        a.get_content()
        a.get_map(content)
        a.dump_map(content, self.doc, self.docre)
        filec = json.dumps({
            "Count" : len(content),
            "Content" : content
        })
        with open("nyucourse.json", "w", encoding="utf-8") as f:
            f.write(filec)

if __name__ == "__main__":
    nyu = NYUSubmitter()
    nyu.intoAlbert(True)
    nyu.saveCourses()
