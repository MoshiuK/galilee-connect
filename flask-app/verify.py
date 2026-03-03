from app import *
app.app_context().push()
qs = Question.query.filter_by(lesson_id=2).all()
print(f"{len(qs)} questions")
for q in qs:
    print(f"  Q{q.order_num}: {q.question_text[:60]}...")
l = Lesson.query.get(2)
if l:
    lines = l.content.split('\n')
    for line in lines:
        if 'RAPTURE' in line or 'TRIBULATION' in line or 'SIGNS' in line or 'SECOND' in line or 'JUDGMENT' in line or 'RESTORATION' in line:
            print(line)
