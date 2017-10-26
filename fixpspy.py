from pspy import pSpy

page = pSpy()
page.load("./rawPage/CSCI-SHU.html")
content = page.parse()
courses = content.queryAttr("id", "ACE_NYU_CLS_DTL_CLASS_NBR\$")
