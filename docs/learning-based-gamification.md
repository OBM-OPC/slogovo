# Learning-based gamification

Slogovo treats rewards as feedback about durable learning. XP is explanatory per-attempt feedback, not a spendable currency, and the application has no hearts or paid retry loop.

## Rewarded signals

- **Word mastery:** only vocabulary at the spaced-repetition `mastered` state counts.
- **Review consistency:** achievements use distinct review dates, so repeating an easy card on one day cannot advance the badge.
- **Speaking and active recall:** productive attempts are counted separately from recognition.
- **Grammar skill:** only mastered lessons count toward grammar achievements; opening or merely completing lesson screens does not.
- **Real study time:** daily totals retain measured fractional minutes and active seconds. No fixed session duration is added.
- **Weekly goals:** a day counts only when its measured minutes reach the learner's selected daily target.
- **Streaks:** a lesson advances the streak only after a passed attempt with answered items and measured activity. A module click and a failed or empty lesson do not advance it.

## XP rules

XP requires a passed attempt, at least one authored exercise item, and measured active time. It is calculated from unique first-attempt correct items, productive correct items, at most 15 measured active minutes, and a mastery bonus. Deferred retries do not create additional XP items, failed attempts earn zero, and an empty click-through earns zero.

Automated tests lock these anti-farming rules and verify the complete achievement metric set.
