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
        with open('class.txt', 'r') as f:
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
        for detail in origin:
            try:
                detail['topic'] = mapping[detail['id']]
            except Exception:
                pass
    
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
        self.logined = True

    def backToCourses(self, driver):
        driver.execute_script(
            "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'NYU_CLS_DERIVED_BACK');")

    def goToCourse(self, driver, number):
        driver.execute_script(
            "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'LINK1$" + str(number) + "');")

    def intoAlbert(self):
        if not self.logined:
            self.login()
        try:
            self.driver.get("http://albert.nyu.edu")
            time.sleep(2)

            self.driver.find_element_by_xpath("//*[@id=\"userid\"]").send_keys(self.netid)
            self.driver.find_element_by_xpath("//*[@id=\"pwd\"]").send_keys(self.netpasswd)
            self.driver.find_element_by_xpath("//*[@class=\"psloginbutton\"]").click()
            time.sleep(2)

            self.driver.find_element_by_xpath("//*[@title=\"Visit the Student Center for your Registration, Bursar, Financial Aid, and Personal Records\"]").click()
            time.sleep(2)

            self.driver.execute_script(
                "window.frames['TargetContent'].submitAction_win0(window.frames['TargetContent'].document.win0,'DERIVED_SSS_SCL_SSS_GO_4$83$');")
            time.sleep(2)

            self.driver.execute_script("window.frames['TargetContent'].document.querySelector('option[value=\"NYU Shanghai\"]').selected=true")
            self.driver.execute_script(
                "window.frames['TargetContent'].document.querySelector('option[value=\"NYU Shanghai\"]').selected=true")
            self.driver.execute_script(
                "window.frames['TargetContent'].document.querySelector('select[class=\"PSDROPDOWNLIST\"]').onchange()")
            time.sleep(2)

            try:
                for i in range(5, 50):
                    s = str(i)
                    time.sleep(1)
                    self.driver.execute_script("window.frames[\"TargetContent\"].document.querySelectorAll(\"a[ptlinktgt='pt_peoplecode']\")[" + s + "].click()")
                    time.sleep(1)
                    # Do Something...
                    MAXIC = 50
                    # time.sleep(10)
                    self.driver.switch_to.frame('TargetContent')
                    time.sleep(1)
                    CLASSNUM = self.driver.find_element_by_id("NYU_CLS_WRK_DESCR100").text
                    CLASSNUM = int(CLASSNUM[CLASSNUM.find("Total Class Count:") + 18:].strip())
                    NOWNUM = 0
                    try:
                        DocPage = self.driver.find_element_by_id("win0div$ICField3$0").text.split("\n")
                        for pg in DocPage:
                            if "-SHU " in pg and "description for" not in pg:
                                if self.docre.search(pg):
                                    pgid = self.docre.search(pg).group().strip()
                                    self.doc[pgid] = pg.replace(pgid, "").strip()
                    except Exception:
                        pass
                    for j in range(MAXIC):
                        try:
                            self.driver.execute_script(
                                "window.submitAction_win0(window.document.win0,'NYU_CLS_DERIVED_TERM$" + str(
                                    j) + "');")
                            time.sleep(1)
                            self.nyucourse.append(self.driver.find_element_by_id("ACE_NYU_CLS_DTL_CLASS_NBR$" + str(j)).text)
                            NOWNUM += 1
                            if NOWNUM >= CLASSNUM:
                                break
                        except Exception:
                            pass
                    self.driver.switch_to.parent_frame()
                    time.sleep(1)
                    self.backToCourses(self.driver)
                    time.sleep(1)
            except Exception as e:
                print("Inner Error:", e)
            print("Get Course Num:", str(len(self.nyucourse)))
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
        #a.get_content()
        #a.get_map(content)
        a.dump_map(content, self.doc, self.docre)
        filec = json.dumps({
            "Count" : len(content),
            "Content" : content
        })
        with open("nyucourse.json", "w") as f:
            f.write(filec)

if __name__ == "__main__":
    nyu = NYUSubmitter()
    nyu.intoAlbert()
    nyu.saveCourses()
