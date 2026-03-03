#!/usr/bin/env python3
"""Create all 7 'What the Bible Says About Heaven' lessons + test questions."""
import json
from datetime import datetime, date, timedelta


def run():
    from app import app, db
    from models import User, Lesson, Question

    with app.app_context():
        admin = User.query.filter_by(username='pastor').first()
        admin_id = admin.id
        print(f"Admin: {admin.username} (id={admin_id})")

        # Start after the Rewards series (which ended Mar 30, 2026)
        base_date = date(2026, 4, 6)

        # ── LESSON 1: Will We Have Bodies in Heaven? ──
        L1 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 1: Will We Have Bodies in Heaven?",
            lesson_date=base_date,
            description="When believers enter eternity, they will receive glorified, resurrection bodies \u2014 not ghostly spirits, but real, transformed, physical bodies fashioned after the risen body of the Lord Jesus Christ.",
            scripture_reference="Philippians 3:20\u201321; 1 Corinthians 15:42\u201344; Luke 24:39",
            content=(
                "## Will We Have Bodies in Heaven?\n\n"
                "**The Biblical Claim:** When believers enter eternity, they will receive glorified, "
                "resurrection bodies \u2014 not ghostly spirits, but real, transformed, physical bodies "
                "fashioned after the risen body of the Lord Jesus Christ.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**Philippians 3:20\u201321**\n"
                "> \u201cFor our conversation is in heaven; from whence also we look for the Saviour, "
                "the Lord Jesus Christ: Who shall change our vile body, that it may be fashioned like "
                "unto his glorious body, according to the working whereby he is able even to subdue "
                "all things unto himself.\u201d\n\n"
                "**1 Corinthians 15:42\u201344**\n"
                "> \u201cSo also is the resurrection of the dead. It is sown in corruption; it is raised "
                "in incorruption: It is sown in dishonour; it is raised in glory: it is sown in weakness; "
                "it is raised in power: It is sown a natural body; it is raised a spiritual body. "
                "There is a natural body, and there is a spiritual body.\u201d\n\n"
                "**Luke 24:39**\n"
                "> \u201cBehold my hands and my feet, that it is I myself: handle me, and see; for a spirit "
                "hath not flesh and bones, as ye see me have.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Philippians teaches that this present body will be changed \u2014 not thrown away, but "
                "transformed into a glorious body like Christ\u2019s. Your identity stays. Your person "
                "remains. But the weakness, sickness, and decay are gone forever.\n\n"
                "First Corinthians 15 lays it out clearly: what goes into the ground in corruption "
                "comes back up in incorruption. What is buried in weakness is raised in power. There is "
                "a body in the resurrection \u2014 the Bible calls it a \u201cspiritual body.\u201d Not a ghost. A body.\n\n"
                "And in Luke 24, the risen Lord Jesus proved it. He told His disciples to touch Him. "
                "He had flesh and bones. He was the same Jesus \u2014 now glorified.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some say: \u201cWe\u2019ll just be spirits floating around heaven.\u201d\n\n"
                "But Luke 24:39 destroys that idea. Jesus said plainly: \u201cA spirit hath not flesh and "
                "bones, as ye see me have.\u201d If the risen Christ had a body, and Philippians says our "
                "body will be fashioned like His, then we will have bodies.\n\n"
                "The Bible teaches bodily resurrection \u2014 not disembodied existence.\n\n---\n\n"
                "### Bottom Line\n\n"
                "You will not be a ghost. You will not be a mist. You will have a glorified body \u2014 "
                "like Jesus Christ after He rose from the dead."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L1)
        db.session.flush()
        print(f"Lesson {L1.id}: {L1.title}")

        # ── LESSON 2: Will We Recognize Each Other? ──
        L2 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 2: Will We Recognize Each Other?",
            lesson_date=base_date + timedelta(weeks=1),
            description="Yes. Believers will know one another in heaven. Recognition is increased in eternity, not erased.",
            scripture_reference="1 Corinthians 13:12; Matthew 17:3\u20134; Matthew 8:11",
            content=(
                "## Will We Recognize Each Other?\n\n"
                "**The Biblical Claim:** Yes. Believers will know one another in heaven. Recognition is "
                "increased in eternity, not erased.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**1 Corinthians 13:12**\n"
                "> \u201cFor now we see through a glass, darkly; but then face to face: now I know in part; "
                "but then shall I know even as also I am known.\u201d\n\n"
                "**Matthew 17:3\u20134**\n"
                "> \u201cAnd, behold, there appeared unto them Moses and Elias talking with him. Then answered "
                "Peter, and said unto Jesus, Lord, it is good for us to be here: if thou wilt, let us make "
                "here three tabernacles; one for thee, and one for Moses, and one for Elias.\u201d\n\n"
                "**Matthew 8:11**\n"
                "> \u201cAnd I say unto you, That many shall come from the east and west, and shall sit down "
                "with Abraham, and Isaac, and Jacob, in the kingdom of heaven.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Paul says that right now we only see partially. But in eternity, we will know fully \u2014 "
                "even as we are fully known. Knowledge goes up, not down.\n\n"
                "On the Mount of Transfiguration, Peter, James, and John recognized Moses and Elijah \u2014 "
                "men they had never met in person. If they could recognize saints from centuries past, "
                "how much more will we recognize our own family and friends?\n\n"
                "And Jesus Himself said people will sit down with Abraham, Isaac, and Jacob. They are "
                "known by name. Identity is preserved.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some quote Matthew 22:30 and say: \u201cWe will be like angels, so we won\u2019t recognize anyone.\u201d\n\n"
                "**Matthew 22:30**\n"
                "> \u201cFor in the resurrection they neither marry, nor are given in marriage, but are as "
                "the angels of God in heaven.\u201d\n\n"
                "Read it carefully. Jesus was talking about marriage \u2014 not identity. He said there is "
                "no marrying in the resurrection. He did not say there is no recognition. The angels of "
                "God certainly know one another. Being \u201cas the angels\u201d refers to the marriage question, "
                "not to memory or identity.\n\n---\n\n"
                "### Bottom Line\n\n"
                "You will know your loved ones. They will know you. Memory is not erased in heaven \u2014 "
                "it is perfected."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L2)
        db.session.flush()
        print(f"Lesson {L2.id}: {L2.title}")

        # ── LESSON 3: Will We Be Married in Heaven? ──
        L3 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 3: Will We Be Married in Heaven?",
            lesson_date=base_date + timedelta(weeks=2),
            description="No. The institution of earthly marriage does not continue in the resurrection. Jesus stated this plainly.",
            scripture_reference="Matthew 22:29\u201330; Luke 20:34\u201336",
            content=(
                "## Will We Be Married in Heaven?\n\n"
                "**The Biblical Claim:** No. The institution of earthly marriage does not continue in "
                "the resurrection. Jesus stated this plainly.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**Matthew 22:29\u201330**\n"
                "> \u201cJesus answered and said unto them, Ye do err, not knowing the scriptures, nor the "
                "power of God. For in the resurrection they neither marry, nor are given in marriage, "
                "but are as the angels of God in heaven.\u201d\n\n"
                "**Luke 20:34\u201336**\n"
                "> \u201cAnd Jesus answering said unto them, The children of this world marry, and are given "
                "in marriage: But they which shall be accounted worthy to obtain that world, and the "
                "resurrection from the dead, neither marry, nor are given in marriage: Neither can they "
                "die any more: for they are equal unto the angels; and are the children of God, being "
                "the children of the resurrection.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "The Sadducees asked Jesus a trick question about marriage in the resurrection. Jesus did "
                "not dodge it. He gave a direct answer: in the resurrection, there is no marrying.\n\n"
                "Marriage was given for this present life \u2014 for companionship and for raising up seed. "
                "In the resurrection, there is no death. The purposes that required the institution of "
                "marriage in this world are fulfilled.\n\n"
                "This does not mean love disappears. It does not mean relationships disappear. It means "
                "the legal, covenantal structure of marriage belongs to this age, not the next.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some say: \u201cBut Genesis says \u2018one flesh\u2019 \u2014 isn\u2019t that eternal?\u201d\n\n"
                "**Genesis 2:24**\n"
                "> \u201cTherefore shall a man leave his father and his mother, and shall cleave unto his "
                "wife: and they shall be one flesh.\u201d\n\n"
                "Genesis describes marriage in the context of earthly life \u2014 a man leaving father and "
                "mother. That structure belongs to this world. Jesus, speaking with full authority, "
                "clarified what happens after the resurrection. Later revelation always explains and "
                "completes earlier revelation. Christ gave the final word on the matter.\n\n---\n\n"
                "### Bottom Line\n\n"
                "Marriage is a blessing for this life. In eternity, it is not needed. Jesus said it "
                "plainly, and the believer must accept it by faith."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L3)
        db.session.flush()
        print(f"Lesson {L3.id}: {L3.title}")

        # ── LESSON 4: Will I Know My Wife, Children, and Parents? ──
        L4 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 4: Will I Know My Wife, Children, and Parents?",
            lesson_date=base_date + timedelta(weeks=3),
            description="Yes. You will recognize and know your loved ones. Marriage as a covenant ends, but identity and memory remain.",
            scripture_reference="1 Corinthians 13:12; 1 Thessalonians 4:16\u201317; Luke 16:25",
            content=(
                "## Will I Know My Wife, Children, and Parents?\n\n"
                "**The Biblical Claim:** Yes. You will recognize and know your loved ones. Marriage as "
                "a covenant ends, but identity and memory remain.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**1 Corinthians 13:12**\n"
                "> \u201cFor now we see through a glass, darkly; but then face to face: now I know in part; "
                "but then shall I know even as also I am known.\u201d\n\n"
                "**1 Thessalonians 4:16\u201317**\n"
                "> \u201cFor the Lord himself shall descend from heaven with a shout, with the voice of "
                "the archangel, and with the trump of God: and the dead in Christ shall rise first: "
                "Then we which are alive and remain shall be caught up together with them in the clouds, "
                "to meet the Lord in the air: and so shall we ever be with the Lord.\u201d\n\n"
                "**Luke 16:25**\n"
                "> \u201cBut Abraham said, Son, remember that thou in thy lifetime receivedst thy good things, "
                "and likewise Lazarus evil things: but now he is comforted, and thou art tormented.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Paul says knowledge is increased in heaven \u2014 you will know fully, not partially. You "
                "will absolutely know your wife, your children, your mother, your father.\n\n"
                "In 1 Thessalonians, Paul says we are caught up \u201ctogether with them.\u201d That word "
                "\u201ctogether\u201d means something. It implies reunion and recognition. There would be no "
                "comfort in being \u201ctogether\u201d with people you do not know.\n\n"
                "Even in Luke 16, Abraham recognized Lazarus and the rich man. Memory existed beyond "
                "death. There is no verse anywhere in Scripture that says God erases your memory of the "
                "people you loved on earth.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some worry: \u201cBut Revelation 21:4 says former things pass away \u2014 doesn\u2019t that mean "
                "memory is erased?\u201d\n\n"
                "**Revelation 21:4**\n"
                "> \u201cAnd God shall wipe away all tears from their eyes; and there shall be no more death, "
                "neither sorrow, nor crying, neither shall there be any more pain: for the former things "
                "are passed away.\u201d\n\n"
                "Read the verse. It says sorrow, death, crying, and pain pass away. It does not say "
                "memory passes away. God removes the hurt \u2014 not the history. If memory were erased, "
                "1 Corinthians 13:12 could not promise that we will \u201cknow even as also I am known.\u201d\n\n---\n\n"
                "### Bottom Line\n\n"
                "You will know them. They will know you. The pain is gone, but the people remain."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L4)
        db.session.flush()
        print(f"Lesson {L4.id}: {L4.title}")

        # ── LESSON 5: Who Will Live in the Mansions? ──
        L5 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 5: Who Will Live in the Mansions?",
            lesson_date=base_date + timedelta(weeks=4),
            description="The mansions in the Father\u2019s house are prepared exclusively for those who believe on the Lord Jesus Christ. Entry is by faith alone.",
            scripture_reference="John 14:1\u20133; John 14:6; Revelation 21:27",
            content=(
                "## Who Will Live in the Mansions?\n\n"
                "**The Biblical Claim:** The mansions in the Father\u2019s house are prepared exclusively "
                "for those who believe on the Lord Jesus Christ. Entry is by faith alone, and only "
                "those written in the Lamb\u2019s Book of Life will enter.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**John 14:1\u20133**\n"
                "> \u201cLet not your heart be troubled: ye believe in God, believe also in me. In my "
                "Father\u2019s house are many mansions: if it were not so, I would have told you. I go to "
                "prepare a place for you. And if I go and prepare a place for you, I will come again, "
                "and receive you unto myself; that where I am, there ye may be also.\u201d\n\n"
                "**John 14:6**\n"
                "> \u201cJesus saith unto him, I am the way, the truth, and the life: no man cometh unto "
                "the Father, but by me.\u201d\n\n"
                "**Revelation 21:27**\n"
                "> \u201cAnd there shall in no wise enter into it any thing that defileth, neither whatsoever "
                "worketh abomination, or maketh a lie: but they which are written in the Lamb\u2019s book "
                "of life.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Jesus spoke directly to His disciples \u2014 believers \u2014 and said \u201cI go to prepare a place "
                "for you.\u201d The mansions are in the Father\u2019s house, and Jesus is the only way to the Father.\n\n"
                "Revelation makes it unmistakable: only those written in the Lamb\u2019s Book of Life will "
                "enter. Nothing unclean or false will pass through those gates.\n\n"
                "The mansions are not a general promise to all humanity. They are a specific promise to "
                "the blood-bought, born-again children of God.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some say: \u201cA loving God wouldn\u2019t exclude anyone.\u201d\n\n"
                "**John 8:44**\n"
                "> \u201cYe are of your father the devil, and the lusts of your father ye will do...\u201d\n\n"
                "Jesus Himself told religious people they were of their father the devil. He did not "
                "teach universal salvation. He taught that faith in Him is the only door. That is not "
                "cruelty \u2014 it is clarity. God provided the way. Man must walk through it.\n\n---\n\n"
                "### Bottom Line\n\n"
                "The mansions are for the redeemed. No Christ, no mansion. It is that simple."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L5)
        db.session.flush()
        print(f"Lesson {L5.id}: {L5.title}")

        # ── LESSON 6: What Happens to Family in Eternity? ──
        L6 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 6: What Happens to Family in Eternity?",
            lesson_date=base_date + timedelta(weeks=5),
            description="Earthly family structures do not continue as organizational units in eternity. All believers become one eternal family: the children of God.",
            scripture_reference="Matthew 12:48\u201350; Luke 20:35\u201336; Revelation 21:3",
            content=(
                "## What Happens to Family in Eternity?\n\n"
                "**The Biblical Claim:** Earthly family structures \u2014 husband and wife, parent and child \u2014 "
                "do not continue as organizational units in eternity. All believers become one eternal "
                "family: the children of God, dwelling together with Him.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**Matthew 12:48\u201350**\n"
                "> \u201cBut he answered and said unto him that told him, Who is my mother? and who are my "
                "brethren? And he stretched forth his hand toward his disciples, and said, Behold my "
                "mother and my brethren! For whosoever shall do the will of my Father which is in heaven, "
                "the same is my brother, and sister, and mother.\u201d\n\n"
                "**Luke 20:35\u201336**\n"
                "> \u201cBut they which shall be accounted worthy to obtain that world, and the resurrection "
                "from the dead, neither marry, nor are given in marriage: Neither can they die any more: "
                "for they are equal unto the angels; and are the children of God, being the children of "
                "the resurrection.\u201d\n\n"
                "**Revelation 21:3**\n"
                "> \u201cAnd I heard a great voice out of heaven saying, Behold, the tabernacle of God is "
                "with men, and he will dwell with them, and they shall be his people, and God himself "
                "shall be with them, and be their God.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Jesus redefined family. He said those who do the will of His Father are His true "
                "brothers, sisters, and mother. That is the eternal standard.\n\n"
                "Luke 20 says believers in the resurrection are called \u201cthe children of God\u201d \u2014 not "
                "children of their earthly parents. The identity shifts from earthly households to "
                "God\u2019s household.\n\n"
                "Revelation shows one unified people dwelling with God. Heaven is not divided into "
                "separate houses by last name. It is one redeemed family under one Father.\n\n"
                "The Bible never teaches that earthly nuclear families will live together as exclusive "
                "units in the mansions. Where Scripture is silent, we must not add.\n\n---\n\n"
                "### Addressing the Pushback\n\n"
                "Some assume: \u201cSince there are many mansions, each family will get one together.\u201d\n\n"
                "There is no verse that says this. John 14:2\u20133 says Christ prepares a place for "
                "believers \u2014 it does not describe family groupings. The mansions are in the Father\u2019s "
                "house, and the promise is to all who believe, not to earthly family units.\n\n---\n\n"
                "### Bottom Line\n\n"
                "Family is not destroyed. It is transformed. In eternity, the earthly structure fades, "
                "and the greater family of God takes its place. Christ is the center. God is the Father. "
                "Every believer is a brother and sister."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L6)
        db.session.flush()
        print(f"Lesson {L6.id}: {L6.title}")

        # ── LESSON 7: What Will We Desire in Heaven? ──
        L7 = Lesson(
            title="Heaven & Eternity \u2014 Lesson 7: What Will We Desire in Heaven?",
            lesson_date=base_date + timedelta(weeks=6),
            description="In heaven, the supreme desire of every believer will be to be with Christ. All other relationships and affections will be perfectly ordered under Him.",
            scripture_reference="John 17:24; 1 Thessalonians 4:17; 1 John 3:2",
            content=(
                "## What Will We Desire in Heaven?\n\n"
                "**The Biblical Claim:** In heaven, the supreme desire of every believer will be to be "
                "with Christ. All other relationships and affections will be perfectly ordered under Him, "
                "purified of sin and selfishness.\n\n---\n\n"
                "### What the Scripture Says\n\n"
                "**John 17:24**\n"
                "> \u201cFather, I will that they also, whom thou hast given me, be with me where I am; that "
                "they may behold my glory, which thou hast given me: for thou lovedst me before the "
                "foundation of the world.\u201d\n\n"
                "**1 Thessalonians 4:17**\n"
                "> \u201cThen we which are alive and remain shall be caught up together with them in the "
                "clouds, to meet the Lord in the air: and so shall we ever be with the Lord.\u201d\n\n"
                "**1 John 3:2**\n"
                "> \u201cBeloved, now are we the sons of God, and it doth not yet appear what we shall be: "
                "but we know that, when he shall appear, we shall be like him; for we shall see him "
                "as he is.\u201d\n\n---\n\n"
                "### Plain Explanation\n\n"
                "Jesus prayed that believers would be with Him and behold His glory. That is what heaven "
                "is about. The center of eternity is not our earthly relationships \u2014 it is Christ Himself.\n\n"
                "Paul\u2019s great promise is: \u201cSo shall we ever be with the Lord.\u201d That is the hope. "
                "That is the prize.\n\n"
                "And when we see Him, we will be like Him. Every sinful attachment, every selfish desire, "
                "every disordered affection is gone. What remains is pure, holy, Christ-centered love.\n\n"
                "This does not mean you will not care about people you loved on earth. It means your "
                "love for them will be purified and placed in its proper order \u2014 under the lordship of "
                "Christ, free from jealousy, possessiveness, and pain.\n\n---\n\n"
                "### Bottom Line\n\n"
                "Heaven\u2019s greatest joy is Christ. Everything else \u2014 every relationship, every memory, "
                "every affection \u2014 finds its perfect place in Him."
            ),
            status="published",
            created_by=admin_id
        )
        db.session.add(L7)
        db.session.flush()
        print(f"Lesson {L7.id}: {L7.title}")

        db.session.commit()
        print(f"\nAll 7 lessons created!")
        print(f"IDs: L1={L1.id}, L2={L2.id}, L3={L3.id}, L4={L4.id}, L5={L5.id}, L6={L6.id}, L7={L7.id}")

        # ── ADD TEST QUESTIONS ──
        # Section 1: Multiple Choice (8 questions)
        # Section 2: True or False (8 questions, as MC with True/False options)
        # Section 3: Fill in the Blank (5 questions)
        # Section 4: Short Answer / Essay (4 questions)
        # Section 5: Bonus (1 essay question)
        # Total: 26 questions

        questions = [
            # ── SECTION 1: MULTIPLE CHOICE ──
            # Q1 - Lesson 1
            (L1.id, "According to Philippians 3:21, what will happen to the believer\u2019s body?",
             "multiple_choice",
             ["It will be destroyed and replaced with a spirit",
              "It will be changed and fashioned like Christ\u2019s glorious body",
              "It will remain exactly the same as it is now",
              "It will become an angel\u2019s body"],
             "It will be changed and fashioned like Christ\u2019s glorious body"),

            # Q2 - Lesson 1
            (L1.id, "In Luke 24:39, what did the risen Jesus tell His disciples to prove He had a real body?",
             "multiple_choice",
             ["He told them to pray and believe",
              "He told them to read the Scriptures",
              "He told them to handle Him and see, because a spirit does not have flesh and bones",
              "He told them to wait until they got to heaven to understand"],
             "He told them to handle Him and see, because a spirit does not have flesh and bones"),

            # Q3 - Lesson 2
            (L2.id, "In Matthew 17:3\u20134, who appeared with Jesus on the Mount of Transfiguration?",
             "multiple_choice",
             ["Abraham and David",
              "Moses and Elijah",
              "Peter and Paul",
              "Adam and Eve"],
             "Moses and Elijah"),

            # Q4 - Lesson 2
            (L2.id, "According to 1 Corinthians 13:12, how will our knowledge change in eternity?",
             "multiple_choice",
             ["We will forget everything from this life",
              "We will know less than we know now",
              "We will know fully, even as we are fully known",
              "We will only know God and no one else"],
             "We will know fully, even as we are fully known"),

            # Q5 - Lesson 3
            (L3.id, "What did Jesus say about marriage in the resurrection (Matthew 22:30)?",
             "multiple_choice",
             ["Marriage will continue forever",
              "Only first marriages will continue",
              "They neither marry nor are given in marriage",
              "Marriage is optional in heaven"],
             "They neither marry nor are given in marriage"),

            # Q6 - Lesson 6
            (L6.id, "Who did Jesus say qualifies as His true family (Matthew 12:50)?",
             "multiple_choice",
             ["Only His blood relatives",
              "Whoever shall do the will of His Father in heaven",
              "Those who attend church every Sunday",
              "Those who are baptized as infants"],
             "Whoever shall do the will of His Father in heaven"),

            # Q7 - Lesson 5
            (L5.id, "According to John 14:6, how many ways are there to the Father?",
             "multiple_choice",
             ["Many ways for many people",
              "Two \u2014 faith and good works",
              "One \u2014 through Jesus Christ alone",
              "The Bible does not say"],
             "One \u2014 through Jesus Christ alone"),

            # Q8 - Lesson 5
            (L5.id, "Revelation 21:27 says who will enter the heavenly city?",
             "multiple_choice",
             ["Everyone who ever lived",
              "Those who lived a good moral life",
              "Those written in the Lamb\u2019s Book of Life",
              "Those from every religion"],
             "Those written in the Lamb\u2019s Book of Life"),

            # ── SECTION 2: TRUE OR FALSE (as multiple choice) ──
            # Q9 - Lesson 1
            (L1.id, "True or False: The Bible teaches that believers will be ghosts or spirits in heaven with no physical body.",
             "multiple_choice",
             ["True", "False"],
             "False"),

            # Q10 - Lesson 1
            (L1.id, "True or False: In 1 Corinthians 15, Paul teaches that the body is \u201csown a natural body\u201d and \u201craised a spiritual body.\u201d",
             "multiple_choice",
             ["True", "False"],
             "True"),

            # Q11 - Lesson 3
            (L3.id, "True or False: Jesus said in the resurrection, people will still be married to their earthly spouses.",
             "multiple_choice",
             ["True", "False"],
             "False"),

            # Q12 - Lesson 4
            (L4.id, "True or False: According to Luke 16:25, Abraham had memory of earthly events even after death.",
             "multiple_choice",
             ["True", "False"],
             "True"),

            # Q13 - Lesson 4
            (L4.id, "True or False: The Bible says God will erase all memories of our loved ones in heaven.",
             "multiple_choice",
             ["True", "False"],
             "False"),

            # Q14 - Lesson 4
            (L4.id, "True or False: Revelation 21:4 says that sorrow, death, crying, and pain will pass away.",
             "multiple_choice",
             ["True", "False"],
             "True"),

            # Q15 - Lesson 6
            (L6.id, "True or False: John 14:2\u20133 teaches that earthly families will each occupy their own mansion together.",
             "multiple_choice",
             ["True", "False"],
             "False"),

            # Q16 - Lesson 7
            (L7.id, "True or False: The central promise of heaven is that we will \u201cever be with the Lord\u201d (1 Thessalonians 4:17).",
             "multiple_choice",
             ["True", "False"],
             "True"),

            # ── SECTION 3: FILL IN THE BLANK ──
            # Q17 - Lesson 2
            (L2.id,
             "Fill in the blank (1 Corinthians 13:12): \u201cFor now we see through a glass, darkly; but then ______ __ ______: now I know in part; but then shall I ______ even as also I am ______.\u201d",
             "fill_blank",
             None,
             "face to face; know; known"),

            # Q18 - Lesson 1
            (L1.id,
             "Fill in the blank (Philippians 3:21): \u201cWho shall change our ______ body, that it may be fashioned like unto his ________ body.\u201d",
             "fill_blank",
             None,
             "vile; glorious"),

            # Q19 - Lesson 5
            (L5.id,
             "Fill in the blank (John 14:2): \u201cIn my Father\u2019s house are many ________: if it were not so, I would have told you. I go to ________ a ______ for you.\u201d",
             "fill_blank",
             None,
             "mansions; prepare; place"),

            # Q20 - Lesson 3
            (L3.id,
             "Fill in the blank (Matthew 22:30): \u201cFor in the resurrection they neither ________, nor are given in __________, but are as the ________ of God in heaven.\u201d",
             "fill_blank",
             None,
             "marry; marriage; angels"),

            # Q21 - Lesson 4
            (L4.id,
             "Fill in the blank (Revelation 21:4): \u201cAnd God shall wipe away all ______ from their eyes; and there shall be no more ______, neither ________, nor ________, neither shall there be any more ______: for the former things are passed away.\u201d",
             "fill_blank",
             None,
             "tears; death; sorrow; crying; pain"),

            # ── SECTION 4: SHORT ANSWER / ESSAY ──
            # Q22 - Lesson 1
            (L1.id,
             "How do we know from Scripture that believers will have real bodies in heaven and not just be spirits?",
             "essay", None, None),

            # Q23 - Lesson 3
            (L3.id,
             "Jesus said there is no marriage in the resurrection. Does this mean love disappears? Explain using Scripture.",
             "essay", None, None),

            # Q24 - Lesson 5
            (L5.id,
             "A friend tells you, \u201cEveryone goes to heaven because God is love.\u201d How would you respond using the Bible?",
             "essay", None, None),

            # Q25 - Lesson 7
            (L7.id,
             "What is the central focus and greatest joy of heaven according to the Bible? Support your answer with at least one verse.",
             "essay", None, None),

            # ── BONUS QUESTION ──
            # Q26 - Lesson 7
            (L7.id,
             "BONUS: Read John 17:24. In your own words, what was Jesus\u2019 prayer for every believer, and why does this matter for how we understand heaven?",
             "essay", None, None),
        ]

        for i, (lid, qtext, qtype, options, correct) in enumerate(questions, 1):
            q = Question(
                lesson_id=lid,
                question_text=qtext,
                question_type=qtype,
                order_num=i,
                options_json=json.dumps(options) if options else None,
                correct_answer=correct
            )
            db.session.add(q)

        db.session.commit()
        print(f"\nAdded {len(questions)} test questions across all lessons!")
        print("DONE!")


if __name__ == '__main__':
    run()
