from app import *
app.app_context().push()
l = Lesson.query.get(2)
if l:
    print("TITLE:", l.title)
    print("---")
    print(l.content)
else:
    print("NO LESSON 2")
