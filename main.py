import os
import datetime
import json
import time

from selenium import webdriver
from selenium.webdriver.common.keys import Keys

class NYUSubmitter():
    def __init__(self):
        self.nyucourse = []
        self.netid = ""
        self.netpasswd = ""
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

    def saveCourses(self):
        filec = json.dumps({
            "Count" : len(self.nyucourse),
            "Content" : self.nyucourse
        })
        with open("nyucourse.json", "w") as f:
            f.write(filec)

if __name__ == "__main__":
    nyu = NYUSubmitter()
    nyu.intoAlbert()
    nyu.saveCourses()
