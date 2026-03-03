#!/usr/bin/env python3
import sys
import json
sys.path.insert(0, '/opt/galilee-bible')

from app import app, db, Question

questions_data = [
    {
        "question_text": "According to 1 Thessalonians 4:16-17, what will happen when the Lord descends from heaven?",
        "options": [
            "The dead in Christ will rise first",
            "The sun will be darkened",
            "The Antichrist will be revealed",
            "The earth will be destroyed"
        ],
        "correct_answer": "The dead in Christ will rise first",
        "order_num": 1
    },
    {
        "question_text": "In which book does it say 'I go to prepare a place for you. And if I go and prepare a place for you, I will come again'?",
        "options": [
            "Matthew",
            "John",
            "Revelation",
            "Romans"
        ],
        "correct_answer": "John",
        "order_num": 2
    },
    {
        "question_text": "According to Matthew 24:21, how does Jesus describe the tribulation?",
        "options": [
            "A time of peace and prosperity",
            "Great tribulation, such as has not been since the beginning of the world",
            "A short period of testing",
            "A time of signs and wonders"
        ],
        "correct_answer": "Great tribulation, such as has not been since the beginning of the world",
        "order_num": 3
    },
    {
        "question_text": "According to 2 Thessalonians 2:3-4, what must come before the day of Christ?",
        "options": [
            "The cosmic signs",
            "The new heaven and earth",
            "The falling away and the man of sin revealed",
            "The resurrection of the dead"
        ],
        "correct_answer": "The falling away and the man of sin revealed",
        "order_num": 4
    },
    {
        "question_text": "According to Joel 2:30-31, what cosmic signs will appear before the great and terrible day of the Lord?",
        "options": [
            "Earthquakes and floods",
            "Blood, fire, and pillars of smoke; the sun darkened and moon turned to blood",
            "Stars falling from heaven only",
            "Lightning and thunder"
        ],
        "correct_answer": "Blood, fire, and pillars of smoke; the sun darkened and moon turned to blood",
        "order_num": 5
    },
    {
        "question_text": "In Revelation 6:12-14, what happens when the sixth seal is opened?",
        "options": [
            "Peace comes to the earth",
            "Great earthquake, sun becomes black, moon like blood, stars fall",
            "The temple is rebuilt",
            "The righteous are raptured"
        ],
        "correct_answer": "Great earthquake, sun becomes black, moon like blood, stars fall",
        "order_num": 6
    },
    {
        "question_text": "According to Revelation 19:11-16, what is the name written on Jesus when He appears in glory?",
        "options": [
            "Prince of Peace",
            "King of Kings and Lord of Lords",
            "The Alpha and Omega",
            "The Good Shepherd"
        ],
        "correct_answer": "King of Kings and Lord of Lords",
        "order_num": 7
    },
    {
        "question_text": "In Matthew 25:31-46, when the Son of Man comes in His glory, how will He separate people?",
        "options": [
            "By their wealth and status",
            "As a shepherd separates sheep from goats",
            "By their nationality",
            "By their education"
        ],
        "correct_answer": "As a shepherd separates sheep from goats",
        "order_num": 8
    },
    {
        "question_text": "According to Revelation 20:11-15, what happens to those whose names are not found in the Book of Life?",
        "options": [
            "They are given a second chance",
            "They are cast into the lake of fire",
            "They cease to exist",
            "They remain in paradise"
        ],
        "correct_answer": "They are cast into the lake of fire",
        "order_num": 9
    },
    {
        "question_text": "According to Revelation 21:1-5, what does God promise to do in the new heaven and new earth?",
        "options": [
            "Establish a new temple",
            "Make all things new and wipe away every tear",
            "Return everything to the Garden of Eden",
            "Give everyone great wealth"
        ],
        "correct_answer": "Make all things new and wipe away every tear",
        "order_num": 10
    }
]

with app.app_context():
    # Check if questions already exist for Lesson 2
    existing = Question.query.filter_by(lesson_id=2).first()
    if existing:
        print(f"Questions already exist for Lesson 2. Clearing old questions...")
        Question.query.filter_by(lesson_id=2).delete()
        db.session.commit()
    
    # Add all questions
    for q_data in questions_data:
        question = Question(
            lesson_id=2,
            question_text=q_data["question_text"],
            question_type="multiple_choice",
            options_json=json.dumps(q_data["options"]),
            correct_answer=q_data["correct_answer"],
            order_num=q_data["order_num"]
        )
        db.session.add(question)
    
    db.session.commit()
    print(f"Successfully added {len(questions_data)} multiple-choice questions to Lesson #2 (End Times)")
    
    # Verify
    count = Question.query.filter_by(lesson_id=2).count()
    print(f"Total questions for Lesson #2: {count}")
