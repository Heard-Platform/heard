-- Seed data for staging environment
-- Run this in the Supabase SQL editor for project nfkmzkyneasirebyqpgp
--
-- NOTE: Values are wrapped in to_jsonb('...'::text) because the app stores
-- data via JSON.stringify() into a JSONB column, producing double-encoded
-- JSON strings. This matches how the edge functions read/write data.

-- ============================================================
-- USERS (10 test users + keep existing dev user)
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES
('user:user-alice', to_jsonb('{"id":"user-alice","nickname":"Alice","email":"alice@test.com","score":450,"streak":5,"lastActive":1774300000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":true,"createdAt":1773000000000,"isAnonymous":false,"phoneVerified":true}'::text)),
('user:user-bob', to_jsonb('{"id":"user-bob","nickname":"Bob","email":"bob@test.com","score":320,"streak":3,"lastActive":1774350000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":true,"createdAt":1773100000000,"isAnonymous":false,"phoneVerified":true}'::text)),
('user:user-carol', to_jsonb('{"id":"user-carol","nickname":"Carol","email":"carol@test.com","score":890,"streak":12,"lastActive":1774370000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":true,"createdAt":1772500000000,"isAnonymous":false,"phoneVerified":true}'::text)),
('user:user-dave', to_jsonb('{"id":"user-dave","nickname":"Dave","email":"dave@test.com","score":150,"streak":1,"lastActive":1774200000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":false,"createdAt":1773500000000,"isAnonymous":false}'::text)),
('user:user-eve', to_jsonb('{"id":"user-eve","nickname":"Eve","email":"eve@test.com","score":1200,"streak":20,"lastActive":1774375000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":true,"createdAt":1771000000000,"isAnonymous":false,"phoneVerified":true}'::text)),
('user:user-frank', to_jsonb('{"id":"user-frank","nickname":"Frank","email":"frank@test.com","score":75,"streak":0,"lastActive":1774100000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":false,"createdAt":1773800000000,"isAnonymous":false}'::text)),
('user:user-grace', to_jsonb('{"id":"user-grace","nickname":"Grace","email":"grace@test.com","score":600,"streak":8,"lastActive":1774360000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":true,"createdAt":1772000000000,"isAnonymous":false,"phoneVerified":true}'::text)),
('user:user-hank', to_jsonb('{"id":"user-hank","nickname":"Hank","email":"hank@test.com","score":30,"streak":0,"lastActive":1774000000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":false,"createdAt":1774000000000,"isAnonymous":false}'::text)),
('user:user-anon1', to_jsonb('{"id":"user-anon1","nickname":"","email":"","score":10,"streak":0,"lastActive":1774300000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":false,"createdAt":1774200000000,"isAnonymous":true}'::text)),
('user:user-anon2', to_jsonb('{"id":"user-anon2","nickname":"","email":"","score":5,"streak":0,"lastActive":1774250000000,"isTestUser":true,"isDeveloper":false,"emailDigestsEnabled":false,"createdAt":1774250000000,"isAnonymous":true}'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Email lookups
INSERT INTO kv_store_f1a393b4 (key, value) VALUES
('user_email:alice@test.com', to_jsonb('user-alice'::text)),
('user_email:bob@test.com', to_jsonb('user-bob'::text)),
('user_email:carol@test.com', to_jsonb('user-carol'::text)),
('user_email:dave@test.com', to_jsonb('user-dave'::text)),
('user_email:eve@test.com', to_jsonb('user-eve'::text)),
('user_email:frank@test.com', to_jsonb('user-frank'::text)),
('user_email:grace@test.com', to_jsonb('user-grace'::text)),
('user_email:hank@test.com', to_jsonb('user-hank'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- COMMUNITIES / SUBHEARDS
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES
('subheard:politics', to_jsonb('{"name":"politics","adminId":"user-alice","isPrivate":false,"hostOnlyPosting":false}'::text)),
('subheard:technology', to_jsonb('{"name":"technology","adminId":"user-carol","isPrivate":false,"hostOnlyPosting":false}'::text)),
('subheard:sports', to_jsonb('{"name":"sports","adminId":"user-bob","isPrivate":false,"hostOnlyPosting":false}'::text)),
('subheard:philosophy', to_jsonb('{"name":"philosophy","adminId":"user-eve","isPrivate":false,"hostOnlyPosting":false}'::text)),
('subheard:local-community', to_jsonb('{"name":"local-community","adminId":"user-grace","isPrivate":false,"hostOnlyPosting":false}'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Community memberships
INSERT INTO kv_store_f1a393b4 (key, value) VALUES
('subheard_member:user-alice:politics', to_jsonb('{"userId":"user-alice","subHeard":"politics","joinedAt":1773000000000}'::text)),
('subheard_member:user-bob:politics', to_jsonb('{"userId":"user-bob","subHeard":"politics","joinedAt":1773100000000}'::text)),
('subheard_member:user-carol:politics', to_jsonb('{"userId":"user-carol","subHeard":"politics","joinedAt":1773200000000}'::text)),
('subheard_member:user-eve:politics', to_jsonb('{"userId":"user-eve","subHeard":"politics","joinedAt":1773300000000}'::text)),
('subheard_member:user-carol:technology', to_jsonb('{"userId":"user-carol","subHeard":"technology","joinedAt":1772500000000}'::text)),
('subheard_member:user-dave:technology', to_jsonb('{"userId":"user-dave","subHeard":"technology","joinedAt":1773500000000}'::text)),
('subheard_member:user-eve:technology', to_jsonb('{"userId":"user-eve","subHeard":"technology","joinedAt":1772000000000}'::text)),
('subheard_member:user-frank:technology', to_jsonb('{"userId":"user-frank","subHeard":"technology","joinedAt":1773800000000}'::text)),
('subheard_member:user-bob:sports', to_jsonb('{"userId":"user-bob","subHeard":"sports","joinedAt":1773100000000}'::text)),
('subheard_member:user-dave:sports', to_jsonb('{"userId":"user-dave","subHeard":"sports","joinedAt":1773500000000}'::text)),
('subheard_member:user-hank:sports', to_jsonb('{"userId":"user-hank","subHeard":"sports","joinedAt":1774000000000}'::text)),
('subheard_member:user-eve:philosophy', to_jsonb('{"userId":"user-eve","subHeard":"philosophy","joinedAt":1771000000000}'::text)),
('subheard_member:user-grace:philosophy', to_jsonb('{"userId":"user-grace","subHeard":"philosophy","joinedAt":1772000000000}'::text)),
('subheard_member:user-alice:philosophy', to_jsonb('{"userId":"user-alice","subHeard":"philosophy","joinedAt":1773000000000}'::text)),
('subheard_member:user-grace:local-community', to_jsonb('{"userId":"user-grace","subHeard":"local-community","joinedAt":1772000000000}'::text)),
('subheard_member:user-frank:local-community', to_jsonb('{"userId":"user-frank","subHeard":"local-community","joinedAt":1773800000000}'::text))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- ROOMS - Mix of topics, communities, activity levels
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- Room 1: Hot political debate, lots of engagement
('room:room-politics-1', to_jsonb('{"id":"room-politics-1","topic":"Should voting be mandatory for all citizens?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774300000000,"createdAt":1774200000000,"participants":["user-alice","user-bob","user-carol","user-eve","user-dave","user-grace","user-anon1"],"hostId":"user-alice","isActive":true,"mode":"realtime","subHeard":"politics","endTime":1774900000000,"totalVotes":33,"lastActivityAt":1774375000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-politics-1","rantFirst":true}'::text)),

-- Room 2: Tech debate, moderate engagement
('room:room-tech-1', to_jsonb('{"id":"room-tech-1","topic":"Is AI-generated code making junior developers worse at programming?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774250000000,"createdAt":1774150000000,"participants":["user-carol","user-dave","user-eve","user-frank"],"hostId":"user-carol","isActive":true,"mode":"realtime","subHeard":"technology","endTime":1774850000000,"totalVotes":12,"lastActivityAt":1774360000000,"rantFirst":true}'::text)),

-- Room 3: Sports, low engagement
('room:room-sports-1', to_jsonb('{"id":"room-sports-1","topic":"Should college athletes be paid the same as professional athletes?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774100000000,"createdAt":1774000000000,"participants":["user-bob","user-dave","user-hank"],"hostId":"user-bob","isActive":true,"mode":"realtime","subHeard":"sports","endTime":1774700000000,"totalVotes":5,"lastActivityAt":1774200000000,"rantFirst":true}'::text)),

-- Room 4: Philosophy, deep discussion
('room:room-phil-1', to_jsonb('{"id":"room-phil-1","topic":"Is free will an illusion created by our inability to perceive deterministic processes?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774350000000,"createdAt":1774300000000,"participants":["user-eve","user-grace","user-alice","user-carol"],"hostId":"user-eve","isActive":true,"mode":"realtime","subHeard":"philosophy","endTime":1774950000000,"totalVotes":16,"lastActivityAt":1774370000000,"rantFirst":true}'::text)),

-- Room 5: No community, general topic, very popular
('room:room-general-1', to_jsonb('{"id":"room-general-1","topic":"Remote work is better than office work for most knowledge workers","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774200000000,"createdAt":1774100000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank"],"hostId":"user-bob","isActive":true,"mode":"realtime","endTime":1774800000000,"totalVotes":48,"lastActivityAt":1774377000000,"rantFirst":true}'::text)),

-- Room 6: Finished/results phase
('room:room-finished-1', to_jsonb('{"id":"room-finished-1","topic":"Pineapple belongs on pizza","phase":"results","gameNumber":1,"roundStartTime":1773500000000,"createdAt":1773400000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve"],"hostId":"user-alice","isActive":false,"mode":"realtime","endTime":1774100000000,"totalVotes":15,"lastActivityAt":1774100000000,"rantFirst":true}'::text)),

-- Room 7: Local community topic
('room:room-local-1', to_jsonb('{"id":"room-local-1","topic":"Should our neighborhood allow short-term rentals like Airbnb?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774300000000,"createdAt":1774250000000,"participants":["user-grace","user-frank","user-anon2"],"hostId":"user-grace","isActive":true,"mode":"realtime","subHeard":"local-community","endTime":1774900000000,"totalVotes":9,"lastActivityAt":1774350000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-local-1","rantFirst":true}'::text)),

-- Room 8: Tech, brand new with no statements yet
('room:room-tech-2', to_jsonb('{"id":"room-tech-2","topic":"Will quantum computing make current encryption obsolete within 10 years?","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774377000000,"createdAt":1774376000000,"participants":["user-eve"],"hostId":"user-eve","isActive":true,"mode":"realtime","subHeard":"technology","endTime":1774980000000,"totalVotes":0,"lastActivityAt":1774377000000,"rantFirst":true}'::text)),

-- Room 9: Controversial topic, lots of disagreement
('room:room-general-2', to_jsonb('{"id":"room-general-2","topic":"Social media companies should be legally liable for content on their platforms","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774150000000,"createdAt":1774050000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank"],"hostId":"user-carol","isActive":true,"mode":"realtime","endTime":1774750000000,"totalVotes":30,"lastActivityAt":1774370000000,"rantFirst":true}'::text)),

-- Room 10: Politics, with description
('room:room-politics-2', to_jsonb('{"id":"room-politics-2","topic":"Universal basic income would reduce poverty more effectively than current welfare programs","description":"Discuss the economic and social implications of replacing existing welfare systems with UBI.","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774350000000,"createdAt":1774300000000,"participants":["user-alice","user-eve","user-grace","user-bob","user-carol"],"hostId":"user-eve","isActive":true,"mode":"realtime","subHeard":"politics","endTime":1774950000000,"totalVotes":20,"lastActivityAt":1774375000000,"rantFirst":true}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- STATEMENTS - Varied engagement levels
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- === Room 1: Politics - mandatory voting (high engagement) ===
('statement:room-politics-1:stmt-p1-1', to_jsonb('{"id":"stmt-p1-1","text":"Mandatory voting would force politicians to appeal to everyone, not just the most extreme voters who reliably show up.","roomId":"room-politics-1","author":"user-alice","round":1,"timestamp":1774210000000,"agrees":6,"disagrees":1,"passes":0,"superAgrees":2,"voters":{"user-bob":"agree","user-carol":"super_agree","user-eve":"agree","user-dave":"disagree","user-grace":"agree","user-anon1":"super_agree","user-alice":"agree"}}'::text)),
('statement:room-politics-1:stmt-p1-2', to_jsonb('{"id":"stmt-p1-2","text":"Forcing people to vote violates fundamental freedom of expression, which includes the right to NOT express an opinion.","roomId":"room-politics-1","author":"user-bob","round":1,"timestamp":1774215000000,"agrees":3,"disagrees":3,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-carol":"agree","user-eve":"disagree","user-dave":"agree","user-grace":"pass","user-anon1":"agree","user-bob":"disagree"}}'::text)),
('statement:room-politics-1:stmt-p1-3', to_jsonb('{"id":"stmt-p1-3","text":"Countries with mandatory voting like Australia have higher civic engagement overall and less political polarization.","roomId":"room-politics-1","author":"user-eve","round":1,"timestamp":1774220000000,"agrees":4,"disagrees":1,"passes":1,"superAgrees":1,"voters":{"user-alice":"super_agree","user-bob":"disagree","user-carol":"agree","user-dave":"pass","user-grace":"agree","user-anon1":"agree"}}'::text)),
('statement:room-politics-1:stmt-p1-4', to_jsonb('{"id":"stmt-p1-4","text":"Instead of mandatory voting, we should make election day a national holiday and expand early voting access.","roomId":"room-politics-1","author":"user-carol","round":1,"timestamp":1774225000000,"agrees":6,"disagrees":0,"passes":1,"superAgrees":3,"voters":{"user-alice":"super_agree","user-bob":"agree","user-eve":"super_agree","user-dave":"agree","user-grace":"super_agree","user-anon1":"agree","user-carol":"pass"}}'::text)),
('statement:room-politics-1:stmt-p1-5', to_jsonb('{"id":"stmt-p1-5","text":"Most people who dont vote are uninformed. Forcing them to vote would just add noise to election results.","roomId":"room-politics-1","author":"user-dave","round":1,"timestamp":1774230000000,"agrees":2,"disagrees":4,"passes":0,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"disagree","user-eve":"disagree","user-grace":"agree","user-anon1":"disagree"}}'::text)),

-- === Room 2: Tech - AI code (moderate engagement) ===
('statement:room-tech-1:stmt-t1-1', to_jsonb('{"id":"stmt-t1-1","text":"Junior devs who rely on AI for code generation skip the struggle phase that builds deep understanding of fundamentals.","roomId":"room-tech-1","author":"user-carol","round":1,"timestamp":1774160000000,"agrees":3,"disagrees":1,"passes":0,"superAgrees":1,"voters":{"user-dave":"agree","user-eve":"super_agree","user-frank":"disagree","user-carol":"agree"}}'::text)),
('statement:room-tech-1:stmt-t1-2', to_jsonb('{"id":"stmt-t1-2","text":"AI code generation is just the latest version of the same panic people had about Stack Overflow, IDEs with autocomplete, and high-level languages.","roomId":"room-tech-1","author":"user-frank","round":1,"timestamp":1774165000000,"agrees":1,"disagrees":2,"passes":1,"superAgrees":0,"voters":{"user-carol":"disagree","user-dave":"pass","user-eve":"disagree","user-frank":"agree"}}'::text)),
('statement:room-tech-1:stmt-t1-3', to_jsonb('{"id":"stmt-t1-3","text":"The real problem isnt AI-generated code itself but that companies are using it to justify hiring fewer seniors to mentor juniors.","roomId":"room-tech-1","author":"user-eve","round":1,"timestamp":1774170000000,"agrees":4,"disagrees":0,"passes":0,"superAgrees":2,"voters":{"user-carol":"super_agree","user-dave":"agree","user-frank":"agree","user-eve":"super_agree"}}'::text)),

-- === Room 3: Sports - college pay (low engagement) ===
('statement:room-sports-1:stmt-s1-1', to_jsonb('{"id":"stmt-s1-1","text":"College athletes generate billions in revenue for their schools. They deserve a fair share of that money.","roomId":"room-sports-1","author":"user-bob","round":1,"timestamp":1774010000000,"agrees":2,"disagrees":0,"passes":1,"superAgrees":1,"voters":{"user-dave":"super_agree","user-hank":"pass","user-bob":"agree"}}'::text)),
('statement:room-sports-1:stmt-s1-2', to_jsonb('{"id":"stmt-s1-2","text":"A free education worth $200k+ IS payment. Not every athlete needs to be paid like a pro.","roomId":"room-sports-1","author":"user-hank","round":1,"timestamp":1774020000000,"agrees":1,"disagrees":1,"passes":0,"superAgrees":0,"voters":{"user-bob":"disagree","user-dave":"agree"}}'::text)),

-- === Room 4: Philosophy - free will (thoughtful) ===
('statement:room-phil-1:stmt-ph1-1', to_jsonb('{"id":"stmt-ph1-1","text":"Neuroscience shows our brains make decisions before we become consciously aware of them. The feeling of choice is retrospective.","roomId":"room-phil-1","author":"user-eve","round":1,"timestamp":1774310000000,"agrees":2,"disagrees":1,"passes":1,"superAgrees":1,"voters":{"user-grace":"agree","user-alice":"super_agree","user-carol":"disagree","user-eve":"pass"}}'::text)),
('statement:room-phil-1:stmt-ph1-2', to_jsonb('{"id":"stmt-ph1-2","text":"Even if the universe is deterministic, free will is a useful framework for moral responsibility and social cooperation.","roomId":"room-phil-1","author":"user-grace","round":1,"timestamp":1774315000000,"agrees":3,"disagrees":0,"passes":1,"superAgrees":2,"voters":{"user-eve":"super_agree","user-alice":"agree","user-carol":"super_agree","user-grace":"pass"}}'::text)),
('statement:room-phil-1:stmt-ph1-3', to_jsonb('{"id":"stmt-ph1-3","text":"Quantum mechanics introduces genuine randomness at the subatomic level, which undermines strict determinism even if it doesnt prove free will.","roomId":"room-phil-1","author":"user-alice","round":1,"timestamp":1774320000000,"agrees":2,"disagrees":1,"passes":1,"superAgrees":0,"voters":{"user-eve":"agree","user-grace":"disagree","user-carol":"agree","user-alice":"pass"}}'::text)),
('statement:room-phil-1:stmt-ph1-4', to_jsonb('{"id":"stmt-ph1-4","text":"The question itself might be meaningless. Free will vs determinism could be a false dichotomy created by language limitations.","roomId":"room-phil-1","author":"user-carol","round":1,"timestamp":1774325000000,"agrees":1,"disagrees":1,"passes":2,"superAgrees":0,"voters":{"user-eve":"pass","user-grace":"agree","user-alice":"disagree","user-carol":"pass"}}'::text)),

-- === Room 5: General - remote work (very popular) ===
('statement:room-general-1:stmt-g1-1', to_jsonb('{"id":"stmt-g1-1","text":"Remote work eliminates commute time, giving workers 5-10 extra hours per week. Thats an enormous quality of life improvement.","roomId":"room-general-1","author":"user-alice","round":1,"timestamp":1774110000000,"agrees":7,"disagrees":0,"passes":1,"superAgrees":4,"voters":{"user-bob":"super_agree","user-carol":"agree","user-dave":"super_agree","user-eve":"agree","user-frank":"super_agree","user-grace":"agree","user-hank":"pass","user-alice":"super_agree"}}'::text)),
('statement:room-general-1:stmt-g1-2', to_jsonb('{"id":"stmt-g1-2","text":"Office culture creates organic mentorship and collaboration that video calls simply cannot replicate.","roomId":"room-general-1","author":"user-hank","round":1,"timestamp":1774115000000,"agrees":3,"disagrees":4,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"disagree","user-carol":"agree","user-dave":"agree","user-eve":"disagree","user-frank":"agree","user-grace":"disagree","user-hank":"pass"}}'::text)),
('statement:room-general-1:stmt-g1-3', to_jsonb('{"id":"stmt-g1-3","text":"The best model is hybrid: 2-3 days in office for collaboration, rest remote for deep focus work.","roomId":"room-general-1","author":"user-carol","round":1,"timestamp":1774120000000,"agrees":5,"disagrees":2,"passes":1,"superAgrees":1,"voters":{"user-alice":"disagree","user-bob":"agree","user-dave":"agree","user-eve":"super_agree","user-frank":"agree","user-grace":"agree","user-hank":"pass","user-carol":"disagree"}}'::text)),
('statement:room-general-1:stmt-g1-4', to_jsonb('{"id":"stmt-g1-4","text":"Companies pushing return-to-office are really just justifying expensive real estate leases, not improving productivity.","roomId":"room-general-1","author":"user-eve","round":1,"timestamp":1774125000000,"agrees":6,"disagrees":1,"passes":1,"superAgrees":3,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"agree","user-dave":"disagree","user-frank":"agree","user-grace":"super_agree","user-hank":"pass","user-eve":"agree"}}'::text)),
('statement:room-general-1:stmt-g1-5', to_jsonb('{"id":"stmt-g1-5","text":"Remote work has been devastating for new graduates who need in-person guidance to develop professional skills.","roomId":"room-general-1","author":"user-frank","round":1,"timestamp":1774130000000,"agrees":4,"disagrees":3,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"agree","user-dave":"agree","user-eve":"disagree","user-grace":"agree","user-hank":"pass","user-frank":"disagree"}}'::text)),
('statement:room-general-1:stmt-g1-6', to_jsonb('{"id":"stmt-g1-6","text":"Remote work is a privilege that mostly benefits tech workers. Most jobs simply cannot be done remotely.","roomId":"room-general-1","author":"user-dave","round":1,"timestamp":1774135000000,"agrees":3,"disagrees":3,"passes":2,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"pass","user-carol":"agree","user-eve":"disagree","user-frank":"agree","user-grace":"agree","user-hank":"pass","user-dave":"disagree"}}'::text)),

-- === Room 6: Finished - pineapple pizza ===
('statement:room-finished-1:stmt-f1-1', to_jsonb('{"id":"stmt-f1-1","text":"Sweet and savory is a classic flavor combination found in cuisines worldwide. Pineapple on pizza is no different.","roomId":"room-finished-1","author":"user-alice","round":1,"timestamp":1773410000000,"agrees":3,"disagrees":2,"passes":0,"superAgrees":1,"voters":{"user-bob":"disagree","user-carol":"agree","user-dave":"super_agree","user-eve":"agree","user-alice":"disagree"}}'::text)),
('statement:room-finished-1:stmt-f1-2', to_jsonb('{"id":"stmt-f1-2","text":"The moisture from pineapple makes the crust soggy. Its a textural disaster regardless of taste.","roomId":"room-finished-1","author":"user-bob","round":1,"timestamp":1773415000000,"agrees":2,"disagrees":3,"passes":0,"superAgrees":0,"voters":{"user-alice":"disagree","user-carol":"disagree","user-dave":"agree","user-eve":"disagree","user-bob":"agree"}}'::text)),
('statement:room-finished-1:stmt-f1-3', to_jsonb('{"id":"stmt-f1-3","text":"This debate has been going on for decades and the fact that Hawaiian pizza is still popular everywhere proves the people have spoken.","roomId":"room-finished-1","author":"user-carol","round":1,"timestamp":1773420000000,"agrees":4,"disagrees":1,"passes":0,"superAgrees":2,"voters":{"user-alice":"super_agree","user-bob":"disagree","user-dave":"agree","user-eve":"super_agree","user-carol":"agree"}}'::text)),

-- === Room 7: Local - Airbnb ===
('statement:room-local-1:stmt-l1-1', to_jsonb('{"id":"stmt-l1-1","text":"Short-term rentals drive up housing costs for actual residents. Our neighbors shouldnt be priced out so tourists have cheap stays.","roomId":"room-local-1","author":"user-grace","round":1,"timestamp":1774260000000,"agrees":2,"disagrees":0,"passes":1,"superAgrees":1,"voters":{"user-frank":"super_agree","user-anon2":"agree","user-grace":"pass"}}'::text)),
('statement:room-local-1:stmt-l1-2', to_jsonb('{"id":"stmt-l1-2","text":"Homeowners should be free to do what they want with their property. Banning Airbnb is government overreach.","roomId":"room-local-1","author":"user-frank","round":1,"timestamp":1774265000000,"agrees":1,"disagrees":1,"passes":1,"superAgrees":0,"voters":{"user-grace":"disagree","user-anon2":"pass","user-frank":"agree"}}'::text)),
('statement:room-local-1:stmt-l1-3', to_jsonb('{"id":"stmt-l1-3","text":"A compromise: allow short-term rentals only for owner-occupied properties. That prevents corporate landlords from buying up housing stock.","roomId":"room-local-1","author":"user-anon2","round":1,"timestamp":1774270000000,"agrees":3,"disagrees":0,"passes":0,"superAgrees":1,"voters":{"user-grace":"super_agree","user-frank":"agree","user-anon2":"agree"}}'::text)),

-- === Room 9: Social media liability (controversial) ===
('statement:room-general-2:stmt-g2-1', to_jsonb('{"id":"stmt-g2-1","text":"Section 230 was written before social media existed. The law needs to evolve with technology.","roomId":"room-general-2","author":"user-alice","round":1,"timestamp":1774060000000,"agrees":4,"disagrees":1,"passes":1,"superAgrees":1,"voters":{"user-bob":"agree","user-carol":"super_agree","user-dave":"agree","user-eve":"pass","user-frank":"disagree","user-alice":"agree"}}'::text)),
('statement:room-general-2:stmt-g2-2', to_jsonb('{"id":"stmt-g2-2","text":"Making platforms liable for user content would kill small platforms and cement Big Techs monopoly since only they can afford the moderation.","roomId":"room-general-2","author":"user-dave","round":1,"timestamp":1774065000000,"agrees":3,"disagrees":2,"passes":1,"superAgrees":1,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"pass","user-eve":"super_agree","user-frank":"agree","user-dave":"disagree"}}'::text)),
('statement:room-general-2:stmt-g2-3', to_jsonb('{"id":"stmt-g2-3","text":"Platforms already moderate content selectively through algorithms. They should be responsible for what their algorithms amplify.","roomId":"room-general-2","author":"user-carol","round":1,"timestamp":1774070000000,"agrees":5,"disagrees":0,"passes":1,"superAgrees":2,"voters":{"user-alice":"super_agree","user-bob":"agree","user-dave":"agree","user-eve":"agree","user-frank":"pass","user-carol":"super_agree"}}'::text)),
('statement:room-general-2:stmt-g2-4', to_jsonb('{"id":"stmt-g2-4","text":"This is fundamentally a free speech issue. Holding platforms liable will lead to massive over-censorship of legitimate speech.","roomId":"room-general-2","author":"user-frank","round":1,"timestamp":1774075000000,"agrees":2,"disagrees":3,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"disagree","user-dave":"agree","user-eve":"disagree","user-frank":"pass"}}'::text)),
('statement:room-general-2:stmt-g2-5', to_jsonb('{"id":"stmt-g2-5","text":"The EU already has stronger platform liability laws and their internet works fine. America is just behind.","roomId":"room-general-2","author":"user-bob","round":1,"timestamp":1774080000000,"agrees":2,"disagrees":2,"passes":2,"superAgrees":0,"voters":{"user-alice":"agree","user-carol":"agree","user-dave":"disagree","user-eve":"pass","user-frank":"disagree","user-bob":"pass"}}'::text)),

-- === Room 10: UBI ===
('statement:room-politics-2:stmt-p2-1', to_jsonb('{"id":"stmt-p2-1","text":"UBI pilot programs in Finland, Kenya, and Stockton CA have all shown positive outcomes: less stress, more entrepreneurship, no decrease in work.","roomId":"room-politics-2","author":"user-eve","round":1,"timestamp":1774310000000,"agrees":3,"disagrees":1,"passes":1,"superAgrees":2,"voters":{"user-alice":"super_agree","user-grace":"agree","user-bob":"disagree","user-carol":"super_agree","user-eve":"pass"}}'::text)),
('statement:room-politics-2:stmt-p2-2', to_jsonb('{"id":"stmt-p2-2","text":"Current welfare programs trap people in poverty with benefit cliffs. UBI eliminates that perverse incentive entirely.","roomId":"room-politics-2","author":"user-alice","round":1,"timestamp":1774315000000,"agrees":4,"disagrees":0,"passes":1,"superAgrees":1,"voters":{"user-eve":"super_agree","user-grace":"agree","user-bob":"agree","user-carol":"agree","user-alice":"pass"}}'::text)),
('statement:room-politics-2:stmt-p2-3', to_jsonb('{"id":"stmt-p2-3","text":"The math doesnt work. Giving every adult even $1000/month would cost trillions annually. Where does that money come from?","roomId":"room-politics-2","author":"user-bob","round":1,"timestamp":1774320000000,"agrees":2,"disagrees":2,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-eve":"disagree","user-grace":"agree","user-carol":"pass","user-bob":"agree"}}'::text)),
('statement:room-politics-2:stmt-p2-4', to_jsonb('{"id":"stmt-p2-4","text":"With automation eliminating more jobs every year, UBI isnt just nice to have - its going to be a necessity within a decade.","roomId":"room-politics-2","author":"user-grace","round":1,"timestamp":1774325000000,"agrees":3,"disagrees":1,"passes":1,"superAgrees":1,"voters":{"user-alice":"agree","user-eve":"super_agree","user-bob":"disagree","user-carol":"agree","user-grace":"pass"}}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- VOTES - Must match statement voters maps exactly
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- Room 1 votes
('vote:stmt-p1-1:user-bob', to_jsonb('{"id":"vote-p1-1-bob","statementId":"stmt-p1-1","userId":"user-bob","voteType":"agree","timestamp":1774211000000}'::text)),
('vote:stmt-p1-1:user-carol', to_jsonb('{"id":"vote-p1-1-carol","statementId":"stmt-p1-1","userId":"user-carol","voteType":"super_agree","timestamp":1774211100000}'::text)),
('vote:stmt-p1-1:user-eve', to_jsonb('{"id":"vote-p1-1-eve","statementId":"stmt-p1-1","userId":"user-eve","voteType":"agree","timestamp":1774211200000}'::text)),
('vote:stmt-p1-1:user-dave', to_jsonb('{"id":"vote-p1-1-dave","statementId":"stmt-p1-1","userId":"user-dave","voteType":"disagree","timestamp":1774211300000}'::text)),
('vote:stmt-p1-1:user-grace', to_jsonb('{"id":"vote-p1-1-grace","statementId":"stmt-p1-1","userId":"user-grace","voteType":"agree","timestamp":1774211400000}'::text)),
('vote:stmt-p1-1:user-anon1', to_jsonb('{"id":"vote-p1-1-anon1","statementId":"stmt-p1-1","userId":"user-anon1","voteType":"super_agree","timestamp":1774211500000}'::text)),
('vote:stmt-p1-1:user-alice', to_jsonb('{"id":"vote-p1-1-alice","statementId":"stmt-p1-1","userId":"user-alice","voteType":"agree","timestamp":1774211600000}'::text)),

('vote:stmt-p1-2:user-alice', to_jsonb('{"id":"vote-p1-2-alice","statementId":"stmt-p1-2","userId":"user-alice","voteType":"disagree","timestamp":1774216000000}'::text)),
('vote:stmt-p1-2:user-carol', to_jsonb('{"id":"vote-p1-2-carol","statementId":"stmt-p1-2","userId":"user-carol","voteType":"agree","timestamp":1774216100000}'::text)),
('vote:stmt-p1-2:user-eve', to_jsonb('{"id":"vote-p1-2-eve","statementId":"stmt-p1-2","userId":"user-eve","voteType":"disagree","timestamp":1774216200000}'::text)),
('vote:stmt-p1-2:user-dave', to_jsonb('{"id":"vote-p1-2-dave","statementId":"stmt-p1-2","userId":"user-dave","voteType":"agree","timestamp":1774216300000}'::text)),
('vote:stmt-p1-2:user-grace', to_jsonb('{"id":"vote-p1-2-grace","statementId":"stmt-p1-2","userId":"user-grace","voteType":"pass","timestamp":1774216400000}'::text)),
('vote:stmt-p1-2:user-anon1', to_jsonb('{"id":"vote-p1-2-anon1","statementId":"stmt-p1-2","userId":"user-anon1","voteType":"agree","timestamp":1774216500000}'::text)),
('vote:stmt-p1-2:user-bob', to_jsonb('{"id":"vote-p1-2-bob","statementId":"stmt-p1-2","userId":"user-bob","voteType":"disagree","timestamp":1774216600000}'::text)),

('vote:stmt-p1-3:user-alice', to_jsonb('{"id":"vote-p1-3-alice","statementId":"stmt-p1-3","userId":"user-alice","voteType":"super_agree","timestamp":1774221000000}'::text)),
('vote:stmt-p1-3:user-bob', to_jsonb('{"id":"vote-p1-3-bob","statementId":"stmt-p1-3","userId":"user-bob","voteType":"disagree","timestamp":1774221100000}'::text)),
('vote:stmt-p1-3:user-carol', to_jsonb('{"id":"vote-p1-3-carol","statementId":"stmt-p1-3","userId":"user-carol","voteType":"agree","timestamp":1774221200000}'::text)),
('vote:stmt-p1-3:user-dave', to_jsonb('{"id":"vote-p1-3-dave","statementId":"stmt-p1-3","userId":"user-dave","voteType":"pass","timestamp":1774221300000}'::text)),
('vote:stmt-p1-3:user-grace', to_jsonb('{"id":"vote-p1-3-grace","statementId":"stmt-p1-3","userId":"user-grace","voteType":"agree","timestamp":1774221400000}'::text)),
('vote:stmt-p1-3:user-anon1', to_jsonb('{"id":"vote-p1-3-anon1","statementId":"stmt-p1-3","userId":"user-anon1","voteType":"agree","timestamp":1774221500000}'::text)),

('vote:stmt-p1-4:user-alice', to_jsonb('{"id":"vote-p1-4-alice","statementId":"stmt-p1-4","userId":"user-alice","voteType":"super_agree","timestamp":1774226000000}'::text)),
('vote:stmt-p1-4:user-bob', to_jsonb('{"id":"vote-p1-4-bob","statementId":"stmt-p1-4","userId":"user-bob","voteType":"agree","timestamp":1774226100000}'::text)),
('vote:stmt-p1-4:user-eve', to_jsonb('{"id":"vote-p1-4-eve","statementId":"stmt-p1-4","userId":"user-eve","voteType":"super_agree","timestamp":1774226200000}'::text)),
('vote:stmt-p1-4:user-dave', to_jsonb('{"id":"vote-p1-4-dave","statementId":"stmt-p1-4","userId":"user-dave","voteType":"agree","timestamp":1774226300000}'::text)),
('vote:stmt-p1-4:user-grace', to_jsonb('{"id":"vote-p1-4-grace","statementId":"stmt-p1-4","userId":"user-grace","voteType":"super_agree","timestamp":1774226400000}'::text)),
('vote:stmt-p1-4:user-anon1', to_jsonb('{"id":"vote-p1-4-anon1","statementId":"stmt-p1-4","userId":"user-anon1","voteType":"agree","timestamp":1774226500000}'::text)),
('vote:stmt-p1-4:user-carol', to_jsonb('{"id":"vote-p1-4-carol","statementId":"stmt-p1-4","userId":"user-carol","voteType":"pass","timestamp":1774226600000}'::text)),

('vote:stmt-p1-5:user-alice', to_jsonb('{"id":"vote-p1-5-alice","statementId":"stmt-p1-5","userId":"user-alice","voteType":"disagree","timestamp":1774231000000}'::text)),
('vote:stmt-p1-5:user-bob', to_jsonb('{"id":"vote-p1-5-bob","statementId":"stmt-p1-5","userId":"user-bob","voteType":"agree","timestamp":1774231100000}'::text)),
('vote:stmt-p1-5:user-carol', to_jsonb('{"id":"vote-p1-5-carol","statementId":"stmt-p1-5","userId":"user-carol","voteType":"disagree","timestamp":1774231200000}'::text)),
('vote:stmt-p1-5:user-eve', to_jsonb('{"id":"vote-p1-5-eve","statementId":"stmt-p1-5","userId":"user-eve","voteType":"disagree","timestamp":1774231300000}'::text)),
('vote:stmt-p1-5:user-grace', to_jsonb('{"id":"vote-p1-5-grace","statementId":"stmt-p1-5","userId":"user-grace","voteType":"agree","timestamp":1774231400000}'::text)),
('vote:stmt-p1-5:user-anon1', to_jsonb('{"id":"vote-p1-5-anon1","statementId":"stmt-p1-5","userId":"user-anon1","voteType":"disagree","timestamp":1774231500000}'::text)),

-- Room 2: Tech votes
('vote:stmt-t1-1:user-dave', to_jsonb('{"id":"vote-t1-1-dave","statementId":"stmt-t1-1","userId":"user-dave","voteType":"agree","timestamp":1774161000000}'::text)),
('vote:stmt-t1-1:user-eve', to_jsonb('{"id":"vote-t1-1-eve","statementId":"stmt-t1-1","userId":"user-eve","voteType":"super_agree","timestamp":1774161100000}'::text)),
('vote:stmt-t1-1:user-frank', to_jsonb('{"id":"vote-t1-1-frank","statementId":"stmt-t1-1","userId":"user-frank","voteType":"disagree","timestamp":1774161200000}'::text)),
('vote:stmt-t1-1:user-carol', to_jsonb('{"id":"vote-t1-1-carol","statementId":"stmt-t1-1","userId":"user-carol","voteType":"agree","timestamp":1774161300000}'::text)),
('vote:stmt-t1-2:user-carol', to_jsonb('{"id":"vote-t1-2-carol","statementId":"stmt-t1-2","userId":"user-carol","voteType":"disagree","timestamp":1774166000000}'::text)),
('vote:stmt-t1-2:user-dave', to_jsonb('{"id":"vote-t1-2-dave","statementId":"stmt-t1-2","userId":"user-dave","voteType":"pass","timestamp":1774166100000}'::text)),
('vote:stmt-t1-2:user-eve', to_jsonb('{"id":"vote-t1-2-eve","statementId":"stmt-t1-2","userId":"user-eve","voteType":"disagree","timestamp":1774166200000}'::text)),
('vote:stmt-t1-2:user-frank', to_jsonb('{"id":"vote-t1-2-frank","statementId":"stmt-t1-2","userId":"user-frank","voteType":"agree","timestamp":1774166300000}'::text)),
('vote:stmt-t1-3:user-carol', to_jsonb('{"id":"vote-t1-3-carol","statementId":"stmt-t1-3","userId":"user-carol","voteType":"super_agree","timestamp":1774171000000}'::text)),
('vote:stmt-t1-3:user-dave', to_jsonb('{"id":"vote-t1-3-dave","statementId":"stmt-t1-3","userId":"user-dave","voteType":"agree","timestamp":1774171100000}'::text)),
('vote:stmt-t1-3:user-frank', to_jsonb('{"id":"vote-t1-3-frank","statementId":"stmt-t1-3","userId":"user-frank","voteType":"agree","timestamp":1774171200000}'::text)),
('vote:stmt-t1-3:user-eve', to_jsonb('{"id":"vote-t1-3-eve","statementId":"stmt-t1-3","userId":"user-eve","voteType":"super_agree","timestamp":1774171300000}'::text)),

-- Room 3: Sports votes
('vote:stmt-s1-1:user-dave', to_jsonb('{"id":"vote-s1-1-dave","statementId":"stmt-s1-1","userId":"user-dave","voteType":"super_agree","timestamp":1774011000000}'::text)),
('vote:stmt-s1-1:user-hank', to_jsonb('{"id":"vote-s1-1-hank","statementId":"stmt-s1-1","userId":"user-hank","voteType":"pass","timestamp":1774011100000}'::text)),
('vote:stmt-s1-1:user-bob', to_jsonb('{"id":"vote-s1-1-bob","statementId":"stmt-s1-1","userId":"user-bob","voteType":"agree","timestamp":1774011200000}'::text)),
('vote:stmt-s1-2:user-bob', to_jsonb('{"id":"vote-s1-2-bob","statementId":"stmt-s1-2","userId":"user-bob","voteType":"disagree","timestamp":1774021000000}'::text)),
('vote:stmt-s1-2:user-dave', to_jsonb('{"id":"vote-s1-2-dave","statementId":"stmt-s1-2","userId":"user-dave","voteType":"agree","timestamp":1774021100000}'::text)),

-- Room 4: Philosophy votes
('vote:stmt-ph1-1:user-grace', to_jsonb('{"id":"vote-ph1-1-grace","statementId":"stmt-ph1-1","userId":"user-grace","voteType":"agree","timestamp":1774311000000}'::text)),
('vote:stmt-ph1-1:user-alice', to_jsonb('{"id":"vote-ph1-1-alice","statementId":"stmt-ph1-1","userId":"user-alice","voteType":"super_agree","timestamp":1774311100000}'::text)),
('vote:stmt-ph1-1:user-carol', to_jsonb('{"id":"vote-ph1-1-carol","statementId":"stmt-ph1-1","userId":"user-carol","voteType":"disagree","timestamp":1774311200000}'::text)),
('vote:stmt-ph1-1:user-eve', to_jsonb('{"id":"vote-ph1-1-eve","statementId":"stmt-ph1-1","userId":"user-eve","voteType":"pass","timestamp":1774311300000}'::text)),
('vote:stmt-ph1-2:user-eve', to_jsonb('{"id":"vote-ph1-2-eve","statementId":"stmt-ph1-2","userId":"user-eve","voteType":"super_agree","timestamp":1774316000000}'::text)),
('vote:stmt-ph1-2:user-alice', to_jsonb('{"id":"vote-ph1-2-alice","statementId":"stmt-ph1-2","userId":"user-alice","voteType":"agree","timestamp":1774316100000}'::text)),
('vote:stmt-ph1-2:user-carol', to_jsonb('{"id":"vote-ph1-2-carol","statementId":"stmt-ph1-2","userId":"user-carol","voteType":"super_agree","timestamp":1774316200000}'::text)),
('vote:stmt-ph1-2:user-grace', to_jsonb('{"id":"vote-ph1-2-grace","statementId":"stmt-ph1-2","userId":"user-grace","voteType":"pass","timestamp":1774316300000}'::text)),
('vote:stmt-ph1-3:user-eve', to_jsonb('{"id":"vote-ph1-3-eve","statementId":"stmt-ph1-3","userId":"user-eve","voteType":"agree","timestamp":1774321000000}'::text)),
('vote:stmt-ph1-3:user-grace', to_jsonb('{"id":"vote-ph1-3-grace","statementId":"stmt-ph1-3","userId":"user-grace","voteType":"disagree","timestamp":1774321100000}'::text)),
('vote:stmt-ph1-3:user-carol', to_jsonb('{"id":"vote-ph1-3-carol","statementId":"stmt-ph1-3","userId":"user-carol","voteType":"agree","timestamp":1774321200000}'::text)),
('vote:stmt-ph1-3:user-alice', to_jsonb('{"id":"vote-ph1-3-alice","statementId":"stmt-ph1-3","userId":"user-alice","voteType":"pass","timestamp":1774321300000}'::text)),
('vote:stmt-ph1-4:user-eve', to_jsonb('{"id":"vote-ph1-4-eve","statementId":"stmt-ph1-4","userId":"user-eve","voteType":"pass","timestamp":1774326000000}'::text)),
('vote:stmt-ph1-4:user-grace', to_jsonb('{"id":"vote-ph1-4-grace","statementId":"stmt-ph1-4","userId":"user-grace","voteType":"agree","timestamp":1774326100000}'::text)),
('vote:stmt-ph1-4:user-alice', to_jsonb('{"id":"vote-ph1-4-alice","statementId":"stmt-ph1-4","userId":"user-alice","voteType":"disagree","timestamp":1774326200000}'::text)),
('vote:stmt-ph1-4:user-carol', to_jsonb('{"id":"vote-ph1-4-carol","statementId":"stmt-ph1-4","userId":"user-carol","voteType":"pass","timestamp":1774326300000}'::text)),

-- Room 5: General remote work votes
('vote:stmt-g1-1:user-bob', to_jsonb('{"id":"vote-g1-1-bob","statementId":"stmt-g1-1","userId":"user-bob","voteType":"super_agree","timestamp":1774111000000}'::text)),
('vote:stmt-g1-1:user-carol', to_jsonb('{"id":"vote-g1-1-carol","statementId":"stmt-g1-1","userId":"user-carol","voteType":"agree","timestamp":1774111100000}'::text)),
('vote:stmt-g1-1:user-dave', to_jsonb('{"id":"vote-g1-1-dave","statementId":"stmt-g1-1","userId":"user-dave","voteType":"super_agree","timestamp":1774111200000}'::text)),
('vote:stmt-g1-1:user-eve', to_jsonb('{"id":"vote-g1-1-eve","statementId":"stmt-g1-1","userId":"user-eve","voteType":"agree","timestamp":1774111300000}'::text)),
('vote:stmt-g1-1:user-frank', to_jsonb('{"id":"vote-g1-1-frank","statementId":"stmt-g1-1","userId":"user-frank","voteType":"super_agree","timestamp":1774111400000}'::text)),
('vote:stmt-g1-1:user-grace', to_jsonb('{"id":"vote-g1-1-grace","statementId":"stmt-g1-1","userId":"user-grace","voteType":"agree","timestamp":1774111500000}'::text)),
('vote:stmt-g1-1:user-hank', to_jsonb('{"id":"vote-g1-1-hank","statementId":"stmt-g1-1","userId":"user-hank","voteType":"pass","timestamp":1774111600000}'::text)),
('vote:stmt-g1-1:user-alice', to_jsonb('{"id":"vote-g1-1-alice","statementId":"stmt-g1-1","userId":"user-alice","voteType":"super_agree","timestamp":1774111700000}'::text)),
('vote:stmt-g1-2:user-alice', to_jsonb('{"id":"vote-g1-2-alice","statementId":"stmt-g1-2","userId":"user-alice","voteType":"disagree","timestamp":1774116000000}'::text)),
('vote:stmt-g1-2:user-bob', to_jsonb('{"id":"vote-g1-2-bob","statementId":"stmt-g1-2","userId":"user-bob","voteType":"disagree","timestamp":1774116100000}'::text)),
('vote:stmt-g1-2:user-carol', to_jsonb('{"id":"vote-g1-2-carol","statementId":"stmt-g1-2","userId":"user-carol","voteType":"agree","timestamp":1774116200000}'::text)),
('vote:stmt-g1-2:user-dave', to_jsonb('{"id":"vote-g1-2-dave","statementId":"stmt-g1-2","userId":"user-dave","voteType":"agree","timestamp":1774116300000}'::text)),
('vote:stmt-g1-2:user-eve', to_jsonb('{"id":"vote-g1-2-eve","statementId":"stmt-g1-2","userId":"user-eve","voteType":"disagree","timestamp":1774116400000}'::text)),
('vote:stmt-g1-2:user-frank', to_jsonb('{"id":"vote-g1-2-frank","statementId":"stmt-g1-2","userId":"user-frank","voteType":"agree","timestamp":1774116500000}'::text)),
('vote:stmt-g1-2:user-grace', to_jsonb('{"id":"vote-g1-2-grace","statementId":"stmt-g1-2","userId":"user-grace","voteType":"disagree","timestamp":1774116600000}'::text)),
('vote:stmt-g1-2:user-hank', to_jsonb('{"id":"vote-g1-2-hank","statementId":"stmt-g1-2","userId":"user-hank","voteType":"pass","timestamp":1774116700000}'::text)),
('vote:stmt-g1-3:user-alice', to_jsonb('{"id":"vote-g1-3-alice","statementId":"stmt-g1-3","userId":"user-alice","voteType":"disagree","timestamp":1774121000000}'::text)),
('vote:stmt-g1-3:user-bob', to_jsonb('{"id":"vote-g1-3-bob","statementId":"stmt-g1-3","userId":"user-bob","voteType":"agree","timestamp":1774121100000}'::text)),
('vote:stmt-g1-3:user-dave', to_jsonb('{"id":"vote-g1-3-dave","statementId":"stmt-g1-3","userId":"user-dave","voteType":"agree","timestamp":1774121200000}'::text)),
('vote:stmt-g1-3:user-eve', to_jsonb('{"id":"vote-g1-3-eve","statementId":"stmt-g1-3","userId":"user-eve","voteType":"super_agree","timestamp":1774121300000}'::text)),
('vote:stmt-g1-3:user-frank', to_jsonb('{"id":"vote-g1-3-frank","statementId":"stmt-g1-3","userId":"user-frank","voteType":"agree","timestamp":1774121400000}'::text)),
('vote:stmt-g1-3:user-grace', to_jsonb('{"id":"vote-g1-3-grace","statementId":"stmt-g1-3","userId":"user-grace","voteType":"agree","timestamp":1774121500000}'::text)),
('vote:stmt-g1-3:user-hank', to_jsonb('{"id":"vote-g1-3-hank","statementId":"stmt-g1-3","userId":"user-hank","voteType":"pass","timestamp":1774121600000}'::text)),
('vote:stmt-g1-3:user-carol', to_jsonb('{"id":"vote-g1-3-carol","statementId":"stmt-g1-3","userId":"user-carol","voteType":"disagree","timestamp":1774121700000}'::text)),
('vote:stmt-g1-4:user-alice', to_jsonb('{"id":"vote-g1-4-alice","statementId":"stmt-g1-4","userId":"user-alice","voteType":"super_agree","timestamp":1774126000000}'::text)),
('vote:stmt-g1-4:user-bob', to_jsonb('{"id":"vote-g1-4-bob","statementId":"stmt-g1-4","userId":"user-bob","voteType":"super_agree","timestamp":1774126100000}'::text)),
('vote:stmt-g1-4:user-carol', to_jsonb('{"id":"vote-g1-4-carol","statementId":"stmt-g1-4","userId":"user-carol","voteType":"agree","timestamp":1774126200000}'::text)),
('vote:stmt-g1-4:user-dave', to_jsonb('{"id":"vote-g1-4-dave","statementId":"stmt-g1-4","userId":"user-dave","voteType":"disagree","timestamp":1774126300000}'::text)),
('vote:stmt-g1-4:user-frank', to_jsonb('{"id":"vote-g1-4-frank","statementId":"stmt-g1-4","userId":"user-frank","voteType":"agree","timestamp":1774126400000}'::text)),
('vote:stmt-g1-4:user-grace', to_jsonb('{"id":"vote-g1-4-grace","statementId":"stmt-g1-4","userId":"user-grace","voteType":"super_agree","timestamp":1774126500000}'::text)),
('vote:stmt-g1-4:user-hank', to_jsonb('{"id":"vote-g1-4-hank","statementId":"stmt-g1-4","userId":"user-hank","voteType":"pass","timestamp":1774126600000}'::text)),
('vote:stmt-g1-4:user-eve', to_jsonb('{"id":"vote-g1-4-eve","statementId":"stmt-g1-4","userId":"user-eve","voteType":"agree","timestamp":1774126700000}'::text)),
('vote:stmt-g1-5:user-alice', to_jsonb('{"id":"vote-g1-5-alice","statementId":"stmt-g1-5","userId":"user-alice","voteType":"disagree","timestamp":1774131000000}'::text)),
('vote:stmt-g1-5:user-bob', to_jsonb('{"id":"vote-g1-5-bob","statementId":"stmt-g1-5","userId":"user-bob","voteType":"agree","timestamp":1774131100000}'::text)),
('vote:stmt-g1-5:user-carol', to_jsonb('{"id":"vote-g1-5-carol","statementId":"stmt-g1-5","userId":"user-carol","voteType":"agree","timestamp":1774131200000}'::text)),
('vote:stmt-g1-5:user-dave', to_jsonb('{"id":"vote-g1-5-dave","statementId":"stmt-g1-5","userId":"user-dave","voteType":"agree","timestamp":1774131300000}'::text)),
('vote:stmt-g1-5:user-eve', to_jsonb('{"id":"vote-g1-5-eve","statementId":"stmt-g1-5","userId":"user-eve","voteType":"disagree","timestamp":1774131400000}'::text)),
('vote:stmt-g1-5:user-grace', to_jsonb('{"id":"vote-g1-5-grace","statementId":"stmt-g1-5","userId":"user-grace","voteType":"agree","timestamp":1774131500000}'::text)),
('vote:stmt-g1-5:user-hank', to_jsonb('{"id":"vote-g1-5-hank","statementId":"stmt-g1-5","userId":"user-hank","voteType":"pass","timestamp":1774131600000}'::text)),
('vote:stmt-g1-5:user-frank', to_jsonb('{"id":"vote-g1-5-frank","statementId":"stmt-g1-5","userId":"user-frank","voteType":"disagree","timestamp":1774131700000}'::text)),
('vote:stmt-g1-6:user-alice', to_jsonb('{"id":"vote-g1-6-alice","statementId":"stmt-g1-6","userId":"user-alice","voteType":"disagree","timestamp":1774136000000}'::text)),
('vote:stmt-g1-6:user-bob', to_jsonb('{"id":"vote-g1-6-bob","statementId":"stmt-g1-6","userId":"user-bob","voteType":"pass","timestamp":1774136100000}'::text)),
('vote:stmt-g1-6:user-carol', to_jsonb('{"id":"vote-g1-6-carol","statementId":"stmt-g1-6","userId":"user-carol","voteType":"agree","timestamp":1774136200000}'::text)),
('vote:stmt-g1-6:user-eve', to_jsonb('{"id":"vote-g1-6-eve","statementId":"stmt-g1-6","userId":"user-eve","voteType":"disagree","timestamp":1774136300000}'::text)),
('vote:stmt-g1-6:user-frank', to_jsonb('{"id":"vote-g1-6-frank","statementId":"stmt-g1-6","userId":"user-frank","voteType":"agree","timestamp":1774136400000}'::text)),
('vote:stmt-g1-6:user-grace', to_jsonb('{"id":"vote-g1-6-grace","statementId":"stmt-g1-6","userId":"user-grace","voteType":"agree","timestamp":1774136500000}'::text)),
('vote:stmt-g1-6:user-hank', to_jsonb('{"id":"vote-g1-6-hank","statementId":"stmt-g1-6","userId":"user-hank","voteType":"pass","timestamp":1774136600000}'::text)),
('vote:stmt-g1-6:user-dave', to_jsonb('{"id":"vote-g1-6-dave","statementId":"stmt-g1-6","userId":"user-dave","voteType":"disagree","timestamp":1774136700000}'::text)),

-- Room 6: Finished pizza votes
('vote:stmt-f1-1:user-bob', to_jsonb('{"id":"vote-f1-1-bob","statementId":"stmt-f1-1","userId":"user-bob","voteType":"disagree","timestamp":1773411000000}'::text)),
('vote:stmt-f1-1:user-carol', to_jsonb('{"id":"vote-f1-1-carol","statementId":"stmt-f1-1","userId":"user-carol","voteType":"agree","timestamp":1773411100000}'::text)),
('vote:stmt-f1-1:user-dave', to_jsonb('{"id":"vote-f1-1-dave","statementId":"stmt-f1-1","userId":"user-dave","voteType":"super_agree","timestamp":1773411200000}'::text)),
('vote:stmt-f1-1:user-eve', to_jsonb('{"id":"vote-f1-1-eve","statementId":"stmt-f1-1","userId":"user-eve","voteType":"agree","timestamp":1773411300000}'::text)),
('vote:stmt-f1-1:user-alice', to_jsonb('{"id":"vote-f1-1-alice","statementId":"stmt-f1-1","userId":"user-alice","voteType":"disagree","timestamp":1773411400000}'::text)),
('vote:stmt-f1-2:user-alice', to_jsonb('{"id":"vote-f1-2-alice","statementId":"stmt-f1-2","userId":"user-alice","voteType":"disagree","timestamp":1773416000000}'::text)),
('vote:stmt-f1-2:user-carol', to_jsonb('{"id":"vote-f1-2-carol","statementId":"stmt-f1-2","userId":"user-carol","voteType":"disagree","timestamp":1773416100000}'::text)),
('vote:stmt-f1-2:user-dave', to_jsonb('{"id":"vote-f1-2-dave","statementId":"stmt-f1-2","userId":"user-dave","voteType":"agree","timestamp":1773416200000}'::text)),
('vote:stmt-f1-2:user-eve', to_jsonb('{"id":"vote-f1-2-eve","statementId":"stmt-f1-2","userId":"user-eve","voteType":"disagree","timestamp":1773416300000}'::text)),
('vote:stmt-f1-2:user-bob', to_jsonb('{"id":"vote-f1-2-bob","statementId":"stmt-f1-2","userId":"user-bob","voteType":"agree","timestamp":1773416400000}'::text)),
('vote:stmt-f1-3:user-alice', to_jsonb('{"id":"vote-f1-3-alice","statementId":"stmt-f1-3","userId":"user-alice","voteType":"super_agree","timestamp":1773421000000}'::text)),
('vote:stmt-f1-3:user-bob', to_jsonb('{"id":"vote-f1-3-bob","statementId":"stmt-f1-3","userId":"user-bob","voteType":"disagree","timestamp":1773421100000}'::text)),
('vote:stmt-f1-3:user-dave', to_jsonb('{"id":"vote-f1-3-dave","statementId":"stmt-f1-3","userId":"user-dave","voteType":"agree","timestamp":1773421200000}'::text)),
('vote:stmt-f1-3:user-eve', to_jsonb('{"id":"vote-f1-3-eve","statementId":"stmt-f1-3","userId":"user-eve","voteType":"super_agree","timestamp":1773421300000}'::text)),
('vote:stmt-f1-3:user-carol', to_jsonb('{"id":"vote-f1-3-carol","statementId":"stmt-f1-3","userId":"user-carol","voteType":"agree","timestamp":1773421400000}'::text)),

-- Room 7: Local Airbnb votes
('vote:stmt-l1-1:user-frank', to_jsonb('{"id":"vote-l1-1-frank","statementId":"stmt-l1-1","userId":"user-frank","voteType":"super_agree","timestamp":1774261000000}'::text)),
('vote:stmt-l1-1:user-anon2', to_jsonb('{"id":"vote-l1-1-anon2","statementId":"stmt-l1-1","userId":"user-anon2","voteType":"agree","timestamp":1774261100000}'::text)),
('vote:stmt-l1-1:user-grace', to_jsonb('{"id":"vote-l1-1-grace","statementId":"stmt-l1-1","userId":"user-grace","voteType":"pass","timestamp":1774261200000}'::text)),
('vote:stmt-l1-2:user-grace', to_jsonb('{"id":"vote-l1-2-grace","statementId":"stmt-l1-2","userId":"user-grace","voteType":"disagree","timestamp":1774266000000}'::text)),
('vote:stmt-l1-2:user-anon2', to_jsonb('{"id":"vote-l1-2-anon2","statementId":"stmt-l1-2","userId":"user-anon2","voteType":"pass","timestamp":1774266100000}'::text)),
('vote:stmt-l1-2:user-frank', to_jsonb('{"id":"vote-l1-2-frank","statementId":"stmt-l1-2","userId":"user-frank","voteType":"agree","timestamp":1774266200000}'::text)),
('vote:stmt-l1-3:user-grace', to_jsonb('{"id":"vote-l1-3-grace","statementId":"stmt-l1-3","userId":"user-grace","voteType":"super_agree","timestamp":1774271000000}'::text)),
('vote:stmt-l1-3:user-frank', to_jsonb('{"id":"vote-l1-3-frank","statementId":"stmt-l1-3","userId":"user-frank","voteType":"agree","timestamp":1774271100000}'::text)),
('vote:stmt-l1-3:user-anon2', to_jsonb('{"id":"vote-l1-3-anon2","statementId":"stmt-l1-3","userId":"user-anon2","voteType":"agree","timestamp":1774271200000}'::text)),

-- Room 9: Social media votes
('vote:stmt-g2-1:user-bob', to_jsonb('{"id":"vote-g2-1-bob","statementId":"stmt-g2-1","userId":"user-bob","voteType":"agree","timestamp":1774061000000}'::text)),
('vote:stmt-g2-1:user-carol', to_jsonb('{"id":"vote-g2-1-carol","statementId":"stmt-g2-1","userId":"user-carol","voteType":"super_agree","timestamp":1774061100000}'::text)),
('vote:stmt-g2-1:user-dave', to_jsonb('{"id":"vote-g2-1-dave","statementId":"stmt-g2-1","userId":"user-dave","voteType":"agree","timestamp":1774061200000}'::text)),
('vote:stmt-g2-1:user-eve', to_jsonb('{"id":"vote-g2-1-eve","statementId":"stmt-g2-1","userId":"user-eve","voteType":"pass","timestamp":1774061300000}'::text)),
('vote:stmt-g2-1:user-frank', to_jsonb('{"id":"vote-g2-1-frank","statementId":"stmt-g2-1","userId":"user-frank","voteType":"disagree","timestamp":1774061400000}'::text)),
('vote:stmt-g2-1:user-alice', to_jsonb('{"id":"vote-g2-1-alice","statementId":"stmt-g2-1","userId":"user-alice","voteType":"agree","timestamp":1774061500000}'::text)),
('vote:stmt-g2-2:user-alice', to_jsonb('{"id":"vote-g2-2-alice","statementId":"stmt-g2-2","userId":"user-alice","voteType":"disagree","timestamp":1774066000000}'::text)),
('vote:stmt-g2-2:user-bob', to_jsonb('{"id":"vote-g2-2-bob","statementId":"stmt-g2-2","userId":"user-bob","voteType":"agree","timestamp":1774066100000}'::text)),
('vote:stmt-g2-2:user-carol', to_jsonb('{"id":"vote-g2-2-carol","statementId":"stmt-g2-2","userId":"user-carol","voteType":"pass","timestamp":1774066200000}'::text)),
('vote:stmt-g2-2:user-eve', to_jsonb('{"id":"vote-g2-2-eve","statementId":"stmt-g2-2","userId":"user-eve","voteType":"super_agree","timestamp":1774066300000}'::text)),
('vote:stmt-g2-2:user-frank', to_jsonb('{"id":"vote-g2-2-frank","statementId":"stmt-g2-2","userId":"user-frank","voteType":"agree","timestamp":1774066400000}'::text)),
('vote:stmt-g2-2:user-dave', to_jsonb('{"id":"vote-g2-2-dave","statementId":"stmt-g2-2","userId":"user-dave","voteType":"disagree","timestamp":1774066500000}'::text)),
('vote:stmt-g2-3:user-alice', to_jsonb('{"id":"vote-g2-3-alice","statementId":"stmt-g2-3","userId":"user-alice","voteType":"super_agree","timestamp":1774071000000}'::text)),
('vote:stmt-g2-3:user-bob', to_jsonb('{"id":"vote-g2-3-bob","statementId":"stmt-g2-3","userId":"user-bob","voteType":"agree","timestamp":1774071100000}'::text)),
('vote:stmt-g2-3:user-dave', to_jsonb('{"id":"vote-g2-3-dave","statementId":"stmt-g2-3","userId":"user-dave","voteType":"agree","timestamp":1774071200000}'::text)),
('vote:stmt-g2-3:user-eve', to_jsonb('{"id":"vote-g2-3-eve","statementId":"stmt-g2-3","userId":"user-eve","voteType":"agree","timestamp":1774071300000}'::text)),
('vote:stmt-g2-3:user-frank', to_jsonb('{"id":"vote-g2-3-frank","statementId":"stmt-g2-3","userId":"user-frank","voteType":"pass","timestamp":1774071400000}'::text)),
('vote:stmt-g2-3:user-carol', to_jsonb('{"id":"vote-g2-3-carol","statementId":"stmt-g2-3","userId":"user-carol","voteType":"super_agree","timestamp":1774071500000}'::text)),
('vote:stmt-g2-4:user-alice', to_jsonb('{"id":"vote-g2-4-alice","statementId":"stmt-g2-4","userId":"user-alice","voteType":"disagree","timestamp":1774076000000}'::text)),
('vote:stmt-g2-4:user-bob', to_jsonb('{"id":"vote-g2-4-bob","statementId":"stmt-g2-4","userId":"user-bob","voteType":"agree","timestamp":1774076100000}'::text)),
('vote:stmt-g2-4:user-carol', to_jsonb('{"id":"vote-g2-4-carol","statementId":"stmt-g2-4","userId":"user-carol","voteType":"disagree","timestamp":1774076200000}'::text)),
('vote:stmt-g2-4:user-dave', to_jsonb('{"id":"vote-g2-4-dave","statementId":"stmt-g2-4","userId":"user-dave","voteType":"agree","timestamp":1774076300000}'::text)),
('vote:stmt-g2-4:user-eve', to_jsonb('{"id":"vote-g2-4-eve","statementId":"stmt-g2-4","userId":"user-eve","voteType":"disagree","timestamp":1774076400000}'::text)),
('vote:stmt-g2-4:user-frank', to_jsonb('{"id":"vote-g2-4-frank","statementId":"stmt-g2-4","userId":"user-frank","voteType":"pass","timestamp":1774076500000}'::text)),
('vote:stmt-g2-5:user-alice', to_jsonb('{"id":"vote-g2-5-alice","statementId":"stmt-g2-5","userId":"user-alice","voteType":"agree","timestamp":1774081000000}'::text)),
('vote:stmt-g2-5:user-carol', to_jsonb('{"id":"vote-g2-5-carol","statementId":"stmt-g2-5","userId":"user-carol","voteType":"agree","timestamp":1774081100000}'::text)),
('vote:stmt-g2-5:user-dave', to_jsonb('{"id":"vote-g2-5-dave","statementId":"stmt-g2-5","userId":"user-dave","voteType":"disagree","timestamp":1774081200000}'::text)),
('vote:stmt-g2-5:user-eve', to_jsonb('{"id":"vote-g2-5-eve","statementId":"stmt-g2-5","userId":"user-eve","voteType":"pass","timestamp":1774081300000}'::text)),
('vote:stmt-g2-5:user-frank', to_jsonb('{"id":"vote-g2-5-frank","statementId":"stmt-g2-5","userId":"user-frank","voteType":"disagree","timestamp":1774081400000}'::text)),
('vote:stmt-g2-5:user-bob', to_jsonb('{"id":"vote-g2-5-bob","statementId":"stmt-g2-5","userId":"user-bob","voteType":"pass","timestamp":1774081500000}'::text)),

-- Room 10: UBI votes
('vote:stmt-p2-1:user-alice', to_jsonb('{"id":"vote-p2-1-alice","statementId":"stmt-p2-1","userId":"user-alice","voteType":"super_agree","timestamp":1774311000000}'::text)),
('vote:stmt-p2-1:user-grace', to_jsonb('{"id":"vote-p2-1-grace","statementId":"stmt-p2-1","userId":"user-grace","voteType":"agree","timestamp":1774311100000}'::text)),
('vote:stmt-p2-1:user-bob', to_jsonb('{"id":"vote-p2-1-bob","statementId":"stmt-p2-1","userId":"user-bob","voteType":"disagree","timestamp":1774311200000}'::text)),
('vote:stmt-p2-1:user-carol', to_jsonb('{"id":"vote-p2-1-carol","statementId":"stmt-p2-1","userId":"user-carol","voteType":"super_agree","timestamp":1774311300000}'::text)),
('vote:stmt-p2-1:user-eve', to_jsonb('{"id":"vote-p2-1-eve","statementId":"stmt-p2-1","userId":"user-eve","voteType":"pass","timestamp":1774311400000}'::text)),
('vote:stmt-p2-2:user-eve', to_jsonb('{"id":"vote-p2-2-eve","statementId":"stmt-p2-2","userId":"user-eve","voteType":"super_agree","timestamp":1774316000000}'::text)),
('vote:stmt-p2-2:user-grace', to_jsonb('{"id":"vote-p2-2-grace","statementId":"stmt-p2-2","userId":"user-grace","voteType":"agree","timestamp":1774316100000}'::text)),
('vote:stmt-p2-2:user-bob', to_jsonb('{"id":"vote-p2-2-bob","statementId":"stmt-p2-2","userId":"user-bob","voteType":"agree","timestamp":1774316200000}'::text)),
('vote:stmt-p2-2:user-carol', to_jsonb('{"id":"vote-p2-2-carol","statementId":"stmt-p2-2","userId":"user-carol","voteType":"agree","timestamp":1774316300000}'::text)),
('vote:stmt-p2-2:user-alice', to_jsonb('{"id":"vote-p2-2-alice","statementId":"stmt-p2-2","userId":"user-alice","voteType":"pass","timestamp":1774316400000}'::text)),
('vote:stmt-p2-3:user-alice', to_jsonb('{"id":"vote-p2-3-alice","statementId":"stmt-p2-3","userId":"user-alice","voteType":"disagree","timestamp":1774321000000}'::text)),
('vote:stmt-p2-3:user-eve', to_jsonb('{"id":"vote-p2-3-eve","statementId":"stmt-p2-3","userId":"user-eve","voteType":"disagree","timestamp":1774321100000}'::text)),
('vote:stmt-p2-3:user-grace', to_jsonb('{"id":"vote-p2-3-grace","statementId":"stmt-p2-3","userId":"user-grace","voteType":"agree","timestamp":1774321200000}'::text)),
('vote:stmt-p2-3:user-carol', to_jsonb('{"id":"vote-p2-3-carol","statementId":"stmt-p2-3","userId":"user-carol","voteType":"pass","timestamp":1774321300000}'::text)),
('vote:stmt-p2-3:user-bob', to_jsonb('{"id":"vote-p2-3-bob","statementId":"stmt-p2-3","userId":"user-bob","voteType":"agree","timestamp":1774321400000}'::text)),
('vote:stmt-p2-4:user-alice', to_jsonb('{"id":"vote-p2-4-alice","statementId":"stmt-p2-4","userId":"user-alice","voteType":"agree","timestamp":1774326000000}'::text)),
('vote:stmt-p2-4:user-eve', to_jsonb('{"id":"vote-p2-4-eve","statementId":"stmt-p2-4","userId":"user-eve","voteType":"super_agree","timestamp":1774326100000}'::text)),
('vote:stmt-p2-4:user-bob', to_jsonb('{"id":"vote-p2-4-bob","statementId":"stmt-p2-4","userId":"user-bob","voteType":"disagree","timestamp":1774326200000}'::text)),
('vote:stmt-p2-4:user-carol', to_jsonb('{"id":"vote-p2-4-carol","statementId":"stmt-p2-4","userId":"user-carol","voteType":"agree","timestamp":1774326300000}'::text)),
('vote:stmt-p2-4:user-grace', to_jsonb('{"id":"vote-p2-4-grace","statementId":"stmt-p2-4","userId":"user-grace","voteType":"pass","timestamp":1774326400000}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- EDGE CASE ROOMS (5 rooms, all 10 users, high vote counts)
-- All rooms allowAnonymous to include anon1/anon2
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- Room 11: Echo chamber — near-unanimous super_agree on everything (40 votes)
('room:room-echo-1', to_jsonb('{"id":"room-echo-1","topic":"Clean energy should be the top priority for every government","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774380000000,"createdAt":1774379000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank","user-anon1","user-anon2"],"hostId":"user-eve","isActive":true,"mode":"realtime","endTime":1774980000000,"totalVotes":40,"lastActivityAt":1774385000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-echo-1","rantFirst":true}'::text)),

-- Room 12: Perfect polarization — every statement splits exactly 5v5 (50 votes)
('room:room-polarized-1', to_jsonb('{"id":"room-polarized-1","topic":"Capitalism is the best economic system we have","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774381000000,"createdAt":1774380000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank","user-anon1","user-anon2"],"hostId":"user-alice","isActive":true,"mode":"realtime","endTime":1774981000000,"totalVotes":50,"lastActivityAt":1774386000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-polarized-1","rantFirst":true}'::text)),

-- Room 13: Mega thread — 6 statements, all 10 users vote on each (60 votes)
('room:room-mega-1', to_jsonb('{"id":"room-mega-1","topic":"What single change would most improve the education system?","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774382000000,"createdAt":1774381000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank","user-anon1","user-anon2"],"hostId":"user-carol","isActive":true,"mode":"realtime","endTime":1774982000000,"totalVotes":60,"lastActivityAt":1774387000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-mega-1","rantFirst":true}'::text)),

-- Room 14: Mass indecision — 10 users, 5 statements, overwhelmingly passes (50 votes)
('room:room-undecided-1', to_jsonb('{"id":"room-undecided-1","topic":"Is consciousness a purely physical phenomenon or something more?","phase":"round1","subPhase":"voting","gameNumber":1,"roundStartTime":1774383000000,"createdAt":1774382000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank","user-anon1","user-anon2"],"hostId":"user-grace","isActive":true,"mode":"realtime","subHeard":"philosophy","endTime":1774983000000,"totalVotes":50,"lastActivityAt":1774388000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-undecided-1","rantFirst":true}'::text)),

-- Room 15: Engagement cliff — early statements get 10 votes, later ones drop to 1 (33 votes)
('room:room-cliff-1', to_jsonb('{"id":"room-cliff-1","topic":"Cities should ban personal car ownership in downtown areas","phase":"round1","subPhase":"posting","gameNumber":1,"roundStartTime":1774384000000,"createdAt":1774383000000,"participants":["user-alice","user-bob","user-carol","user-dave","user-eve","user-frank","user-grace","user-hank","user-anon1","user-anon2"],"hostId":"user-alice","isActive":true,"mode":"realtime","endTime":1774984000000,"totalVotes":33,"lastActivityAt":1774389000000,"allowAnonymous":true,"anonymousLinkId":"anon-link-cliff-1","rantFirst":true}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- EDGE CASE STATEMENTS
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- === Room 11: Echo chamber — near-unanimous super_agree ===
-- stmt-ec-1: 10 super_agree → agrees:10, superAgrees:10
('statement:room-echo-1:stmt-ec-1', to_jsonb('{"id":"stmt-ec-1","text":"Renewable energy creates more jobs than fossil fuels while reducing emissions. Its a win-win that should be obvious by now.","roomId":"room-echo-1","author":"user-eve","round":1,"timestamp":1774380100000,"agrees":10,"disagrees":0,"passes":0,"superAgrees":10,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"super_agree","user-dave":"super_agree","user-eve":"super_agree","user-frank":"super_agree","user-grace":"super_agree","user-hank":"super_agree","user-anon1":"super_agree","user-anon2":"super_agree"}}'::text)),
-- stmt-ec-2: 9 super_agree + 1 agree → agrees:10, superAgrees:9
('statement:room-echo-1:stmt-ec-2', to_jsonb('{"id":"stmt-ec-2","text":"Government subsidies for solar and wind have already proven to work at scale in multiple countries.","roomId":"room-echo-1","author":"user-carol","round":1,"timestamp":1774380200000,"agrees":10,"disagrees":0,"passes":0,"superAgrees":9,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"super_agree","user-dave":"super_agree","user-eve":"super_agree","user-frank":"super_agree","user-grace":"super_agree","user-hank":"agree","user-anon1":"super_agree","user-anon2":"super_agree"}}'::text)),
-- stmt-ec-3: 8 super_agree + 1 agree + 1 pass → agrees:9, superAgrees:8, passes:1
('statement:room-echo-1:stmt-ec-3', to_jsonb('{"id":"stmt-ec-3","text":"Nuclear energy should absolutely be part of the clean energy mix despite the stigma around it.","roomId":"room-echo-1","author":"user-alice","round":1,"timestamp":1774380300000,"agrees":9,"disagrees":0,"passes":1,"superAgrees":8,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"super_agree","user-dave":"super_agree","user-eve":"super_agree","user-frank":"pass","user-grace":"super_agree","user-hank":"agree","user-anon1":"super_agree","user-anon2":"super_agree"}}'::text)),
-- stmt-ec-4: 9 super_agree + 1 disagree → agrees:9, superAgrees:9, disagrees:1
('statement:room-echo-1:stmt-ec-4', to_jsonb('{"id":"stmt-ec-4","text":"Oil companies should be held financially responsible for the climate damage they knowingly caused.","roomId":"room-echo-1","author":"user-grace","round":1,"timestamp":1774380400000,"agrees":9,"disagrees":1,"passes":0,"superAgrees":9,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"super_agree","user-dave":"super_agree","user-eve":"super_agree","user-frank":"disagree","user-grace":"super_agree","user-hank":"super_agree","user-anon1":"super_agree","user-anon2":"super_agree"}}'::text)),

-- === Room 12: Perfect polarization — every statement exactly 5 agree / 5 disagree ===
('statement:room-polarized-1:stmt-pl-1', to_jsonb('{"id":"stmt-pl-1","text":"Free markets allocate resources more efficiently than any centrally planned system ever could.","roomId":"room-polarized-1","author":"user-alice","round":1,"timestamp":1774381100000,"agrees":5,"disagrees":5,"passes":0,"superAgrees":0,"voters":{"user-alice":"agree","user-bob":"agree","user-carol":"agree","user-dave":"agree","user-eve":"agree","user-frank":"disagree","user-grace":"disagree","user-hank":"disagree","user-anon1":"disagree","user-anon2":"disagree"}}'::text)),
('statement:room-polarized-1:stmt-pl-2', to_jsonb('{"id":"stmt-pl-2","text":"Income inequality is a necessary feature of a healthy economy that rewards innovation and risk.","roomId":"room-polarized-1","author":"user-frank","round":1,"timestamp":1774381200000,"agrees":5,"disagrees":5,"passes":0,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"disagree","user-dave":"agree","user-eve":"disagree","user-frank":"agree","user-grace":"disagree","user-hank":"agree","user-anon1":"agree","user-anon2":"disagree"}}'::text)),
('statement:room-polarized-1:stmt-pl-3', to_jsonb('{"id":"stmt-pl-3","text":"The profit motive drives more innovation than any other incentive structure in human history.","roomId":"room-polarized-1","author":"user-bob","round":1,"timestamp":1774381300000,"agrees":5,"disagrees":5,"passes":0,"superAgrees":0,"voters":{"user-alice":"agree","user-bob":"disagree","user-carol":"agree","user-dave":"disagree","user-eve":"agree","user-frank":"disagree","user-grace":"agree","user-hank":"disagree","user-anon1":"agree","user-anon2":"disagree"}}'::text)),
('statement:room-polarized-1:stmt-pl-4', to_jsonb('{"id":"stmt-pl-4","text":"Worker cooperatives prove that capitalism isnt the only viable model for building prosperity.","roomId":"room-polarized-1","author":"user-grace","round":1,"timestamp":1774381400000,"agrees":5,"disagrees":5,"passes":0,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"disagree","user-carol":"agree","user-dave":"agree","user-eve":"agree","user-frank":"agree","user-grace":"disagree","user-hank":"agree","user-anon1":"disagree","user-anon2":"disagree"}}'::text)),
('statement:room-polarized-1:stmt-pl-5', to_jsonb('{"id":"stmt-pl-5","text":"Regulation is what makes capitalism work. Unregulated markets always consolidate into monopolies.","roomId":"room-polarized-1","author":"user-eve","round":1,"timestamp":1774381500000,"agrees":5,"disagrees":5,"passes":0,"superAgrees":0,"voters":{"user-alice":"agree","user-bob":"agree","user-carol":"disagree","user-dave":"disagree","user-eve":"agree","user-frank":"disagree","user-grace":"agree","user-hank":"disagree","user-anon1":"agree","user-anon2":"disagree"}}'::text)),

-- === Room 13: Mega thread — 6 statements, all 10 vote, mixed distributions ===
-- stmt-mt-1: 5A + 2SA + 2D + 1pass → agrees:7, disagrees:2, passes:1, superAgrees:2
('statement:room-mega-1:stmt-mt-1', to_jsonb('{"id":"stmt-mt-1","text":"Smaller class sizes matter more than any curriculum change for actual learning outcomes.","roomId":"room-mega-1","author":"user-carol","round":1,"timestamp":1774382100000,"agrees":7,"disagrees":2,"passes":1,"superAgrees":2,"voters":{"user-alice":"super_agree","user-bob":"agree","user-carol":"agree","user-dave":"disagree","user-eve":"super_agree","user-frank":"agree","user-grace":"agree","user-hank":"disagree","user-anon1":"agree","user-anon2":"pass"}}'::text)),
-- stmt-mt-2: 4A + 3SA + 2D + 1pass → agrees:7, disagrees:2, passes:1, superAgrees:3
('statement:room-mega-1:stmt-mt-2', to_jsonb('{"id":"stmt-mt-2","text":"Teachers should be paid as much as doctors and lawyers to attract the best talent.","roomId":"room-mega-1","author":"user-bob","round":1,"timestamp":1774382200000,"agrees":7,"disagrees":2,"passes":1,"superAgrees":3,"voters":{"user-alice":"agree","user-bob":"super_agree","user-carol":"super_agree","user-dave":"agree","user-eve":"agree","user-frank":"disagree","user-grace":"super_agree","user-hank":"pass","user-anon1":"disagree","user-anon2":"agree"}}'::text)),
-- stmt-mt-3: 5A + 4D + 1pass → agrees:5, disagrees:4, passes:1, superAgrees:0
('statement:room-mega-1:stmt-mt-3', to_jsonb('{"id":"stmt-mt-3","text":"Standardized testing does more harm than good and should be abolished entirely.","roomId":"room-mega-1","author":"user-eve","round":1,"timestamp":1774382300000,"agrees":5,"disagrees":4,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"disagree","user-dave":"agree","user-eve":"disagree","user-frank":"agree","user-grace":"disagree","user-hank":"agree","user-anon1":"pass","user-anon2":"agree"}}'::text)),
-- stmt-mt-4: 6A + 4SA → agrees:10, disagrees:0, passes:0, superAgrees:4 (unanimous positive)
('statement:room-mega-1:stmt-mt-4', to_jsonb('{"id":"stmt-mt-4","text":"Financial literacy should be a required course starting in middle school.","roomId":"room-mega-1","author":"user-alice","round":1,"timestamp":1774382400000,"agrees":10,"disagrees":0,"passes":0,"superAgrees":4,"voters":{"user-alice":"super_agree","user-bob":"super_agree","user-carol":"agree","user-dave":"agree","user-eve":"super_agree","user-frank":"agree","user-grace":"agree","user-hank":"agree","user-anon1":"agree","user-anon2":"super_agree"}}'::text)),
-- stmt-mt-5: 6A + 2SA + 1D + 1pass → agrees:8, disagrees:1, passes:1, superAgrees:2
('statement:room-mega-1:stmt-mt-5', to_jsonb('{"id":"stmt-mt-5","text":"School should start no earlier than 9am based on what we know about adolescent sleep science.","roomId":"room-mega-1","author":"user-grace","round":1,"timestamp":1774382500000,"agrees":8,"disagrees":1,"passes":1,"superAgrees":2,"voters":{"user-alice":"agree","user-bob":"agree","user-carol":"super_agree","user-dave":"pass","user-eve":"agree","user-frank":"disagree","user-grace":"agree","user-hank":"agree","user-anon1":"super_agree","user-anon2":"agree"}}'::text)),
-- stmt-mt-6: 4A + 5D + 1pass → agrees:4, disagrees:5, passes:1, superAgrees:0
('statement:room-mega-1:stmt-mt-6', to_jsonb('{"id":"stmt-mt-6","text":"Homework should be completely abolished for elementary school students.","roomId":"room-mega-1","author":"user-hank","round":1,"timestamp":1774382600000,"agrees":4,"disagrees":5,"passes":1,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"agree","user-dave":"disagree","user-eve":"pass","user-frank":"disagree","user-grace":"agree","user-hank":"disagree","user-anon1":"agree","user-anon2":"disagree"}}'::text)),

-- === Room 14: Mass indecision — overwhelming passes ===
-- stmt-un-1: 1A + 1D + 8pass
('statement:room-undecided-1:stmt-un-1', to_jsonb('{"id":"stmt-un-1","text":"Consciousness cannot be fully explained by physical processes alone. There is something fundamentally non-material about subjective experience.","roomId":"room-undecided-1","author":"user-eve","round":1,"timestamp":1774383100000,"agrees":1,"disagrees":1,"passes":8,"superAgrees":0,"voters":{"user-alice":"pass","user-bob":"pass","user-carol":"agree","user-dave":"pass","user-eve":"pass","user-frank":"pass","user-grace":"disagree","user-hank":"pass","user-anon1":"pass","user-anon2":"pass"}}'::text)),
-- stmt-un-2: 2A + 0D + 8pass
('statement:room-undecided-1:stmt-un-2', to_jsonb('{"id":"stmt-un-2","text":"Artificial intelligence could eventually become truly conscious, not just simulate consciousness.","roomId":"room-undecided-1","author":"user-carol","round":1,"timestamp":1774383200000,"agrees":2,"disagrees":0,"passes":8,"superAgrees":0,"voters":{"user-alice":"agree","user-bob":"pass","user-carol":"pass","user-dave":"pass","user-eve":"agree","user-frank":"pass","user-grace":"pass","user-hank":"pass","user-anon1":"pass","user-anon2":"pass"}}'::text)),
-- stmt-un-3: 0A + 2D + 8pass
('statement:room-undecided-1:stmt-un-3', to_jsonb('{"id":"stmt-un-3","text":"The hard problem of consciousness will never be solved by science. Its a philosophical question, not an empirical one.","roomId":"room-undecided-1","author":"user-grace","round":1,"timestamp":1774383300000,"agrees":0,"disagrees":2,"passes":8,"superAgrees":0,"voters":{"user-alice":"pass","user-bob":"pass","user-carol":"pass","user-dave":"disagree","user-eve":"pass","user-frank":"disagree","user-grace":"pass","user-hank":"pass","user-anon1":"pass","user-anon2":"pass"}}'::text)),
-- stmt-un-4: 1SA + 0D + 9pass → agrees:1, superAgrees:1, passes:9
('statement:room-undecided-1:stmt-un-4', to_jsonb('{"id":"stmt-un-4","text":"Meditation and introspection are just as valid as brain scans for studying consciousness.","roomId":"room-undecided-1","author":"user-alice","round":1,"timestamp":1774383400000,"agrees":1,"disagrees":0,"passes":9,"superAgrees":1,"voters":{"user-alice":"pass","user-bob":"pass","user-carol":"pass","user-dave":"pass","user-eve":"super_agree","user-frank":"pass","user-grace":"pass","user-hank":"pass","user-anon1":"pass","user-anon2":"pass"}}'::text)),
-- stmt-un-5: 0A + 1D + 9pass
('statement:room-undecided-1:stmt-un-5', to_jsonb('{"id":"stmt-un-5","text":"We should focus on understanding animal consciousness before trying to tackle the mystery of human consciousness.","roomId":"room-undecided-1","author":"user-bob","round":1,"timestamp":1774383500000,"agrees":0,"disagrees":1,"passes":9,"superAgrees":0,"voters":{"user-alice":"pass","user-bob":"disagree","user-carol":"pass","user-dave":"pass","user-eve":"pass","user-frank":"pass","user-grace":"pass","user-hank":"pass","user-anon1":"pass","user-anon2":"pass"}}'::text)),

-- === Room 15: Engagement cliff — votes drop off sharply ===
-- stmt-cl-1: 10 votes — 4A + 3SA + 3D → agrees:7, disagrees:3, superAgrees:3
('statement:room-cliff-1:stmt-cl-1', to_jsonb('{"id":"stmt-cl-1","text":"Banning cars downtown would dramatically improve air quality and public health for everyone.","roomId":"room-cliff-1","author":"user-alice","round":1,"timestamp":1774384100000,"agrees":7,"disagrees":3,"passes":0,"superAgrees":3,"voters":{"user-alice":"super_agree","user-bob":"agree","user-carol":"agree","user-dave":"disagree","user-eve":"super_agree","user-frank":"disagree","user-grace":"agree","user-hank":"disagree","user-anon1":"agree","user-anon2":"super_agree"}}'::text)),
-- stmt-cl-2: 10 votes — 5A + 2SA + 3D → agrees:7, disagrees:3, superAgrees:2
('statement:room-cliff-1:stmt-cl-2', to_jsonb('{"id":"stmt-cl-2","text":"Public transit is nowhere near good enough to replace cars in most American cities right now.","roomId":"room-cliff-1","author":"user-dave","round":1,"timestamp":1774384200000,"agrees":7,"disagrees":3,"passes":0,"superAgrees":2,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"agree","user-dave":"super_agree","user-eve":"disagree","user-frank":"agree","user-grace":"disagree","user-hank":"super_agree","user-anon1":"agree","user-anon2":"agree"}}'::text)),
-- stmt-cl-3: 6 votes — 3A + 3D (only 6 users voted)
('statement:room-cliff-1:stmt-cl-3', to_jsonb('{"id":"stmt-cl-3","text":"Car bans would destroy small businesses that depend on customer parking and drive-by traffic.","roomId":"room-cliff-1","author":"user-frank","round":1,"timestamp":1774384300000,"agrees":3,"disagrees":3,"passes":0,"superAgrees":0,"voters":{"user-alice":"disagree","user-bob":"agree","user-carol":"disagree","user-dave":"agree","user-eve":"disagree","user-frank":"agree"}}'::text)),
-- stmt-cl-4: 4 votes — 2A + 1SA + 1pass → agrees:3, superAgrees:1, passes:1
('statement:room-cliff-1:stmt-cl-4', to_jsonb('{"id":"stmt-cl-4","text":"European cities prove that car-free zones actually increase foot traffic and business revenue.","roomId":"room-cliff-1","author":"user-carol","round":1,"timestamp":1774384400000,"agrees":3,"disagrees":0,"passes":1,"superAgrees":1,"voters":{"user-alice":"super_agree","user-bob":"pass","user-carol":"agree","user-eve":"agree"}}'::text)),
-- stmt-cl-5: 2 votes — 2A
('statement:room-cliff-1:stmt-cl-5', to_jsonb('{"id":"stmt-cl-5","text":"This would only work in dense cities, not suburban areas where most Americans actually live.","roomId":"room-cliff-1","author":"user-hank","round":1,"timestamp":1774384500000,"agrees":2,"disagrees":0,"passes":0,"superAgrees":0,"voters":{"user-dave":"agree","user-frank":"agree"}}'::text)),
-- stmt-cl-6: 1 vote — 1SA → agrees:1, superAgrees:1
('statement:room-cliff-1:stmt-cl-6', to_jsonb('{"id":"stmt-cl-6","text":"We should start with pedestrian-only weekends as a low-risk pilot program before committing to anything permanent.","roomId":"room-cliff-1","author":"user-grace","round":1,"timestamp":1774384600000,"agrees":1,"disagrees":0,"passes":0,"superAgrees":1,"voters":{"user-grace":"super_agree"}}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================
-- EDGE CASE VOTES
-- ============================================================

INSERT INTO kv_store_f1a393b4 (key, value) VALUES

-- Room 11: Echo chamber votes (40 votes)
('vote:stmt-ec-1:user-alice', to_jsonb('{"id":"vote-ec-1-alice","statementId":"stmt-ec-1","userId":"user-alice","voteType":"super_agree","timestamp":1774380101000}'::text)),
('vote:stmt-ec-1:user-bob', to_jsonb('{"id":"vote-ec-1-bob","statementId":"stmt-ec-1","userId":"user-bob","voteType":"super_agree","timestamp":1774380102000}'::text)),
('vote:stmt-ec-1:user-carol', to_jsonb('{"id":"vote-ec-1-carol","statementId":"stmt-ec-1","userId":"user-carol","voteType":"super_agree","timestamp":1774380103000}'::text)),
('vote:stmt-ec-1:user-dave', to_jsonb('{"id":"vote-ec-1-dave","statementId":"stmt-ec-1","userId":"user-dave","voteType":"super_agree","timestamp":1774380104000}'::text)),
('vote:stmt-ec-1:user-eve', to_jsonb('{"id":"vote-ec-1-eve","statementId":"stmt-ec-1","userId":"user-eve","voteType":"super_agree","timestamp":1774380105000}'::text)),
('vote:stmt-ec-1:user-frank', to_jsonb('{"id":"vote-ec-1-frank","statementId":"stmt-ec-1","userId":"user-frank","voteType":"super_agree","timestamp":1774380106000}'::text)),
('vote:stmt-ec-1:user-grace', to_jsonb('{"id":"vote-ec-1-grace","statementId":"stmt-ec-1","userId":"user-grace","voteType":"super_agree","timestamp":1774380107000}'::text)),
('vote:stmt-ec-1:user-hank', to_jsonb('{"id":"vote-ec-1-hank","statementId":"stmt-ec-1","userId":"user-hank","voteType":"super_agree","timestamp":1774380108000}'::text)),
('vote:stmt-ec-1:user-anon1', to_jsonb('{"id":"vote-ec-1-anon1","statementId":"stmt-ec-1","userId":"user-anon1","voteType":"super_agree","timestamp":1774380109000}'::text)),
('vote:stmt-ec-1:user-anon2', to_jsonb('{"id":"vote-ec-1-anon2","statementId":"stmt-ec-1","userId":"user-anon2","voteType":"super_agree","timestamp":1774380110000}'::text)),
('vote:stmt-ec-2:user-alice', to_jsonb('{"id":"vote-ec-2-alice","statementId":"stmt-ec-2","userId":"user-alice","voteType":"super_agree","timestamp":1774380201000}'::text)),
('vote:stmt-ec-2:user-bob', to_jsonb('{"id":"vote-ec-2-bob","statementId":"stmt-ec-2","userId":"user-bob","voteType":"super_agree","timestamp":1774380202000}'::text)),
('vote:stmt-ec-2:user-carol', to_jsonb('{"id":"vote-ec-2-carol","statementId":"stmt-ec-2","userId":"user-carol","voteType":"super_agree","timestamp":1774380203000}'::text)),
('vote:stmt-ec-2:user-dave', to_jsonb('{"id":"vote-ec-2-dave","statementId":"stmt-ec-2","userId":"user-dave","voteType":"super_agree","timestamp":1774380204000}'::text)),
('vote:stmt-ec-2:user-eve', to_jsonb('{"id":"vote-ec-2-eve","statementId":"stmt-ec-2","userId":"user-eve","voteType":"super_agree","timestamp":1774380205000}'::text)),
('vote:stmt-ec-2:user-frank', to_jsonb('{"id":"vote-ec-2-frank","statementId":"stmt-ec-2","userId":"user-frank","voteType":"super_agree","timestamp":1774380206000}'::text)),
('vote:stmt-ec-2:user-grace', to_jsonb('{"id":"vote-ec-2-grace","statementId":"stmt-ec-2","userId":"user-grace","voteType":"super_agree","timestamp":1774380207000}'::text)),
('vote:stmt-ec-2:user-hank', to_jsonb('{"id":"vote-ec-2-hank","statementId":"stmt-ec-2","userId":"user-hank","voteType":"agree","timestamp":1774380208000}'::text)),
('vote:stmt-ec-2:user-anon1', to_jsonb('{"id":"vote-ec-2-anon1","statementId":"stmt-ec-2","userId":"user-anon1","voteType":"super_agree","timestamp":1774380209000}'::text)),
('vote:stmt-ec-2:user-anon2', to_jsonb('{"id":"vote-ec-2-anon2","statementId":"stmt-ec-2","userId":"user-anon2","voteType":"super_agree","timestamp":1774380210000}'::text)),
('vote:stmt-ec-3:user-alice', to_jsonb('{"id":"vote-ec-3-alice","statementId":"stmt-ec-3","userId":"user-alice","voteType":"super_agree","timestamp":1774380301000}'::text)),
('vote:stmt-ec-3:user-bob', to_jsonb('{"id":"vote-ec-3-bob","statementId":"stmt-ec-3","userId":"user-bob","voteType":"super_agree","timestamp":1774380302000}'::text)),
('vote:stmt-ec-3:user-carol', to_jsonb('{"id":"vote-ec-3-carol","statementId":"stmt-ec-3","userId":"user-carol","voteType":"super_agree","timestamp":1774380303000}'::text)),
('vote:stmt-ec-3:user-dave', to_jsonb('{"id":"vote-ec-3-dave","statementId":"stmt-ec-3","userId":"user-dave","voteType":"super_agree","timestamp":1774380304000}'::text)),
('vote:stmt-ec-3:user-eve', to_jsonb('{"id":"vote-ec-3-eve","statementId":"stmt-ec-3","userId":"user-eve","voteType":"super_agree","timestamp":1774380305000}'::text)),
('vote:stmt-ec-3:user-frank', to_jsonb('{"id":"vote-ec-3-frank","statementId":"stmt-ec-3","userId":"user-frank","voteType":"pass","timestamp":1774380306000}'::text)),
('vote:stmt-ec-3:user-grace', to_jsonb('{"id":"vote-ec-3-grace","statementId":"stmt-ec-3","userId":"user-grace","voteType":"super_agree","timestamp":1774380307000}'::text)),
('vote:stmt-ec-3:user-hank', to_jsonb('{"id":"vote-ec-3-hank","statementId":"stmt-ec-3","userId":"user-hank","voteType":"agree","timestamp":1774380308000}'::text)),
('vote:stmt-ec-3:user-anon1', to_jsonb('{"id":"vote-ec-3-anon1","statementId":"stmt-ec-3","userId":"user-anon1","voteType":"super_agree","timestamp":1774380309000}'::text)),
('vote:stmt-ec-3:user-anon2', to_jsonb('{"id":"vote-ec-3-anon2","statementId":"stmt-ec-3","userId":"user-anon2","voteType":"super_agree","timestamp":1774380310000}'::text)),
('vote:stmt-ec-4:user-alice', to_jsonb('{"id":"vote-ec-4-alice","statementId":"stmt-ec-4","userId":"user-alice","voteType":"super_agree","timestamp":1774380401000}'::text)),
('vote:stmt-ec-4:user-bob', to_jsonb('{"id":"vote-ec-4-bob","statementId":"stmt-ec-4","userId":"user-bob","voteType":"super_agree","timestamp":1774380402000}'::text)),
('vote:stmt-ec-4:user-carol', to_jsonb('{"id":"vote-ec-4-carol","statementId":"stmt-ec-4","userId":"user-carol","voteType":"super_agree","timestamp":1774380403000}'::text)),
('vote:stmt-ec-4:user-dave', to_jsonb('{"id":"vote-ec-4-dave","statementId":"stmt-ec-4","userId":"user-dave","voteType":"super_agree","timestamp":1774380404000}'::text)),
('vote:stmt-ec-4:user-eve', to_jsonb('{"id":"vote-ec-4-eve","statementId":"stmt-ec-4","userId":"user-eve","voteType":"super_agree","timestamp":1774380405000}'::text)),
('vote:stmt-ec-4:user-frank', to_jsonb('{"id":"vote-ec-4-frank","statementId":"stmt-ec-4","userId":"user-frank","voteType":"disagree","timestamp":1774380406000}'::text)),
('vote:stmt-ec-4:user-grace', to_jsonb('{"id":"vote-ec-4-grace","statementId":"stmt-ec-4","userId":"user-grace","voteType":"super_agree","timestamp":1774380407000}'::text)),
('vote:stmt-ec-4:user-hank', to_jsonb('{"id":"vote-ec-4-hank","statementId":"stmt-ec-4","userId":"user-hank","voteType":"super_agree","timestamp":1774380408000}'::text)),
('vote:stmt-ec-4:user-anon1', to_jsonb('{"id":"vote-ec-4-anon1","statementId":"stmt-ec-4","userId":"user-anon1","voteType":"super_agree","timestamp":1774380409000}'::text)),
('vote:stmt-ec-4:user-anon2', to_jsonb('{"id":"vote-ec-4-anon2","statementId":"stmt-ec-4","userId":"user-anon2","voteType":"super_agree","timestamp":1774380410000}'::text)),

-- Room 12: Polarized votes (50 votes)
('vote:stmt-pl-1:user-alice', to_jsonb('{"id":"vote-pl-1-alice","statementId":"stmt-pl-1","userId":"user-alice","voteType":"agree","timestamp":1774381101000}'::text)),
('vote:stmt-pl-1:user-bob', to_jsonb('{"id":"vote-pl-1-bob","statementId":"stmt-pl-1","userId":"user-bob","voteType":"agree","timestamp":1774381102000}'::text)),
('vote:stmt-pl-1:user-carol', to_jsonb('{"id":"vote-pl-1-carol","statementId":"stmt-pl-1","userId":"user-carol","voteType":"agree","timestamp":1774381103000}'::text)),
('vote:stmt-pl-1:user-dave', to_jsonb('{"id":"vote-pl-1-dave","statementId":"stmt-pl-1","userId":"user-dave","voteType":"agree","timestamp":1774381104000}'::text)),
('vote:stmt-pl-1:user-eve', to_jsonb('{"id":"vote-pl-1-eve","statementId":"stmt-pl-1","userId":"user-eve","voteType":"agree","timestamp":1774381105000}'::text)),
('vote:stmt-pl-1:user-frank', to_jsonb('{"id":"vote-pl-1-frank","statementId":"stmt-pl-1","userId":"user-frank","voteType":"disagree","timestamp":1774381106000}'::text)),
('vote:stmt-pl-1:user-grace', to_jsonb('{"id":"vote-pl-1-grace","statementId":"stmt-pl-1","userId":"user-grace","voteType":"disagree","timestamp":1774381107000}'::text)),
('vote:stmt-pl-1:user-hank', to_jsonb('{"id":"vote-pl-1-hank","statementId":"stmt-pl-1","userId":"user-hank","voteType":"disagree","timestamp":1774381108000}'::text)),
('vote:stmt-pl-1:user-anon1', to_jsonb('{"id":"vote-pl-1-anon1","statementId":"stmt-pl-1","userId":"user-anon1","voteType":"disagree","timestamp":1774381109000}'::text)),
('vote:stmt-pl-1:user-anon2', to_jsonb('{"id":"vote-pl-1-anon2","statementId":"stmt-pl-1","userId":"user-anon2","voteType":"disagree","timestamp":1774381110000}'::text)),
('vote:stmt-pl-2:user-alice', to_jsonb('{"id":"vote-pl-2-alice","statementId":"stmt-pl-2","userId":"user-alice","voteType":"disagree","timestamp":1774381201000}'::text)),
('vote:stmt-pl-2:user-bob', to_jsonb('{"id":"vote-pl-2-bob","statementId":"stmt-pl-2","userId":"user-bob","voteType":"agree","timestamp":1774381202000}'::text)),
('vote:stmt-pl-2:user-carol', to_jsonb('{"id":"vote-pl-2-carol","statementId":"stmt-pl-2","userId":"user-carol","voteType":"disagree","timestamp":1774381203000}'::text)),
('vote:stmt-pl-2:user-dave', to_jsonb('{"id":"vote-pl-2-dave","statementId":"stmt-pl-2","userId":"user-dave","voteType":"agree","timestamp":1774381204000}'::text)),
('vote:stmt-pl-2:user-eve', to_jsonb('{"id":"vote-pl-2-eve","statementId":"stmt-pl-2","userId":"user-eve","voteType":"disagree","timestamp":1774381205000}'::text)),
('vote:stmt-pl-2:user-frank', to_jsonb('{"id":"vote-pl-2-frank","statementId":"stmt-pl-2","userId":"user-frank","voteType":"agree","timestamp":1774381206000}'::text)),
('vote:stmt-pl-2:user-grace', to_jsonb('{"id":"vote-pl-2-grace","statementId":"stmt-pl-2","userId":"user-grace","voteType":"disagree","timestamp":1774381207000}'::text)),
('vote:stmt-pl-2:user-hank', to_jsonb('{"id":"vote-pl-2-hank","statementId":"stmt-pl-2","userId":"user-hank","voteType":"agree","timestamp":1774381208000}'::text)),
('vote:stmt-pl-2:user-anon1', to_jsonb('{"id":"vote-pl-2-anon1","statementId":"stmt-pl-2","userId":"user-anon1","voteType":"agree","timestamp":1774381209000}'::text)),
('vote:stmt-pl-2:user-anon2', to_jsonb('{"id":"vote-pl-2-anon2","statementId":"stmt-pl-2","userId":"user-anon2","voteType":"disagree","timestamp":1774381210000}'::text)),
('vote:stmt-pl-3:user-alice', to_jsonb('{"id":"vote-pl-3-alice","statementId":"stmt-pl-3","userId":"user-alice","voteType":"agree","timestamp":1774381301000}'::text)),
('vote:stmt-pl-3:user-bob', to_jsonb('{"id":"vote-pl-3-bob","statementId":"stmt-pl-3","userId":"user-bob","voteType":"disagree","timestamp":1774381302000}'::text)),
('vote:stmt-pl-3:user-carol', to_jsonb('{"id":"vote-pl-3-carol","statementId":"stmt-pl-3","userId":"user-carol","voteType":"agree","timestamp":1774381303000}'::text)),
('vote:stmt-pl-3:user-dave', to_jsonb('{"id":"vote-pl-3-dave","statementId":"stmt-pl-3","userId":"user-dave","voteType":"disagree","timestamp":1774381304000}'::text)),
('vote:stmt-pl-3:user-eve', to_jsonb('{"id":"vote-pl-3-eve","statementId":"stmt-pl-3","userId":"user-eve","voteType":"agree","timestamp":1774381305000}'::text)),
('vote:stmt-pl-3:user-frank', to_jsonb('{"id":"vote-pl-3-frank","statementId":"stmt-pl-3","userId":"user-frank","voteType":"disagree","timestamp":1774381306000}'::text)),
('vote:stmt-pl-3:user-grace', to_jsonb('{"id":"vote-pl-3-grace","statementId":"stmt-pl-3","userId":"user-grace","voteType":"agree","timestamp":1774381307000}'::text)),
('vote:stmt-pl-3:user-hank', to_jsonb('{"id":"vote-pl-3-hank","statementId":"stmt-pl-3","userId":"user-hank","voteType":"disagree","timestamp":1774381308000}'::text)),
('vote:stmt-pl-3:user-anon1', to_jsonb('{"id":"vote-pl-3-anon1","statementId":"stmt-pl-3","userId":"user-anon1","voteType":"agree","timestamp":1774381309000}'::text)),
('vote:stmt-pl-3:user-anon2', to_jsonb('{"id":"vote-pl-3-anon2","statementId":"stmt-pl-3","userId":"user-anon2","voteType":"disagree","timestamp":1774381310000}'::text)),
('vote:stmt-pl-4:user-alice', to_jsonb('{"id":"vote-pl-4-alice","statementId":"stmt-pl-4","userId":"user-alice","voteType":"disagree","timestamp":1774381401000}'::text)),
('vote:stmt-pl-4:user-bob', to_jsonb('{"id":"vote-pl-4-bob","statementId":"stmt-pl-4","userId":"user-bob","voteType":"disagree","timestamp":1774381402000}'::text)),
('vote:stmt-pl-4:user-carol', to_jsonb('{"id":"vote-pl-4-carol","statementId":"stmt-pl-4","userId":"user-carol","voteType":"agree","timestamp":1774381403000}'::text)),
('vote:stmt-pl-4:user-dave', to_jsonb('{"id":"vote-pl-4-dave","statementId":"stmt-pl-4","userId":"user-dave","voteType":"agree","timestamp":1774381404000}'::text)),
('vote:stmt-pl-4:user-eve', to_jsonb('{"id":"vote-pl-4-eve","statementId":"stmt-pl-4","userId":"user-eve","voteType":"agree","timestamp":1774381405000}'::text)),
('vote:stmt-pl-4:user-frank', to_jsonb('{"id":"vote-pl-4-frank","statementId":"stmt-pl-4","userId":"user-frank","voteType":"agree","timestamp":1774381406000}'::text)),
('vote:stmt-pl-4:user-grace', to_jsonb('{"id":"vote-pl-4-grace","statementId":"stmt-pl-4","userId":"user-grace","voteType":"disagree","timestamp":1774381407000}'::text)),
('vote:stmt-pl-4:user-hank', to_jsonb('{"id":"vote-pl-4-hank","statementId":"stmt-pl-4","userId":"user-hank","voteType":"agree","timestamp":1774381408000}'::text)),
('vote:stmt-pl-4:user-anon1', to_jsonb('{"id":"vote-pl-4-anon1","statementId":"stmt-pl-4","userId":"user-anon1","voteType":"disagree","timestamp":1774381409000}'::text)),
('vote:stmt-pl-4:user-anon2', to_jsonb('{"id":"vote-pl-4-anon2","statementId":"stmt-pl-4","userId":"user-anon2","voteType":"disagree","timestamp":1774381410000}'::text)),
('vote:stmt-pl-5:user-alice', to_jsonb('{"id":"vote-pl-5-alice","statementId":"stmt-pl-5","userId":"user-alice","voteType":"agree","timestamp":1774381501000}'::text)),
('vote:stmt-pl-5:user-bob', to_jsonb('{"id":"vote-pl-5-bob","statementId":"stmt-pl-5","userId":"user-bob","voteType":"agree","timestamp":1774381502000}'::text)),
('vote:stmt-pl-5:user-carol', to_jsonb('{"id":"vote-pl-5-carol","statementId":"stmt-pl-5","userId":"user-carol","voteType":"disagree","timestamp":1774381503000}'::text)),
('vote:stmt-pl-5:user-dave', to_jsonb('{"id":"vote-pl-5-dave","statementId":"stmt-pl-5","userId":"user-dave","voteType":"disagree","timestamp":1774381504000}'::text)),
('vote:stmt-pl-5:user-eve', to_jsonb('{"id":"vote-pl-5-eve","statementId":"stmt-pl-5","userId":"user-eve","voteType":"agree","timestamp":1774381505000}'::text)),
('vote:stmt-pl-5:user-frank', to_jsonb('{"id":"vote-pl-5-frank","statementId":"stmt-pl-5","userId":"user-frank","voteType":"disagree","timestamp":1774381506000}'::text)),
('vote:stmt-pl-5:user-grace', to_jsonb('{"id":"vote-pl-5-grace","statementId":"stmt-pl-5","userId":"user-grace","voteType":"agree","timestamp":1774381507000}'::text)),
('vote:stmt-pl-5:user-hank', to_jsonb('{"id":"vote-pl-5-hank","statementId":"stmt-pl-5","userId":"user-hank","voteType":"disagree","timestamp":1774381508000}'::text)),
('vote:stmt-pl-5:user-anon1', to_jsonb('{"id":"vote-pl-5-anon1","statementId":"stmt-pl-5","userId":"user-anon1","voteType":"agree","timestamp":1774381509000}'::text)),
('vote:stmt-pl-5:user-anon2', to_jsonb('{"id":"vote-pl-5-anon2","statementId":"stmt-pl-5","userId":"user-anon2","voteType":"disagree","timestamp":1774381510000}'::text)),

-- Room 13: Mega thread votes (60 votes)
('vote:stmt-mt-1:user-alice', to_jsonb('{"id":"vote-mt-1-alice","statementId":"stmt-mt-1","userId":"user-alice","voteType":"super_agree","timestamp":1774382101000}'::text)),
('vote:stmt-mt-1:user-bob', to_jsonb('{"id":"vote-mt-1-bob","statementId":"stmt-mt-1","userId":"user-bob","voteType":"agree","timestamp":1774382102000}'::text)),
('vote:stmt-mt-1:user-carol', to_jsonb('{"id":"vote-mt-1-carol","statementId":"stmt-mt-1","userId":"user-carol","voteType":"agree","timestamp":1774382103000}'::text)),
('vote:stmt-mt-1:user-dave', to_jsonb('{"id":"vote-mt-1-dave","statementId":"stmt-mt-1","userId":"user-dave","voteType":"disagree","timestamp":1774382104000}'::text)),
('vote:stmt-mt-1:user-eve', to_jsonb('{"id":"vote-mt-1-eve","statementId":"stmt-mt-1","userId":"user-eve","voteType":"super_agree","timestamp":1774382105000}'::text)),
('vote:stmt-mt-1:user-frank', to_jsonb('{"id":"vote-mt-1-frank","statementId":"stmt-mt-1","userId":"user-frank","voteType":"agree","timestamp":1774382106000}'::text)),
('vote:stmt-mt-1:user-grace', to_jsonb('{"id":"vote-mt-1-grace","statementId":"stmt-mt-1","userId":"user-grace","voteType":"agree","timestamp":1774382107000}'::text)),
('vote:stmt-mt-1:user-hank', to_jsonb('{"id":"vote-mt-1-hank","statementId":"stmt-mt-1","userId":"user-hank","voteType":"disagree","timestamp":1774382108000}'::text)),
('vote:stmt-mt-1:user-anon1', to_jsonb('{"id":"vote-mt-1-anon1","statementId":"stmt-mt-1","userId":"user-anon1","voteType":"agree","timestamp":1774382109000}'::text)),
('vote:stmt-mt-1:user-anon2', to_jsonb('{"id":"vote-mt-1-anon2","statementId":"stmt-mt-1","userId":"user-anon2","voteType":"pass","timestamp":1774382110000}'::text)),
('vote:stmt-mt-2:user-alice', to_jsonb('{"id":"vote-mt-2-alice","statementId":"stmt-mt-2","userId":"user-alice","voteType":"agree","timestamp":1774382201000}'::text)),
('vote:stmt-mt-2:user-bob', to_jsonb('{"id":"vote-mt-2-bob","statementId":"stmt-mt-2","userId":"user-bob","voteType":"super_agree","timestamp":1774382202000}'::text)),
('vote:stmt-mt-2:user-carol', to_jsonb('{"id":"vote-mt-2-carol","statementId":"stmt-mt-2","userId":"user-carol","voteType":"super_agree","timestamp":1774382203000}'::text)),
('vote:stmt-mt-2:user-dave', to_jsonb('{"id":"vote-mt-2-dave","statementId":"stmt-mt-2","userId":"user-dave","voteType":"agree","timestamp":1774382204000}'::text)),
('vote:stmt-mt-2:user-eve', to_jsonb('{"id":"vote-mt-2-eve","statementId":"stmt-mt-2","userId":"user-eve","voteType":"agree","timestamp":1774382205000}'::text)),
('vote:stmt-mt-2:user-frank', to_jsonb('{"id":"vote-mt-2-frank","statementId":"stmt-mt-2","userId":"user-frank","voteType":"disagree","timestamp":1774382206000}'::text)),
('vote:stmt-mt-2:user-grace', to_jsonb('{"id":"vote-mt-2-grace","statementId":"stmt-mt-2","userId":"user-grace","voteType":"super_agree","timestamp":1774382207000}'::text)),
('vote:stmt-mt-2:user-hank', to_jsonb('{"id":"vote-mt-2-hank","statementId":"stmt-mt-2","userId":"user-hank","voteType":"pass","timestamp":1774382208000}'::text)),
('vote:stmt-mt-2:user-anon1', to_jsonb('{"id":"vote-mt-2-anon1","statementId":"stmt-mt-2","userId":"user-anon1","voteType":"disagree","timestamp":1774382209000}'::text)),
('vote:stmt-mt-2:user-anon2', to_jsonb('{"id":"vote-mt-2-anon2","statementId":"stmt-mt-2","userId":"user-anon2","voteType":"agree","timestamp":1774382210000}'::text)),
('vote:stmt-mt-3:user-alice', to_jsonb('{"id":"vote-mt-3-alice","statementId":"stmt-mt-3","userId":"user-alice","voteType":"disagree","timestamp":1774382301000}'::text)),
('vote:stmt-mt-3:user-bob', to_jsonb('{"id":"vote-mt-3-bob","statementId":"stmt-mt-3","userId":"user-bob","voteType":"agree","timestamp":1774382302000}'::text)),
('vote:stmt-mt-3:user-carol', to_jsonb('{"id":"vote-mt-3-carol","statementId":"stmt-mt-3","userId":"user-carol","voteType":"disagree","timestamp":1774382303000}'::text)),
('vote:stmt-mt-3:user-dave', to_jsonb('{"id":"vote-mt-3-dave","statementId":"stmt-mt-3","userId":"user-dave","voteType":"agree","timestamp":1774382304000}'::text)),
('vote:stmt-mt-3:user-eve', to_jsonb('{"id":"vote-mt-3-eve","statementId":"stmt-mt-3","userId":"user-eve","voteType":"disagree","timestamp":1774382305000}'::text)),
('vote:stmt-mt-3:user-frank', to_jsonb('{"id":"vote-mt-3-frank","statementId":"stmt-mt-3","userId":"user-frank","voteType":"agree","timestamp":1774382306000}'::text)),
('vote:stmt-mt-3:user-grace', to_jsonb('{"id":"vote-mt-3-grace","statementId":"stmt-mt-3","userId":"user-grace","voteType":"disagree","timestamp":1774382307000}'::text)),
('vote:stmt-mt-3:user-hank', to_jsonb('{"id":"vote-mt-3-hank","statementId":"stmt-mt-3","userId":"user-hank","voteType":"agree","timestamp":1774382308000}'::text)),
('vote:stmt-mt-3:user-anon1', to_jsonb('{"id":"vote-mt-3-anon1","statementId":"stmt-mt-3","userId":"user-anon1","voteType":"pass","timestamp":1774382309000}'::text)),
('vote:stmt-mt-3:user-anon2', to_jsonb('{"id":"vote-mt-3-anon2","statementId":"stmt-mt-3","userId":"user-anon2","voteType":"agree","timestamp":1774382310000}'::text)),
('vote:stmt-mt-4:user-alice', to_jsonb('{"id":"vote-mt-4-alice","statementId":"stmt-mt-4","userId":"user-alice","voteType":"super_agree","timestamp":1774382401000}'::text)),
('vote:stmt-mt-4:user-bob', to_jsonb('{"id":"vote-mt-4-bob","statementId":"stmt-mt-4","userId":"user-bob","voteType":"super_agree","timestamp":1774382402000}'::text)),
('vote:stmt-mt-4:user-carol', to_jsonb('{"id":"vote-mt-4-carol","statementId":"stmt-mt-4","userId":"user-carol","voteType":"agree","timestamp":1774382403000}'::text)),
('vote:stmt-mt-4:user-dave', to_jsonb('{"id":"vote-mt-4-dave","statementId":"stmt-mt-4","userId":"user-dave","voteType":"agree","timestamp":1774382404000}'::text)),
('vote:stmt-mt-4:user-eve', to_jsonb('{"id":"vote-mt-4-eve","statementId":"stmt-mt-4","userId":"user-eve","voteType":"super_agree","timestamp":1774382405000}'::text)),
('vote:stmt-mt-4:user-frank', to_jsonb('{"id":"vote-mt-4-frank","statementId":"stmt-mt-4","userId":"user-frank","voteType":"agree","timestamp":1774382406000}'::text)),
('vote:stmt-mt-4:user-grace', to_jsonb('{"id":"vote-mt-4-grace","statementId":"stmt-mt-4","userId":"user-grace","voteType":"agree","timestamp":1774382407000}'::text)),
('vote:stmt-mt-4:user-hank', to_jsonb('{"id":"vote-mt-4-hank","statementId":"stmt-mt-4","userId":"user-hank","voteType":"agree","timestamp":1774382408000}'::text)),
('vote:stmt-mt-4:user-anon1', to_jsonb('{"id":"vote-mt-4-anon1","statementId":"stmt-mt-4","userId":"user-anon1","voteType":"agree","timestamp":1774382409000}'::text)),
('vote:stmt-mt-4:user-anon2', to_jsonb('{"id":"vote-mt-4-anon2","statementId":"stmt-mt-4","userId":"user-anon2","voteType":"super_agree","timestamp":1774382410000}'::text)),
('vote:stmt-mt-5:user-alice', to_jsonb('{"id":"vote-mt-5-alice","statementId":"stmt-mt-5","userId":"user-alice","voteType":"agree","timestamp":1774382501000}'::text)),
('vote:stmt-mt-5:user-bob', to_jsonb('{"id":"vote-mt-5-bob","statementId":"stmt-mt-5","userId":"user-bob","voteType":"agree","timestamp":1774382502000}'::text)),
('vote:stmt-mt-5:user-carol', to_jsonb('{"id":"vote-mt-5-carol","statementId":"stmt-mt-5","userId":"user-carol","voteType":"super_agree","timestamp":1774382503000}'::text)),
('vote:stmt-mt-5:user-dave', to_jsonb('{"id":"vote-mt-5-dave","statementId":"stmt-mt-5","userId":"user-dave","voteType":"pass","timestamp":1774382504000}'::text)),
('vote:stmt-mt-5:user-eve', to_jsonb('{"id":"vote-mt-5-eve","statementId":"stmt-mt-5","userId":"user-eve","voteType":"agree","timestamp":1774382505000}'::text)),
('vote:stmt-mt-5:user-frank', to_jsonb('{"id":"vote-mt-5-frank","statementId":"stmt-mt-5","userId":"user-frank","voteType":"disagree","timestamp":1774382506000}'::text)),
('vote:stmt-mt-5:user-grace', to_jsonb('{"id":"vote-mt-5-grace","statementId":"stmt-mt-5","userId":"user-grace","voteType":"agree","timestamp":1774382507000}'::text)),
('vote:stmt-mt-5:user-hank', to_jsonb('{"id":"vote-mt-5-hank","statementId":"stmt-mt-5","userId":"user-hank","voteType":"agree","timestamp":1774382508000}'::text)),
('vote:stmt-mt-5:user-anon1', to_jsonb('{"id":"vote-mt-5-anon1","statementId":"stmt-mt-5","userId":"user-anon1","voteType":"super_agree","timestamp":1774382509000}'::text)),
('vote:stmt-mt-5:user-anon2', to_jsonb('{"id":"vote-mt-5-anon2","statementId":"stmt-mt-5","userId":"user-anon2","voteType":"agree","timestamp":1774382510000}'::text)),
('vote:stmt-mt-6:user-alice', to_jsonb('{"id":"vote-mt-6-alice","statementId":"stmt-mt-6","userId":"user-alice","voteType":"disagree","timestamp":1774382601000}'::text)),
('vote:stmt-mt-6:user-bob', to_jsonb('{"id":"vote-mt-6-bob","statementId":"stmt-mt-6","userId":"user-bob","voteType":"agree","timestamp":1774382602000}'::text)),
('vote:stmt-mt-6:user-carol', to_jsonb('{"id":"vote-mt-6-carol","statementId":"stmt-mt-6","userId":"user-carol","voteType":"agree","timestamp":1774382603000}'::text)),
('vote:stmt-mt-6:user-dave', to_jsonb('{"id":"vote-mt-6-dave","statementId":"stmt-mt-6","userId":"user-dave","voteType":"disagree","timestamp":1774382604000}'::text)),
('vote:stmt-mt-6:user-eve', to_jsonb('{"id":"vote-mt-6-eve","statementId":"stmt-mt-6","userId":"user-eve","voteType":"pass","timestamp":1774382605000}'::text)),
('vote:stmt-mt-6:user-frank', to_jsonb('{"id":"vote-mt-6-frank","statementId":"stmt-mt-6","userId":"user-frank","voteType":"disagree","timestamp":1774382606000}'::text)),
('vote:stmt-mt-6:user-grace', to_jsonb('{"id":"vote-mt-6-grace","statementId":"stmt-mt-6","userId":"user-grace","voteType":"agree","timestamp":1774382607000}'::text)),
('vote:stmt-mt-6:user-hank', to_jsonb('{"id":"vote-mt-6-hank","statementId":"stmt-mt-6","userId":"user-hank","voteType":"disagree","timestamp":1774382608000}'::text)),
('vote:stmt-mt-6:user-anon1', to_jsonb('{"id":"vote-mt-6-anon1","statementId":"stmt-mt-6","userId":"user-anon1","voteType":"agree","timestamp":1774382609000}'::text)),
('vote:stmt-mt-6:user-anon2', to_jsonb('{"id":"vote-mt-6-anon2","statementId":"stmt-mt-6","userId":"user-anon2","voteType":"disagree","timestamp":1774382610000}'::text)),

-- Room 14: Undecided votes (50 votes — mostly passes)
('vote:stmt-un-1:user-alice', to_jsonb('{"id":"vote-un-1-alice","statementId":"stmt-un-1","userId":"user-alice","voteType":"pass","timestamp":1774383101000}'::text)),
('vote:stmt-un-1:user-bob', to_jsonb('{"id":"vote-un-1-bob","statementId":"stmt-un-1","userId":"user-bob","voteType":"pass","timestamp":1774383102000}'::text)),
('vote:stmt-un-1:user-carol', to_jsonb('{"id":"vote-un-1-carol","statementId":"stmt-un-1","userId":"user-carol","voteType":"agree","timestamp":1774383103000}'::text)),
('vote:stmt-un-1:user-dave', to_jsonb('{"id":"vote-un-1-dave","statementId":"stmt-un-1","userId":"user-dave","voteType":"pass","timestamp":1774383104000}'::text)),
('vote:stmt-un-1:user-eve', to_jsonb('{"id":"vote-un-1-eve","statementId":"stmt-un-1","userId":"user-eve","voteType":"pass","timestamp":1774383105000}'::text)),
('vote:stmt-un-1:user-frank', to_jsonb('{"id":"vote-un-1-frank","statementId":"stmt-un-1","userId":"user-frank","voteType":"pass","timestamp":1774383106000}'::text)),
('vote:stmt-un-1:user-grace', to_jsonb('{"id":"vote-un-1-grace","statementId":"stmt-un-1","userId":"user-grace","voteType":"disagree","timestamp":1774383107000}'::text)),
('vote:stmt-un-1:user-hank', to_jsonb('{"id":"vote-un-1-hank","statementId":"stmt-un-1","userId":"user-hank","voteType":"pass","timestamp":1774383108000}'::text)),
('vote:stmt-un-1:user-anon1', to_jsonb('{"id":"vote-un-1-anon1","statementId":"stmt-un-1","userId":"user-anon1","voteType":"pass","timestamp":1774383109000}'::text)),
('vote:stmt-un-1:user-anon2', to_jsonb('{"id":"vote-un-1-anon2","statementId":"stmt-un-1","userId":"user-anon2","voteType":"pass","timestamp":1774383110000}'::text)),
('vote:stmt-un-2:user-alice', to_jsonb('{"id":"vote-un-2-alice","statementId":"stmt-un-2","userId":"user-alice","voteType":"agree","timestamp":1774383201000}'::text)),
('vote:stmt-un-2:user-bob', to_jsonb('{"id":"vote-un-2-bob","statementId":"stmt-un-2","userId":"user-bob","voteType":"pass","timestamp":1774383202000}'::text)),
('vote:stmt-un-2:user-carol', to_jsonb('{"id":"vote-un-2-carol","statementId":"stmt-un-2","userId":"user-carol","voteType":"pass","timestamp":1774383203000}'::text)),
('vote:stmt-un-2:user-dave', to_jsonb('{"id":"vote-un-2-dave","statementId":"stmt-un-2","userId":"user-dave","voteType":"pass","timestamp":1774383204000}'::text)),
('vote:stmt-un-2:user-eve', to_jsonb('{"id":"vote-un-2-eve","statementId":"stmt-un-2","userId":"user-eve","voteType":"agree","timestamp":1774383205000}'::text)),
('vote:stmt-un-2:user-frank', to_jsonb('{"id":"vote-un-2-frank","statementId":"stmt-un-2","userId":"user-frank","voteType":"pass","timestamp":1774383206000}'::text)),
('vote:stmt-un-2:user-grace', to_jsonb('{"id":"vote-un-2-grace","statementId":"stmt-un-2","userId":"user-grace","voteType":"pass","timestamp":1774383207000}'::text)),
('vote:stmt-un-2:user-hank', to_jsonb('{"id":"vote-un-2-hank","statementId":"stmt-un-2","userId":"user-hank","voteType":"pass","timestamp":1774383208000}'::text)),
('vote:stmt-un-2:user-anon1', to_jsonb('{"id":"vote-un-2-anon1","statementId":"stmt-un-2","userId":"user-anon1","voteType":"pass","timestamp":1774383209000}'::text)),
('vote:stmt-un-2:user-anon2', to_jsonb('{"id":"vote-un-2-anon2","statementId":"stmt-un-2","userId":"user-anon2","voteType":"pass","timestamp":1774383210000}'::text)),
('vote:stmt-un-3:user-alice', to_jsonb('{"id":"vote-un-3-alice","statementId":"stmt-un-3","userId":"user-alice","voteType":"pass","timestamp":1774383301000}'::text)),
('vote:stmt-un-3:user-bob', to_jsonb('{"id":"vote-un-3-bob","statementId":"stmt-un-3","userId":"user-bob","voteType":"pass","timestamp":1774383302000}'::text)),
('vote:stmt-un-3:user-carol', to_jsonb('{"id":"vote-un-3-carol","statementId":"stmt-un-3","userId":"user-carol","voteType":"pass","timestamp":1774383303000}'::text)),
('vote:stmt-un-3:user-dave', to_jsonb('{"id":"vote-un-3-dave","statementId":"stmt-un-3","userId":"user-dave","voteType":"disagree","timestamp":1774383304000}'::text)),
('vote:stmt-un-3:user-eve', to_jsonb('{"id":"vote-un-3-eve","statementId":"stmt-un-3","userId":"user-eve","voteType":"pass","timestamp":1774383305000}'::text)),
('vote:stmt-un-3:user-frank', to_jsonb('{"id":"vote-un-3-frank","statementId":"stmt-un-3","userId":"user-frank","voteType":"disagree","timestamp":1774383306000}'::text)),
('vote:stmt-un-3:user-grace', to_jsonb('{"id":"vote-un-3-grace","statementId":"stmt-un-3","userId":"user-grace","voteType":"pass","timestamp":1774383307000}'::text)),
('vote:stmt-un-3:user-hank', to_jsonb('{"id":"vote-un-3-hank","statementId":"stmt-un-3","userId":"user-hank","voteType":"pass","timestamp":1774383308000}'::text)),
('vote:stmt-un-3:user-anon1', to_jsonb('{"id":"vote-un-3-anon1","statementId":"stmt-un-3","userId":"user-anon1","voteType":"pass","timestamp":1774383309000}'::text)),
('vote:stmt-un-3:user-anon2', to_jsonb('{"id":"vote-un-3-anon2","statementId":"stmt-un-3","userId":"user-anon2","voteType":"pass","timestamp":1774383310000}'::text)),
('vote:stmt-un-4:user-alice', to_jsonb('{"id":"vote-un-4-alice","statementId":"stmt-un-4","userId":"user-alice","voteType":"pass","timestamp":1774383401000}'::text)),
('vote:stmt-un-4:user-bob', to_jsonb('{"id":"vote-un-4-bob","statementId":"stmt-un-4","userId":"user-bob","voteType":"pass","timestamp":1774383402000}'::text)),
('vote:stmt-un-4:user-carol', to_jsonb('{"id":"vote-un-4-carol","statementId":"stmt-un-4","userId":"user-carol","voteType":"pass","timestamp":1774383403000}'::text)),
('vote:stmt-un-4:user-dave', to_jsonb('{"id":"vote-un-4-dave","statementId":"stmt-un-4","userId":"user-dave","voteType":"pass","timestamp":1774383404000}'::text)),
('vote:stmt-un-4:user-eve', to_jsonb('{"id":"vote-un-4-eve","statementId":"stmt-un-4","userId":"user-eve","voteType":"super_agree","timestamp":1774383405000}'::text)),
('vote:stmt-un-4:user-frank', to_jsonb('{"id":"vote-un-4-frank","statementId":"stmt-un-4","userId":"user-frank","voteType":"pass","timestamp":1774383406000}'::text)),
('vote:stmt-un-4:user-grace', to_jsonb('{"id":"vote-un-4-grace","statementId":"stmt-un-4","userId":"user-grace","voteType":"pass","timestamp":1774383407000}'::text)),
('vote:stmt-un-4:user-hank', to_jsonb('{"id":"vote-un-4-hank","statementId":"stmt-un-4","userId":"user-hank","voteType":"pass","timestamp":1774383408000}'::text)),
('vote:stmt-un-4:user-anon1', to_jsonb('{"id":"vote-un-4-anon1","statementId":"stmt-un-4","userId":"user-anon1","voteType":"pass","timestamp":1774383409000}'::text)),
('vote:stmt-un-4:user-anon2', to_jsonb('{"id":"vote-un-4-anon2","statementId":"stmt-un-4","userId":"user-anon2","voteType":"pass","timestamp":1774383410000}'::text)),
('vote:stmt-un-5:user-alice', to_jsonb('{"id":"vote-un-5-alice","statementId":"stmt-un-5","userId":"user-alice","voteType":"pass","timestamp":1774383501000}'::text)),
('vote:stmt-un-5:user-bob', to_jsonb('{"id":"vote-un-5-bob","statementId":"stmt-un-5","userId":"user-bob","voteType":"disagree","timestamp":1774383502000}'::text)),
('vote:stmt-un-5:user-carol', to_jsonb('{"id":"vote-un-5-carol","statementId":"stmt-un-5","userId":"user-carol","voteType":"pass","timestamp":1774383503000}'::text)),
('vote:stmt-un-5:user-dave', to_jsonb('{"id":"vote-un-5-dave","statementId":"stmt-un-5","userId":"user-dave","voteType":"pass","timestamp":1774383504000}'::text)),
('vote:stmt-un-5:user-eve', to_jsonb('{"id":"vote-un-5-eve","statementId":"stmt-un-5","userId":"user-eve","voteType":"pass","timestamp":1774383505000}'::text)),
('vote:stmt-un-5:user-frank', to_jsonb('{"id":"vote-un-5-frank","statementId":"stmt-un-5","userId":"user-frank","voteType":"pass","timestamp":1774383506000}'::text)),
('vote:stmt-un-5:user-grace', to_jsonb('{"id":"vote-un-5-grace","statementId":"stmt-un-5","userId":"user-grace","voteType":"pass","timestamp":1774383507000}'::text)),
('vote:stmt-un-5:user-hank', to_jsonb('{"id":"vote-un-5-hank","statementId":"stmt-un-5","userId":"user-hank","voteType":"pass","timestamp":1774383508000}'::text)),
('vote:stmt-un-5:user-anon1', to_jsonb('{"id":"vote-un-5-anon1","statementId":"stmt-un-5","userId":"user-anon1","voteType":"pass","timestamp":1774383509000}'::text)),
('vote:stmt-un-5:user-anon2', to_jsonb('{"id":"vote-un-5-anon2","statementId":"stmt-un-5","userId":"user-anon2","voteType":"pass","timestamp":1774383510000}'::text)),

-- Room 15: Engagement cliff votes (33 votes — decreasing per statement)
('vote:stmt-cl-1:user-alice', to_jsonb('{"id":"vote-cl-1-alice","statementId":"stmt-cl-1","userId":"user-alice","voteType":"super_agree","timestamp":1774384101000}'::text)),
('vote:stmt-cl-1:user-bob', to_jsonb('{"id":"vote-cl-1-bob","statementId":"stmt-cl-1","userId":"user-bob","voteType":"agree","timestamp":1774384102000}'::text)),
('vote:stmt-cl-1:user-carol', to_jsonb('{"id":"vote-cl-1-carol","statementId":"stmt-cl-1","userId":"user-carol","voteType":"agree","timestamp":1774384103000}'::text)),
('vote:stmt-cl-1:user-dave', to_jsonb('{"id":"vote-cl-1-dave","statementId":"stmt-cl-1","userId":"user-dave","voteType":"disagree","timestamp":1774384104000}'::text)),
('vote:stmt-cl-1:user-eve', to_jsonb('{"id":"vote-cl-1-eve","statementId":"stmt-cl-1","userId":"user-eve","voteType":"super_agree","timestamp":1774384105000}'::text)),
('vote:stmt-cl-1:user-frank', to_jsonb('{"id":"vote-cl-1-frank","statementId":"stmt-cl-1","userId":"user-frank","voteType":"disagree","timestamp":1774384106000}'::text)),
('vote:stmt-cl-1:user-grace', to_jsonb('{"id":"vote-cl-1-grace","statementId":"stmt-cl-1","userId":"user-grace","voteType":"agree","timestamp":1774384107000}'::text)),
('vote:stmt-cl-1:user-hank', to_jsonb('{"id":"vote-cl-1-hank","statementId":"stmt-cl-1","userId":"user-hank","voteType":"disagree","timestamp":1774384108000}'::text)),
('vote:stmt-cl-1:user-anon1', to_jsonb('{"id":"vote-cl-1-anon1","statementId":"stmt-cl-1","userId":"user-anon1","voteType":"agree","timestamp":1774384109000}'::text)),
('vote:stmt-cl-1:user-anon2', to_jsonb('{"id":"vote-cl-1-anon2","statementId":"stmt-cl-1","userId":"user-anon2","voteType":"super_agree","timestamp":1774384110000}'::text)),
('vote:stmt-cl-2:user-alice', to_jsonb('{"id":"vote-cl-2-alice","statementId":"stmt-cl-2","userId":"user-alice","voteType":"disagree","timestamp":1774384201000}'::text)),
('vote:stmt-cl-2:user-bob', to_jsonb('{"id":"vote-cl-2-bob","statementId":"stmt-cl-2","userId":"user-bob","voteType":"agree","timestamp":1774384202000}'::text)),
('vote:stmt-cl-2:user-carol', to_jsonb('{"id":"vote-cl-2-carol","statementId":"stmt-cl-2","userId":"user-carol","voteType":"agree","timestamp":1774384203000}'::text)),
('vote:stmt-cl-2:user-dave', to_jsonb('{"id":"vote-cl-2-dave","statementId":"stmt-cl-2","userId":"user-dave","voteType":"super_agree","timestamp":1774384204000}'::text)),
('vote:stmt-cl-2:user-eve', to_jsonb('{"id":"vote-cl-2-eve","statementId":"stmt-cl-2","userId":"user-eve","voteType":"disagree","timestamp":1774384205000}'::text)),
('vote:stmt-cl-2:user-frank', to_jsonb('{"id":"vote-cl-2-frank","statementId":"stmt-cl-2","userId":"user-frank","voteType":"agree","timestamp":1774384206000}'::text)),
('vote:stmt-cl-2:user-grace', to_jsonb('{"id":"vote-cl-2-grace","statementId":"stmt-cl-2","userId":"user-grace","voteType":"disagree","timestamp":1774384207000}'::text)),
('vote:stmt-cl-2:user-hank', to_jsonb('{"id":"vote-cl-2-hank","statementId":"stmt-cl-2","userId":"user-hank","voteType":"super_agree","timestamp":1774384208000}'::text)),
('vote:stmt-cl-2:user-anon1', to_jsonb('{"id":"vote-cl-2-anon1","statementId":"stmt-cl-2","userId":"user-anon1","voteType":"agree","timestamp":1774384209000}'::text)),
('vote:stmt-cl-2:user-anon2', to_jsonb('{"id":"vote-cl-2-anon2","statementId":"stmt-cl-2","userId":"user-anon2","voteType":"agree","timestamp":1774384210000}'::text)),
('vote:stmt-cl-3:user-alice', to_jsonb('{"id":"vote-cl-3-alice","statementId":"stmt-cl-3","userId":"user-alice","voteType":"disagree","timestamp":1774384301000}'::text)),
('vote:stmt-cl-3:user-bob', to_jsonb('{"id":"vote-cl-3-bob","statementId":"stmt-cl-3","userId":"user-bob","voteType":"agree","timestamp":1774384302000}'::text)),
('vote:stmt-cl-3:user-carol', to_jsonb('{"id":"vote-cl-3-carol","statementId":"stmt-cl-3","userId":"user-carol","voteType":"disagree","timestamp":1774384303000}'::text)),
('vote:stmt-cl-3:user-dave', to_jsonb('{"id":"vote-cl-3-dave","statementId":"stmt-cl-3","userId":"user-dave","voteType":"agree","timestamp":1774384304000}'::text)),
('vote:stmt-cl-3:user-eve', to_jsonb('{"id":"vote-cl-3-eve","statementId":"stmt-cl-3","userId":"user-eve","voteType":"disagree","timestamp":1774384305000}'::text)),
('vote:stmt-cl-3:user-frank', to_jsonb('{"id":"vote-cl-3-frank","statementId":"stmt-cl-3","userId":"user-frank","voteType":"agree","timestamp":1774384306000}'::text)),
('vote:stmt-cl-4:user-alice', to_jsonb('{"id":"vote-cl-4-alice","statementId":"stmt-cl-4","userId":"user-alice","voteType":"super_agree","timestamp":1774384401000}'::text)),
('vote:stmt-cl-4:user-bob', to_jsonb('{"id":"vote-cl-4-bob","statementId":"stmt-cl-4","userId":"user-bob","voteType":"pass","timestamp":1774384402000}'::text)),
('vote:stmt-cl-4:user-carol', to_jsonb('{"id":"vote-cl-4-carol","statementId":"stmt-cl-4","userId":"user-carol","voteType":"agree","timestamp":1774384403000}'::text)),
('vote:stmt-cl-4:user-eve', to_jsonb('{"id":"vote-cl-4-eve","statementId":"stmt-cl-4","userId":"user-eve","voteType":"agree","timestamp":1774384404000}'::text)),
('vote:stmt-cl-5:user-dave', to_jsonb('{"id":"vote-cl-5-dave","statementId":"stmt-cl-5","userId":"user-dave","voteType":"agree","timestamp":1774384501000}'::text)),
('vote:stmt-cl-5:user-frank', to_jsonb('{"id":"vote-cl-5-frank","statementId":"stmt-cl-5","userId":"user-frank","voteType":"agree","timestamp":1774384502000}'::text)),
('vote:stmt-cl-6:user-grace', to_jsonb('{"id":"vote-cl-6-grace","statementId":"stmt-cl-6","userId":"user-grace","voteType":"super_agree","timestamp":1774384601000}'::text))

ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
