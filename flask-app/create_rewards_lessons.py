#!/usr/bin/env python3
"""Create all 6 Rewards in Heaven lessons + 50 exam questions."""
import json
from datetime import datetime, date, timedelta

def run():
    from app import app, db
    from models import User, Lesson, Question

    with app.app_context():
        admin = User.query.filter_by(username='pastor').first()
        admin_id = admin.id
        print(f"Admin: {admin.username} (id={admin_id})")

        base_date = date(2026, 2, 23)

        # ── LESSON 1 ──
        L1 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 1: The Foundation \u2014 Salvation vs. Rewards",
            lesson_date=base_date,
            description="Salvation is a free gift received by grace through faith. Rewards are earned by faithful service after salvation.",
            scripture_reference="Ephesians 2:8-9; 1 Corinthians 3:11-15",
            content=(
                "## The Foundation \u2014 Salvation vs. Rewards\n\n"
                "**Key Principle:** Salvation is a free gift received by grace through faith. "
                "Rewards are earned by faithful service after salvation. These are two completely "
                "separate biblical doctrines that must never be confused.\n\n---\n\n"
                "### Scripture References\n\n"
                "> \"For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: "
                "Not of works, lest any man should boast.\" \u2014 Ephesians 2:8-9\n\n"
                "> \"For other foundation can no man lay than that is laid, which is Jesus Christ. "
                "Now if any man build upon this foundation gold, silver, precious stones, wood, hay, stubble; "
                "Every man\u2019s work shall be made manifest: for the day shall declare it, because it shall be "
                "revealed by fire; and the fire shall try every man\u2019s work of what sort it is. If any man\u2019s "
                "work abide which he hath built thereupon, he shall receive a reward. If any man\u2019s work shall "
                "be burned, he shall suffer loss: but he himself shall be saved; yet so as by fire.\" "
                "\u2014 1 Corinthians 3:11-15\n\n---\n\n"
                "### Teaching Points\n\n"
                "1. Salvation is described as a \u201cgift\u201d (Ephesians 2:8). A gift cannot be earned or it ceases to be a gift.\n\n"
                "2. The foundation is Jesus Christ (1 Corinthians 3:11). No other foundation is acceptable.\n\n"
                "3. After salvation, believers build on that foundation. The quality of materials varies: "
                "**gold, silver, and precious stones** represent lasting, Spirit-led works; "
                "**wood, hay, and stubble** represent carnal, self-motivated works.\n\n"
                "4. Fire tests the **quality** \u2014 not the quantity \u2014 of a believer\u2019s works.\n\n"
                "5. A believer can lose all rewards and still be saved (\u201cyet so as by fire\u201d).\n\n---\n\n"
                "### Discussion Question\n\n"
                "*Why is it important to distinguish between salvation and rewards? "
                "What happens to our theology if we confuse them?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L1)
        db.session.flush()
        print(f"Lesson {L1.id}: {L1.title[:50]}...")

        # ── LESSON 2 ──
        L2 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 2: The Judgment Seat of Christ",
            lesson_date=base_date + timedelta(weeks=1),
            description="Every believer will stand before the Judgment Seat (Bema Seat) of Christ \u2014 not for condemnation, but for evaluation of their works done after salvation.",
            scripture_reference="2 Corinthians 5:10; Romans 14:10-12; Romans 8:1",
            content=(
                "## The Judgment Seat of Christ\n\n"
                "**Key Principle:** Every believer will stand before the Judgment Seat (Bema Seat) of Christ "
                "\u2014 not for condemnation, but for evaluation of their works done after salvation.\n\n---\n\n"
                "### Scripture References\n\n"
                "> \"For we must all appear before the judgment seat of Christ; that every one may receive "
                "the things done in his body, according to that he hath done, whether it be good or bad.\" "
                "\u2014 2 Corinthians 5:10\n\n"
                "> \"But why dost thou judge thy brother? or why dost thou set at nought thy brother? "
                "for we shall all stand before the judgment seat of Christ. For it is written, As I live, "
                "saith the Lord, every knee shall bow to me, and every tongue shall confess to God. "
                "So then every one of us shall give account of himself to God.\" \u2014 Romans 14:10-12\n\n"
                "> \"There is therefore now no condemnation to them which are in Christ Jesus, "
                "who walk not after the flesh, but after the Spirit.\" \u2014 Romans 8:1\n\n---\n\n"
                "### Teaching Points\n\n"
                "1. The word \u201call\u201d in 2 Corinthians 5:10 means **every believer without exception** will appear.\n\n"
                "2. This is **NOT** the Great White Throne Judgment of Revelation 20:11-15 (which is for unbelievers). "
                "The Bema Seat is a separate event exclusively for the saved.\n\n"
                "3. Believers will give account for things done \u201cin his body\u201d \u2014 meaning their earthly life after conversion.\n\n"
                "4. The evaluation includes both \u201cgood\u201d and \u201cbad\u201d \u2014 faithful service and wasted opportunity.\n\n"
                "5. The Bema Seat was the judge\u2019s platform at ancient Greek athletic games where victors received their crowns.\n\n"
                "6. Romans 8:1 confirms the Bema Seat is **not about condemnation**. The believer\u2019s sin debt was paid at Calvary.\n\n---\n\n"
                "### Discussion Question\n\n"
                "*How should the reality of standing before the Judgment Seat of Christ affect the way we live each day?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L2)
        db.session.flush()
        print(f"Lesson {L2.id}: {L2.title[:50]}...")

        # ── LESSON 3 ──
        L3 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 3: The Five Crowns",
            lesson_date=base_date + timedelta(weeks=2),
            description="Scripture names five specific crowns as rewards for believers who are faithful in distinct areas of Christian living and service.",
            scripture_reference="1 Corinthians 9:25-27; 1 Thessalonians 2:19-20; 2 Timothy 4:7-8; James 1:12; Revelation 2:10; 1 Peter 5:1-4",
            content=(
                "## The Five Crowns\n\n"
                "**Key Principle:** Scripture names five specific crowns as rewards for believers who are faithful "
                "in distinct areas of Christian living and service.\n\n---\n\n"
                "### 1) THE INCORRUPTIBLE CROWN \u2014 Self-Discipline\n\n"
                "> \"And every man that striveth for the mastery is temperate in all things. Now they do it to obtain "
                "a corruptible crown; but we an incorruptible. I therefore so run, not as uncertainly; so fight I, "
                "not as one that beateth the air: But I keep under my body, and bring it into subjection: lest that "
                "by any means, when I have preached to others, I myself should be a castaway.\" "
                "\u2014 1 Corinthians 9:25-27\n\n"
                "This crown is for believers who exercise discipline over their flesh, appetites, and worldly desires. "
                "The word \u201ccastaway\u201d (Greek: *adokimos*) means \u201cdisqualified\u201d from the prize, not from salvation.\n\n---\n\n"
                "### 2) THE CROWN OF REJOICING \u2014 Winning Souls\n\n"
                "> \"For what is our hope, or joy, or crown of rejoicing? Are not even ye in the presence of our "
                "Lord Jesus Christ at his coming? For ye are our glory and joy.\" \u2014 1 Thessalonians 2:19-20\n\n"
                "> \"And they that be wise shall shine as the brightness of the firmament; and they that turn many "
                "to righteousness as the stars for ever and ever.\" \u2014 Daniel 12:3\n\n"
                "This is the soul-winner\u2019s crown, given to those who faithfully share the gospel.\n\n---\n\n"
                "### 3) THE CROWN OF RIGHTEOUSNESS \u2014 Loving Christ\u2019s Return\n\n"
                "> \"I have fought a good fight, I have finished my course, I have kept the faith: Henceforth "
                "there is laid up for me a crown of righteousness, which the Lord, the righteous judge, shall give "
                "me at that day: and not to me only, but unto all them also that love his appearing.\" "
                "\u2014 2 Timothy 4:7-8\n\n"
                "This crown is for believers who live with an eager, expectant hope for the return of Jesus Christ.\n\n---\n\n"
                "### 4) THE CROWN OF LIFE \u2014 Enduring Trials\n\n"
                "> \"Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown "
                "of life, which the Lord hath promised to them that love him.\" \u2014 James 1:12\n\n"
                "> \"Fear none of those things which thou shalt suffer: behold, the devil shall cast some of you "
                "into prison, that ye may be tried; and ye shall have tribulation ten days: be thou faithful unto "
                "death, and I will give thee a crown of life.\" \u2014 Revelation 2:10\n\n"
                "The crown of life is for those who endure suffering, persecution, and trials without abandoning the faith.\n\n---\n\n"
                "### 5) THE CROWN OF GLORY \u2014 Faithful Pastoral Ministry\n\n"
                "> \"The elders which are among you I exhort... Feed the flock of God which is among you, taking "
                "the oversight thereof, not by constraint, but willingly; not for filthy lucre, but of a ready mind; "
                "Neither as being lords over God\u2019s heritage, but being ensamples to the flock. And when the chief "
                "Shepherd shall appear, ye shall receive a crown of glory that fadeth not away.\" \u2014 1 Peter 5:1-4\n\n"
                "This crown is for pastors and elders who shepherd God\u2019s people faithfully \u2014 willingly, sacrificially, and humbly.\n\n---\n\n"
                "### Discussion Question\n\n"
                "*Which of the five crowns challenges you the most personally, and why?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L3)
        db.session.flush()
        print(f"Lesson {L3.id}: {L3.title[:50]}...")

        # ── LESSON 4 ──
        L4 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 4: What We Do With Our Crowns",
            lesson_date=base_date + timedelta(weeks=3),
            description="The ultimate purpose of heavenly rewards is not self-glory but the privilege of worshipping Jesus by casting our crowns at His feet.",
            scripture_reference="Revelation 4:10-11",
            content=(
                "## What We Do With Our Crowns\n\n"
                "**Key Principle:** The ultimate purpose of heavenly rewards is not self-glory but the privilege "
                "of worshipping Jesus by casting our crowns at His feet.\n\n---\n\n"
                "### Scripture Reference\n\n"
                "> \"The four and twenty elders fall down before him that sat on the throne, and worship him "
                "that liveth for ever and ever, and cast their crowns before the throne, saying, Thou art worthy, "
                "O Lord, to receive glory and honour and power: for thou hast created all things, and for thy "
                "pleasure they are and were created.\" \u2014 Revelation 4:10-11\n\n---\n\n"
                "### Teaching Points\n\n"
                "1. The crowns are **real and tangible** \u2014 they can be cast before the throne.\n\n"
                "2. **You cannot cast what you do not have.** A believer with no crowns has nothing to offer "
                "in this act of worship.\n\n"
                "3. The words of worship declare that God alone is worthy of glory, honor, and power.\n\n"
                "4. This transforms our understanding of rewards: **striving for crowns is ultimately an act "
                "of love and worship**, not pride or selfishness.\n\n---\n\n"
                "### Discussion Question\n\n"
                "*How does knowing that crowns will be cast at Jesus\u2019 feet change your motivation for faithful service?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L4)
        db.session.flush()
        print(f"Lesson {L4.id}: {L4.title[:50]}...")

        # ── LESSON 5 ──
        L5 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 5: Additional Rewards \u2014 Authority and Treasure",
            lesson_date=base_date + timedelta(weeks=4),
            description="Beyond crowns, Scripture teaches that faithful believers will receive varying degrees of authority in the eternal kingdom and treasures stored in heaven.",
            scripture_reference="Luke 19:17-19; Matthew 25:21; Matthew 6:19-20",
            content=(
                "## Additional Rewards \u2014 Authority and Treasure\n\n"
                "**Key Principle:** Beyond crowns, Scripture teaches that faithful believers will receive varying "
                "degrees of authority in the eternal kingdom and treasures stored in heaven.\n\n---\n\n"
                "### Scripture References\n\n"
                "> \"And he said unto him, Well, thou good servant: because thou hast been faithful in a very "
                "little, have thou authority over ten cities.\" \u2014 Luke 19:17\n\n"
                "> \"His lord said unto him, Well done, thou good and faithful servant: thou hast been faithful "
                "over a few things, I will make thee ruler over many things: enter thou into the joy of thy lord.\" "
                "\u2014 Matthew 25:21\n\n"
                "> \"Lay not up for yourselves treasures upon earth, where moth and rust doth corrupt, and where "
                "thieves break through and steal: But lay up for yourselves treasures in heaven, where neither moth "
                "nor rust doth corrupt, and where thieves do not break through nor steal.\" \u2014 Matthew 6:19-20\n\n---\n\n"
                "### Teaching Points\n\n"
                "1. The parables of the pounds and talents show that rewards include **varying degrees of authority "
                "and responsibility** in the eternal kingdom.\n\n"
                "2. The reward is proportional to **faithfulness**, not to the size of the original gift.\n\n"
                "3. Jesus commands believers to invest in eternity (\u201clay up treasures in heaven\u201d). "
                "Every act of obedience and service is a heavenly deposit.\n\n---\n\n"
                "### Discussion Question\n\n"
                "*What does it mean practically to \u201clay up treasures in heaven\u201d in your daily life?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L5)
        db.session.flush()
        print(f"Lesson {L5.id}: {L5.title[:50]}...")

        # ── LESSON 6 ──
        L6 = Lesson(
            title="Rewards in Heaven \u2014 Lesson 6: The Warning \u2014 Rewards Can Be Lost",
            lesson_date=base_date + timedelta(weeks=5),
            description="Scripture solemnly warns that believers can lose rewards through unfaithfulness, even though their salvation remains secure.",
            scripture_reference="2 John 1:8; 1 Corinthians 3:15; Revelation 3:11; Hebrews 11:6",
            content=(
                "## The Warning \u2014 Rewards Can Be Lost\n\n"
                "**Key Principle:** Scripture solemnly warns that believers can lose rewards through unfaithfulness, "
                "even though their salvation remains secure.\n\n---\n\n"
                "### Scripture References\n\n"
                "> \"Look to yourselves, that we lose not those things which we have wrought, but that we receive "
                "a full reward.\" \u2014 2 John 1:8\n\n"
                "> \"If any man\u2019s work shall be burned, he shall suffer loss: but he himself shall be saved; "
                "yet so as by fire.\" \u2014 1 Corinthians 3:15\n\n"
                "> \"Behold, I come quickly: hold that fast which thou hast, that no man take thy crown.\" "
                "\u2014 Revelation 3:11\n\n"
                "> \"But without faith it is impossible to please him: for he that cometh to God must believe "
                "that he is, and that he is a rewarder of them that diligently seek him.\" \u2014 Hebrews 11:6\n\n---\n\n"
                "### Teaching Points\n\n"
                "1. John warns believers to \u201clook to yourselves\u201d \u2014 rewards require ongoing diligence and faithfulness.\n\n"
                "2. A believer\u2019s works can be entirely \u201cburned\u201d at the Bema Seat. The person is still saved but has nothing to show.\n\n"
                "3. Revelation 3:11 warns that a crown can be \u201ctaken\u201d \u2014 this speaks to the urgency of maintaining faithfulness until the end.\n\n"
                "4. **How we live after salvation has eternal consequences**, not for our destination, but for our reward.\n\n"
                "5. God Himself is a \u201crewarder.\u201d Pursuing rewards is not selfishness \u2014 it is faith in action (Hebrews 11:6).\n\n---\n\n"
                "### Memory Verse\n\n"
                "> \"But without faith it is impossible to please him: for he that cometh to God must believe "
                "that he is, and that he is a rewarder of them that diligently seek him.\" \u2014 Hebrews 11:6\n\n---\n\n"
                "### Discussion Question\n\n"
                "*How should the warning that rewards can be lost affect the urgency of our Christian walk?*"
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L6)
        db.session.flush()
        print(f"Lesson {L6.id}: {L6.title[:50]}...")

        db.session.commit()
        print(f"\nAll 6 lessons created!")
        print(f"IDs: L1={L1.id}, L2={L2.id}, L3={L3.id}, L4={L4.id}, L5={L5.id}, L6={L6.id}")

        # ── NOW ADD 50 EXAM QUESTIONS ──
        # Map exam sections to lesson IDs
        # Section A (Q1-10) -> L1, Section B (Q11-20) -> L2, Section C (Q21-35) -> L3
        # Section D (Q36-45) -> split L4/L5, Section E (Q46-50) -> L6

        questions = [
            # Section A - Salvation vs Rewards (L1)
            (L1.id, "According to Ephesians 2:8-9, salvation is:", "multiple_choice",
             ["Earned by consistent good works over time", "A gift of God received by grace through faith", "Given only to those who are baptized and keep the law", "Reserved for those who earn enough heavenly rewards"],
             "A gift of God received by grace through faith"),
            (L1.id, "In 1 Corinthians 3:11, the only foundation for the Christian life is:", "multiple_choice",
             ["The local church", "The Ten Commandments", "Jesus Christ", "The Apostle Peter"],
             "Jesus Christ"),
            (L1.id, "In 1 Corinthians 3:12, \u201cgold, silver, precious stones\u201d represent:", "multiple_choice",
             ["Literal wealth stored in heaven", "The three members of the Trinity", "Lasting, Spirit-led works done for God\u2019s glory", "Physical treasures buried in the temple"],
             "Lasting, Spirit-led works done for God\u2019s glory"),
            (L1.id, "In 1 Corinthians 3:12, \u201cwood, hay, stubble\u201d represent:", "multiple_choice",
             ["Building materials for heavenly mansions", "Carnal, self-motivated works that will not endure God\u2019s testing", "Sins that need to be confessed", "The works of unbelievers"],
             "Carnal, self-motivated works that will not endure God\u2019s testing"),
            (L1.id, "According to 1 Corinthians 3:13, what tests every believer\u2019s works?", "multiple_choice",
             ["The opinion of other Christians", "The number of years they served", "Fire, which reveals the quality of each work", "The amount of money they gave"],
             "Fire, which reveals the quality of each work"),
            (L1.id, "What happens to a believer whose works are all \u201cburned\u201d according to 1 Corinthians 3:15?", "multiple_choice",
             ["They lose their salvation entirely", "They go to purgatory to earn their way back", "They suffer loss of rewards but are still saved", "They are given a second chance to earn rewards"],
             "They suffer loss of rewards but are still saved"),
            (L1.id, "The phrase \u201cyet so as by fire\u201d in 1 Corinthians 3:15 means:", "multiple_choice",
             ["The believer is purified through suffering in hell", "The believer is saved, but barely\u2014with nothing to show for their service", "The believer must pass through literal fire to enter heaven", "The believer\u2019s faith will be tested by literal flames"],
             "The believer is saved, but barely\u2014with nothing to show for their service"),
            (L1.id, "Which statement best describes the biblical distinction between salvation and rewards?", "multiple_choice",
             ["Salvation and rewards are the same thing earned by good works", "Salvation is a free gift by grace; rewards are earned by faithful service after salvation", "Rewards replace salvation for those who work hard enough", "Only pastors receive rewards; all other believers just receive salvation"],
             "Salvation is a free gift by grace; rewards are earned by faithful service after salvation"),
            (L1.id, "Ephesians 2:10 says believers are \u201ccreated in Christ Jesus unto good works.\u201d This means:", "multiple_choice",
             ["Good works are required to maintain salvation", "Good works are the expected response to salvation, not the cause of it", "Good works are optional for the believer", "Good works are only for church leaders"],
             "Good works are the expected response to salvation, not the cause of it"),
            (L1.id, "If a Christian confuses salvation with rewards, the most likely result is:", "multiple_choice",
             ["A stronger prayer life", "Either legalism (trying to earn salvation) or carelessness (ignoring faithful service)", "Better evangelism", "Greater church attendance"],
             "Either legalism (trying to earn salvation) or carelessness (ignoring faithful service)"),

            # Section B - Judgment Seat (L2)
            (L2.id, "According to 2 Corinthians 5:10, who must appear before the Judgment Seat of Christ?", "multiple_choice",
             ["Only pastors and missionaries", "Only those who sinned after salvation", "Every believer without exception", "Only unbelievers"],
             "Every believer without exception"),
            (L2.id, "The purpose of the Judgment Seat of Christ is:", "multiple_choice",
             ["To determine who goes to heaven or hell", "To punish believers for their sins", "To evaluate believers\u2019 works for reward", "To decide if salvation was genuine"],
             "To evaluate believers\u2019 works for reward"),
            (L2.id, "The Judgment Seat of Christ is NOT the same as:", "multiple_choice",
             ["The Bema Seat", "The evaluation of believers\u2019 works", "The Great White Throne Judgment of Revelation 20:11-15", "The event described in Romans 14:10-12"],
             "The Great White Throne Judgment of Revelation 20:11-15"),
            (L2.id, "The Great White Throne Judgment (Revelation 20:11-15) is for:", "multiple_choice",
             ["Believers who lost their rewards", "Old Testament saints only", "Unbelievers who are judged and condemned", "Angels who fell with Satan"],
             "Unbelievers who are judged and condemned"),
            (L2.id, "Romans 8:1 declares \u201cthere is therefore now no condemnation\u201d for believers. This confirms that the Bema Seat is:", "multiple_choice",
             ["A judgment of condemnation for sin", "Not about condemnation, but about evaluation of service", "A place where believers can still be sent to hell", "Not a real event"],
             "Not about condemnation, but about evaluation of service"),
            (L2.id, "In Romans 14:12, Paul says \u201cevery one of us shall give account of himself to God.\u201d This means:", "multiple_choice",
             ["We will answer for other people\u2019s sins", "Only church leaders will give account", "Each individual believer is personally accountable for their own life and service", "God will only look at our last year of service"],
             "Each individual believer is personally accountable for their own life and service"),
            (L2.id, "The word \u201cBema\u201d in the ancient Greek world referred to:", "multiple_choice",
             ["A prison for criminals", "A judge\u2019s platform at athletic games where victors received prizes", "A place of execution", "A temple for worship"],
             "A judge\u2019s platform at athletic games where victors received prizes"),
            (L2.id, "At the Judgment Seat of Christ, believers are evaluated for things done:", "multiple_choice",
             ["Before they were born", "In a previous life", "In their body during their earthly life after conversion", "Only during church services"],
             "In their body during their earthly life after conversion"),
            (L2.id, "The evaluation at the Bema Seat includes:", "multiple_choice",
             ["Only the good things a believer did", "Only the bad things a believer did", "Both good and bad\u2014faithful service and wasted opportunity", "Nothing; everyone gets the same reward"],
             "Both good and bad\u2014faithful service and wasted opportunity"),
            (L2.id, "The sin debt of the believer was settled at:", "multiple_choice",
             ["The Bema Seat", "The Great White Throne", "Calvary (the cross of Christ)", "The moment of baptism"],
             "Calvary (the cross of Christ)"),

            # Section C - Five Crowns (L3)
            (L3.id, "The Incorruptible Crown (1 Corinthians 9:25-27) is given for:", "multiple_choice",
             ["Winning the most converts", "Self-discipline and mastery over the flesh", "Faithful pastoral ministry", "Enduring persecution"],
             "Self-discipline and mastery over the flesh"),
            (L3.id, "In 1 Corinthians 9:27, when Paul says he could become a \u201ccastaway,\u201d he means:", "multiple_choice",
             ["He could lose his salvation", "He could be disqualified from receiving the prize (reward), not from salvation", "He could be thrown out of the church", "He could lose his apostleship"],
             "He could be disqualified from receiving the prize (reward), not from salvation"),
            (L3.id, "Paul compares the Christian life to what in 1 Corinthians 9:25-26?", "multiple_choice",
             ["Farming and harvesting", "Building a house", "Running a race and boxing", "Fishing and sailing"],
             "Running a race and boxing"),
            (L3.id, "The Crown of Rejoicing (1 Thessalonians 2:19-20) is given for:", "multiple_choice",
             ["Singing in the church choir", "Enduring suffering with joy", "Winning souls to Christ through faithful evangelism", "Memorizing the most Scripture"],
             "Winning souls to Christ through faithful evangelism"),
            (L3.id, "Daniel 12:3 says those who \u201cturn many to righteousness\u201d will:", "multiple_choice",
             ["Receive extra mansions in heaven", "Shine as the stars for ever and ever", "Be exempt from the Bema Seat", "Become angels"],
             "Shine as the stars for ever and ever"),
            (L3.id, "According to 2 Timothy 4:8, the Crown of Righteousness is given to:", "multiple_choice",
             ["Those who never commit any sin after salvation", "Only the Apostle Paul", "All believers who love Christ\u2019s appearing", "Those who read the Bible every day without fail"],
             "All believers who love Christ\u2019s appearing"),
            (L3.id, "In 2 Timothy 4:7, Paul describes his life with three phrases. Which is NOT one of them?", "multiple_choice",
             ["I have fought a good fight", "I have finished my course", "I have built a great church", "I have kept the faith"],
             "I have built a great church"),
            (L3.id, "The Crown of Life (James 1:12) is promised to those who:", "multiple_choice",
             ["Live the longest earthly life", "Endure temptation and trials because they love God", "Never experience any suffering", "Tithe consistently"],
             "Endure temptation and trials because they love God"),
            (L3.id, "In Revelation 2:10, Jesus tells the church at Smyrna to be \u201cfaithful unto death.\u201d This means:", "multiple_choice",
             ["They should stay in church until they die of old age", "They should remain faithful even if it costs them their lives", "They should never leave their city", "They should fast until death"],
             "They should remain faithful even if it costs them their lives"),
            (L3.id, "The Crown of Glory (1 Peter 5:1-4) is specifically promised to:", "multiple_choice",
             ["All believers equally", "Only those who sing in the choir", "Faithful pastors and elders who shepherd God\u2019s flock", "Believers who donate the most money"],
             "Faithful pastors and elders who shepherd God\u2019s flock"),
            (L3.id, "According to 1 Peter 5:2, pastors should serve:", "multiple_choice",
             ["By constraint and for financial gain", "Willingly and with a ready mind, not for money", "Only when the church votes to keep them", "Only on Sundays and Wednesdays"],
             "Willingly and with a ready mind, not for money"),
            (L3.id, "In 1 Peter 5:3, pastors are warned NOT to:", "multiple_choice",
             ["Preach the gospel", "Lord their authority over God\u2019s people", "Visit the sick", "Pray for the congregation"],
             "Lord their authority over God\u2019s people"),
            (L3.id, "The \u201cchief Shepherd\u201d mentioned in 1 Peter 5:4 is:", "multiple_choice",
             ["The Apostle Peter", "The senior pastor of the largest church", "Jesus Christ", "Moses"],
             "Jesus Christ"),
            (L3.id, "How many specific crowns are named in Scripture?", "multiple_choice",
             ["Three", "Four", "Five", "Seven"],
             "Five"),
            (L3.id, "Which crown is associated with the phrase \u201cthat fadeth not away\u201d?", "multiple_choice",
             ["The Incorruptible Crown", "The Crown of Rejoicing", "The Crown of Life", "The Crown of Glory"],
             "The Crown of Glory"),

            # Section D - Crowns, Authority, Treasure (L4 and L5)
            (L4.id, "In Revelation 4:10-11, the twenty-four elders do what with their crowns?", "multiple_choice",
             ["Wear them as a sign of status forever", "Give them to other believers who had none", "Cast them before the throne in an act of worship", "Hide them under the altar for safekeeping"],
             "Cast them before the throne in an act of worship"),
            (L4.id, "The act of casting crowns before God\u2019s throne demonstrates that:", "multiple_choice",
             ["Rewards are meaningless", "The crowns are real, and the ultimate purpose of rewards is worship", "Only elders receive crowns", "God takes away all rewards eventually"],
             "The crowns are real, and the ultimate purpose of rewards is worship"),
            (L4.id, "A believer who arrives at the Bema Seat with no crowns:", "multiple_choice",
             ["Will be sent to hell", "Has nothing to cast before the throne in worship", "Will receive crowns anyway because God is merciful", "Can borrow crowns from other believers"],
             "Has nothing to cast before the throne in worship"),
            (L5.id, "In the Parable of the Pounds (Luke 19:17), the faithful servant who earned ten pounds was given:", "multiple_choice",
             ["Ten more pounds", "Authority over ten cities", "A crown of gold", "A seat next to the king"],
             "Authority over ten cities"),
            (L5.id, "The Parable of the Pounds teaches that rewards are based on:", "multiple_choice",
             ["How much you started with", "Your social status", "Faithfulness with what you were given", "How long you served"],
             "Faithfulness with what you were given"),
            (L5.id, "In Matthew 25:21, the faithful servant hears the words:", "multiple_choice",
             ["\u201cYou have earned your salvation\u201d", "\u201cWell done, thou good and faithful servant\u201d", "\u201cYou are now equal to the angels\u201d", "\u201cYour sins are forgiven\u201d"],
             "\u201cWell done, thou good and faithful servant\u201d"),
            (L5.id, "According to Matthew 6:19-20, Jesus commands believers to:", "multiple_choice",
             ["Store up treasures on earth for retirement", "Give away all possessions immediately", "Lay up treasures in heaven where they are secure forever", "Invest in real estate"],
             "Lay up treasures in heaven where they are secure forever"),
            (L5.id, "In Luke 19:17-19, the servant who earned five pounds received:", "multiple_choice",
             ["Five more pounds", "Authority over five cities", "The same reward as the ten-pound servant", "Nothing, because five was not enough"],
             "Authority over five cities"),
            (L5.id, "The parables of the pounds and talents indicate that in the eternal kingdom, believers will have:", "multiple_choice",
             ["No responsibilities whatsoever", "Exactly the same position regardless of faithfulness", "Varying degrees of authority and responsibility based on faithfulness", "Only rewards of rest and leisure"],
             "Varying degrees of authority and responsibility based on faithfulness"),
            (L5.id, "Hebrews 11:6 says God is \u201ca rewarder of them that diligently seek him.\u201d This means:", "multiple_choice",
             ["Pursuing rewards is selfishness", "God designed the reward system and invites believers to pursue it by faith", "Only professional ministers receive rewards", "Rewards are automatic and require no effort"],
             "God designed the reward system and invites believers to pursue it by faith"),

            # Section E - Warnings (L6)
            (L6.id, "According to 2 John 1:8, what should believers \u201clook to\u201d themselves about?", "multiple_choice",
             ["Making sure they are saved", "Ensuring they receive a full reward and don\u2019t lose what they\u2019ve built", "Checking their bank account", "Watching for false prophets only"],
             "Ensuring they receive a full reward and don\u2019t lose what they\u2019ve built"),
            (L6.id, "Revelation 3:11 warns believers to \u201chold that fast which thou hast, that no man take thy crown.\u201d This teaches:", "multiple_choice",
             ["Someone can physically steal your crown in heaven", "Crowns are not guaranteed\u2014faithfulness must be maintained to the end", "Only one person can earn each crown", "Crowns are given at birth, not earned"],
             "Crowns are not guaranteed\u2014faithfulness must be maintained to the end"),
            (L6.id, "Which of the following is TRUE about the doctrine of heavenly rewards?", "multiple_choice",
             ["Every believer receives the same rewards regardless of how they lived", "Rewards can be lost, but salvation cannot be lost", "Rewards and salvation are earned the same way\u2014by works", "The Bible does not teach anything about rewards"],
             "Rewards can be lost, but salvation cannot be lost"),
            (L6.id, "A Christian argues: \u201cPursuing rewards is selfish.\u201d The best biblical response is:", "multiple_choice",
             ["You\u2019re right, just focus on salvation", "Paul himself pursued the prize (1 Cor 9:24), and Hebrews 11:6 says God is a rewarder\u2014it is faith, not selfishness", "Rewards don\u2019t exist anyway", "Only pastors should care about rewards"],
             "Paul himself pursued the prize (1 Cor 9:24), and Hebrews 11:6 says God is a rewarder\u2014it is faith, not selfishness"),
            (L6.id, "The overarching purpose of heavenly rewards, according to the totality of Scripture, is:", "multiple_choice",
             ["To make some believers feel superior to others", "To give believers something to cast at Christ\u2019s feet in eternal worship of His worthiness", "To replace the need for salvation", "To reward only those who attended church every week"],
             "To give believers something to cast at Christ\u2019s feet in eternal worship of His worthiness"),
        ]

        for i, (lid, qtext, qtype, options, correct) in enumerate(questions, 1):
            q = Question(
                lesson_id=lid,
                question_text=qtext,
                question_type=qtype,
                order_num=i,
                options_json=json.dumps(options),
                correct_answer=correct
            )
            db.session.add(q)

        db.session.commit()
        print(f"Added {len(questions)} exam questions across all lessons!")
        print("DONE!")

if __name__ == '__main__':
    run()
