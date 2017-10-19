import json
import re

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

if __name__ == "__main__":
    f = {}
    with open("./nyucourse.json", "r", encoding="utf-8") as of:
        f = json.loads(of.read())
    m = Map()
    m.get_content()
    m.get_map(f["Content"])
    with open("./nyucourse.json", "w", encoding="utf-8") as of:
        of.write(json.dumps(f))

