#!/usr/bin/env python3
"""Update Lesson 2 content in the galilee.db database."""

import sqlite3
import sys

DB_PATH = "/opt/galilee-bible/galilee.db"

NEW_CONTENT = """## What the Bible Says About the End Times

The Bible provides clear teaching about the final events of human history. Here are the six key stages revealed in Scripture, following the pastor's teaching sequence:

### 1) **FIRST COMING OF CHRIST**

> "For unto you is born this day in the city of David a Saviour, which is Christ the Lord." — Luke 2:11

> "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth." — John 1:14

The First Coming of Christ is the foundation of God's redemptive plan. God sent His only Son into the world, born of a virgin, to live among us (Galatians 4:4). Jesus came not to condemn the world, but that the world through Him might be saved (John 3:17). He fulfilled the prophecies of the Old Testament and inaugurated the New Covenant through His life, death, and resurrection.

### 2) **CHURCH AGE / PRESENT AGE NOW**

> "And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it." — Matthew 16:18

> "And when the day of Pentecost was fully come, they were all with one accord in one place... And they were all filled with the Holy Ghost." — Acts 2:1-4

We are currently living in the Church Age, which began at Pentecost when the Holy Spirit was poured out upon believers. During this age, the church — the body of Christ — carries out the Great Commission, making disciples of all nations (Matthew 28:19-20). The mystery of the church, hidden in past ages, has now been revealed: that Gentiles are fellow heirs with Israel through the gospel (Ephesians 3:1-6).

### 3) **CHRIST COMES AND RECEIVES HIS PEOPLE — THE RAPTURE**

> "And if I go and prepare a place for you, I will come again and will take you to myself, that where I am you may be also." — John 14:3

> "For the Lord himself shall descend from heaven with a shout... and the dead in Christ shall rise first: Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air." — 1 Thessalonians 4:16-17

The Rapture is when Jesus Christ returns to gather His church. The dead in Christ will rise first, then believers who are alive will be caught up together to meet the Lord in the air. This transformation will happen in a moment, "in the twinkling of an eye" (1 Corinthians 15:51-52). Christ receives His people unto Himself.

### 4) **SECOND COMING OF CHRIST — APPEARS IN GLORY AND JUDGES**

> "Then will appear in heaven the sign of the Son of Man, and then all the tribes of the earth will mourn, and they will see the Son of Man coming on the clouds of heaven with power and great glory." — Matthew 24:30

> "And I saw heaven opened, and behold a white horse; and he that sat upon him was called Faithful and True, and in righteousness he doth judge and make war." — Revelation 19:11

The Second Coming is when Jesus returns visibly and powerfully to earth. He will come on a white horse as "Faithful and True," with a sharp sword proceeding from His mouth to strike down the nations (Revelation 19:11-16). The lawless one will be destroyed by the breath of Christ's mouth (2 Thessalonians 2:8). He comes to judge the nations and establish His kingdom.

### 5) **TRIBULATION / DECEPTION / LAWLESSNESS — 7 YEARS**

> "For then there will be great tribulation, such as has not been from the beginning of the world until now, no, and never will be." — Matthew 24:21

> "And he shall confirm the covenant with many for one week: and in the midst of the week he shall cause the sacrifice and the oblation to cease." — Daniel 9:27

The Tribulation is a seven-year period of unprecedented suffering and deception. False prophets will arise, performing signs and wonders to deceive even the elect if possible (Matthew 24:21-24). The "man of lawlessness" will exalt himself, proclaiming to be God (2 Thessalonians 2:3-4). The beast will make war on the saints (Revelation 13:7). Daniel's prophecy of the seventieth week describes this seven-year period of tribulation.

### 6) **MILLENNIUM — 1000 YEARS, SATAN LOCKED IN BOTTOMLESS PIT**

> "And I saw an angel come down from heaven, having the key of the bottomless pit and a great chain in his hand. And he laid hold on the dragon, that old serpent, which is the Devil, and Satan, and bound him a thousand years." — Revelation 20:1-2

> "The wolf also shall dwell with the lamb, and the leopard shall lie down with the kid; and the calf and the young lion and the fatling together; and a little child shall lead them." — Isaiah 11:6

The Millennium is the thousand-year reign of Christ on earth. Satan will be bound and cast into the bottomless pit for a thousand years (Revelation 20:1-3). During this time, Christ will reign with His saints, and there will be unprecedented peace and righteousness on the earth (Revelation 20:4-6). After the thousand years, Satan will be released briefly, then defeated forever and cast into the lake of fire (Revelation 20:7-10).

---

**Scripture Flow:**

**FIRST COMING OF CHRIST** → **CHURCH AGE / PRESENT AGE NOW** → **THE RAPTURE** (Christ receives His people) → **SECOND COMING OF CHRIST** (appears in glory and judges) → **TRIBULATION** (deception / lawlessness — 7 years) → **MILLENNIUM** (1000 years, Satan locked in bottomless pit)

---

This is the hope we have: Jesus came, He is building His church, and He will come again to receive His people, judge the world, and reign forever!"""

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Verify lesson 2 exists
    cur.execute("SELECT id, title FROM lessons WHERE id=2")
    row = cur.fetchone()
    if not row:
        print("ERROR: Lesson 2 not found!")
        sys.exit(1)

    print(f"Found Lesson 2: {row[1]}")

    # Update the content
    cur.execute("UPDATE lessons SET content=? WHERE id=2", (NEW_CONTENT,))
    conn.commit()

    # Verify
    cur.execute("SELECT content FROM lessons WHERE id=2")
    updated = cur.fetchone()
    if "FIRST COMING OF CHRIST" in updated[0] and "MILLENNIUM" in updated[0]:
        print("SUCCESS: Lesson 2 content updated with new timeline labels!")
        print(f"Content length: {len(updated[0])} characters")
    else:
        print("ERROR: Update may not have worked correctly.")
        sys.exit(1)

    conn.close()

if __name__ == "__main__":
    main()
