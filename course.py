import json
import re

class course:
    def __init__(self):
        self.topic = ''
        self.credit = -1
        self.classNum = -1
        self.session = ''
        self.section = ''
        self.status = 100
        self.instructor = ''
        self.schedule = ''
        self.days = []
        self.demo = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        self.pattern = re.compile('[0-9]+\.[0-9]{2} [A-Z]{2} - [0-9]+\.[0-9]{2} [A-Z]{2} ')

    def load_file(self, n):
        with open('nyucourse.json', 'r') as f:
            courses = json.loads(f.read())
        course = courses['Content'][n]
        #print(course)
        if 'Class Status: Open' in course:
            self.status = 1
        elif 'Class Status: Close' in course:
            self.status = -1
        else:
            self.status = 0

        start = course.find('Topic: ')
        if start != -1:
            self.topic = course[start + 7: course.find('|', start)]
            start = course.find('|', start) + 1
        else:
            self.topic = course[: course.find('|')]
            start = course.find('|') + 1
        self.credit = course[start: course.find('|', start)]
        start = course.find('|', start) + 1
        self.classNum = course[start + 8: course.find('|', start)]
        start = course.find('|', start) + 1
        self.session = course[start + 10: course.find('|', start)]
        start = course.find('|', start) + 1
        self.section = course[start + 10: course.find('Class Status:')]
        if self.pattern.search(course):
            self.schedule = self.pattern.search(course).group()
        pos = course.find(self.schedule)
        if 'with' in course[pos+len(self.schedule):pos+len(self.schedule)+5]:
            for i in course[pos+len(self.schedule)+5:]:
                if i != '\n':
                    self.instructor += i
                else:
                    break

        for day in self.demo:
            if day in course:
                self.days.append(day)



if __name__ == '__main__':
    classes = []
    with open('nyucourse.json', 'r') as f:
        courses = json.loads(f.read())
    print(courses['Count'])
    for num in range(courses['Count']):
        a = course()
        a.load_file(num)
        classes.append(a)
    print(len(classes))
    for item in classes:
        print(item.topic)
        print(item.credit)
        print(item.classNum)
        print(item.status)
        print(item.instructor)
        print(item.days)
        print(item.schedule)