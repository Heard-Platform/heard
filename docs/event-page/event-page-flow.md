# Event Page Flow

See [event-page-flow.png](event-page-flow.png) for the full diagram.

## Steps

**Creator**

1. Creator opens event page
2. Creates an event room (e.g. "when to meet")
3. Ranting period opens

**Per participant (ranting phase)**

4. Participant opens room
   - First visit: empty state — "you haven't ranted yet"
     - Participant submits rant (text or voice)
     - LLM extraction call
     - Store structured availability JSON
     - Participant is now "caught up, waiting for others"
   - Already ranted: "caught up, waiting for others"

**End of ranting phase**

5. Ranting period ends (timer / manual / quorum)
6. LLM synthesis call
7. Write candidate dates as room statements
8. Discard raw rants (after event resolves)
9. Notification sent: "dates ready, come vote"

**Voting phase**

10. Participant returns
11. Room shows in "Needs your votes" state
12. Participant casts agree/disagree vote on each candidate date
13. Room moves to "caught up"
14. Consensus date picked
