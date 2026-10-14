# Trait balance cards

Source-grounded current records and proposed review direction. Costs/rarities are not invented for traits that are not part purchases. Founding defaults, expressed anatomy, molecular identity, individual preferences and learned behavior are separate categories.

## survival gene: body

**Role / pros:** Visible size and strike expression; physical mass remains founding physiology plus development
**Tradeoffs / gaps:** No installed part/size-gene mass penalty: physical mass stays with founding physiology and development. Review free size/strike gains.
**Current definition:** `{"role":"Visible size and strike expression; physical mass remains founding physiology plus development","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Visible size and strike expression; physical mass remains founding physiology plus development
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: motion

**Role / pros:** Movement speed and chase/escape efficacy
**Tradeoffs / gaps:** Faster motion raises existing speed-dependent movement expenditure; endurance and usefulness need live comparison.
**Current definition:** `{"role":"Movement speed and chase/escape efficacy","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Movement speed and chase/escape efficacy
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: metabolism

**Role / pros:** Efficiency of ongoing and movement energy costs
**Tradeoffs / gaps:** Higher values lower current energy debits. No separate direct countercost identified; review dominant direction before assigning a penalty.
**Current definition:** `{"role":"Efficiency of ongoing and movement energy costs","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Efficiency of ongoing and movement energy costs
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: digestion

**Role / pros:** Food assimilation and anatomy-dependent hunting efficacy
**Tradeoffs / gaps:** Higher assimilation/hunting efficiency has no explicit universal countercost identified in this audit.
**Current definition:** `{"role":"Food assimilation and anatomy-dependent hunting efficacy","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Food assimilation and anatomy-dependent hunting efficacy
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: senses

**Role / pros:** Sensory/search range and target discovery
**Tradeoffs / gaps:** Wider discovery range has no explicit gene-level upkeep debit identified; sensory parts do have their own costs.
**Current definition:** `{"role":"Sensory/search range and target discovery","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Sensory/search range and target discovery
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: climate

**Role / pros:** Thermal comfort and exposure response
**Tradeoffs / gaps:** Shifts thermal comfort; suitability depends on actual local temperature rather than an always-better maximum.
**Current definition:** `{"role":"Thermal comfort and exposure response","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Thermal comfort and exposure response
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: immunity

**Role / pros:** Disease susceptibility and well-fed recovery
**Tradeoffs / gaps:** Recovery still requires food and disease exposure remains real; no independent daily gene countercost identified.
**Current definition:** `{"role":"Disease susceptibility and well-fed recovery","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Disease susceptibility and well-fed recovery
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## survival gene: temperament

**Role / pros:** Inherited behavior/courtship interpretation
**Tradeoffs / gaps:** Individual behavior and preference response are contextual, not a universal positive stat
**Current definition:** `{"role":"Inherited behavior/courtship interpretation","domain":{"min":0.72,"max":1.28},"mutation":"Parental allele plus existing bounded mutation; no MP price"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited behavior/courtship interpretation
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## expressed adaptation: hardened-mantle

**Role / pros:** Stalker bites hurt less.
**Tradeoffs / gaps:** Sprinting is slightly slower.
**Current definition:** `{"role":"Stalker bites hurt less.","name":"Hardened Mantle","short":"Armor","branch":"defense","summary":"Stalker bites hurt less.","tradeoff":"Sprinting is slightly slower.","pressure":{"predation":5,"disease":0.5},"visual":"thicker mantle","anatomicalExpression":{"axis":"armor","threshold":0.5},"numericEffects":{"predatorDamage":0.74,"sprintSpeed":0.95,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Sprinting is slightly slower."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** thicker mantle; preserve actual anatomy/behavior ownership; Stalker bites hurt less.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: barbed-limbs

**Role / pros:** Your bite-and-limb strike can drive a Stalker back.
**Tradeoffs / gaps:** Sprinting costs a little more energy.
**Current definition:** `{"role":"Your bite-and-limb strike can drive a Stalker back.","name":"Barbed Limbs","short":"Barbs","branch":"defense","summary":"Your bite-and-limb strike can drive a Stalker back.","tradeoff":"Sprinting costs a little more energy.","pressure":{"predation":5,"scarcity":1},"visual":"barbed outer legs","anatomicalExpression":{"axis":"barbs","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1.08,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":2.35,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Sprinting costs a little more energy."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** barbed outer legs; preserve actual anatomy/behavior ownership; Your bite-and-limb strike can drive a Stalker back.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: bitter-slime

**Role / pros:** A Stalker that bites you recoils and avoids you briefly.
**Tradeoffs / gaps:** Making the secretion costs energy.
**Current definition:** `{"role":"A Stalker that bites you recoils and avoids you briefly.","name":"Bitter Slime","short":"Bitter slime","branch":"defense","summary":"A Stalker that bites you recoils and avoids you briefly.","tradeoff":"Making the secretion costs energy.","pressure":{"predation":5,"disease":1},"visual":"bright mantle edge","anatomicalExpression":{"axis":"glands","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":true,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Making the secretion costs energy."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** bright mantle edge; preserve actual anatomy/behavior ownership; A Stalker that bites you recoils and avoids you briefly.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: spring-tendons

**Role / pros:** Sprint faster when escape matters.
**Tradeoffs / gaps:** Fast sprinting burns more energy.
**Current definition:** `{"role":"Sprint faster when escape matters.","name":"Spring Tendons","short":"Spring legs","branch":"mobility","summary":"Sprint faster when escape matters.","tradeoff":"Fast sprinting burns more energy.","pressure":{"predation":3,"dryness":2,"scarcity":1},"visual":"long springing rear legs","anatomicalExpression":{"axis":"spring","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1.14,"sprintEnergy":1.18,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Fast sprinting burns more energy."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** long springing rear legs; preserve actual anatomy/behavior ownership; Sprint faster when escape matters.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: water-sacs

**Role / pros:** Lose water more slowly.
**Tradeoffs / gaps:** A little extra body mass slows sprinting.
**Current definition:** `{"role":"Lose water more slowly.","name":"Water Sacs","short":"Water sacs","branch":"survival","summary":"Lose water more slowly.","tradeoff":"A little extra body mass slows sprinting.","pressure":{"dryness":6,"heat":1,"cold":1},"visual":"fuller side lobes","anatomicalExpression":{"axis":"waterBody","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":0.97,"sprintEnergy":1,"waterUse":0.72,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"A little extra body mass slows sprinting."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** fuller side lobes; preserve actual anatomy/behavior ownership; Lose water more slowly.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: efficient-gut

**Role / pros:** Food restores more energy.
**Tradeoffs / gaps:** Uses a little more water.
**Current definition:** `{"role":"Food restores more energy.","name":"Efficient Gut","short":"Efficient gut","branch":"survival","summary":"Food restores more energy.","tradeoff":"Uses a little more water.","pressure":{"scarcity":6,"dryness":1},"visual":"deeper lower mantle","anatomicalExpression":{"axis":"gut","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1.06,"foodGain":1.28,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Uses a little more water."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** deeper lower mantle; preserve actual anatomy/behavior ownership; Food restores more energy.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: fast-healing

**Role / pros:** Recover health much faster while well fed.
**Tradeoffs / gaps:** Healing raises daily energy use.
**Current definition:** `{"role":"Recover health much faster while well fed.","name":"Fast Healing","short":"Fast healing","branch":"survival","summary":"Recover health much faster while well fed.","tradeoff":"Healing raises daily energy use.","pressure":{"disease":5,"predation":2,"scarcity":1},"visual":"pale repair spots","anatomicalExpression":{"axis":"repair","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":2.35,"metabolism":1.07,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Healing raises daily energy use."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** pale repair spots; preserve actual anatomy/behavior ownership; Recover health much faster while well fed.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: alarm-pulse

**Role / pros:** Press X to warn nearby family when a Stalker is close.
**Tradeoffs / gaps:** The pulse costs energy and has a cooldown.
**Current definition:** `{"role":"Press X to warn nearby family when a Stalker is close.","name":"Alarm Pulse","short":"Alarm pulse","branch":"social","summary":"Press X to warn nearby family when a Stalker is close.","tradeoff":"The pulse costs energy and has a cooldown.","pressure":{"predation":3,"fewMates":3},"visual":"paired sensory crest","anatomicalExpression":{"axis":"signal","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":true,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"The pulse costs energy and has a cooldown."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** paired sensory crest; preserve actual anatomy/behavior ownership; Press X to warn nearby family when a Stalker is close.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: camouflage-mantle

**Role / pros:** Hide in dense cover and feed quietly without revealing yourself.
**Tradeoffs / gaps:** Ordinary movement still exposes you; very close Stalkers can still find you.
**Current definition:** `{"role":"Hide in dense cover and feed quietly without revealing yourself.","name":"Camouflage Mantle","short":"Camouflage","branch":"stealth","summary":"Hide in dense cover and feed quietly without revealing yourself.","tradeoff":"Ordinary movement still exposes you; very close Stalkers can still find you.","pressure":{"predation":5,"scarcity":1},"visual":"broken habitat-colored mottling","anatomicalExpression":{"axis":"skin","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":true,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Ordinary movement still exposes you; very close Stalkers can still find you."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** broken habitat-colored mottling; preserve actual anatomy/behavior ownership; Hide in dense cover and feed quietly without revealing yourself.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: heavy-jaw

**Role / pros:** Your bite hits much harder; fit descendants may challenge Stalkers near home.
**Tradeoffs / gaps:** The larger jaw raises water use.
**Current definition:** `{"role":"Your bite hits much harder; fit descendants may challenge Stalkers near home.","name":"Heavy Jaw","short":"Heavy jaw","branch":"offense","summary":"Your bite hits much harder; fit descendants may challenge Stalkers near home.","tradeoff":"The larger jaw raises water use.","pressure":{"predation":4,"scarcity":3},"visual":"larger jaw plates","anatomicalExpression":{"axis":"jaw","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1.08,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1.62,"strikeEnergy":1.16,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"The larger jaw raises water use."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** larger jaw plates; preserve actual anatomy/behavior ownership; Your bite hits much harder; fit descendants may challenge Stalkers near home.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: mobbing-instinct

**Role / pros:** Rally adult family against Stalkers; mature relatives also defend threatened young.
**Tradeoffs / gaps:** Rallying costs energy and can put relatives at risk.
**Current definition:** `{"role":"Rally adult family against Stalkers; mature relatives also defend threatened young.","name":"Mobbing Instinct","short":"Mobbing","branch":"social","summary":"Rally adult family against Stalkers; mature relatives also defend threatened young.","tradeoff":"Rallying costs energy and can put relatives at risk.","pressure":{"predation":4,"fewMates":4},"visual":"flared signal crests","anatomicalExpression":{"axis":"rally","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":true,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Rallying costs energy and can put relatives at risk."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** flared signal crests; preserve actual anatomy/behavior ownership; Rally adult family against Stalkers; mature relatives also defend threatened young.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: grasping-limbs

**Role / pros:** Press Z to carry food back to shelter from farther away.
**Tradeoffs / gaps:** Carrying slows your sprint.
**Current definition:** `{"role":"Press Z to carry food back to shelter from farther away.","name":"Grasping Limbs","short":"Graspers","branch":"utility","summary":"Press Z to carry food back to shelter from farther away.","tradeoff":"Carrying slows your sprint.","pressure":{"scarcity":5,"fewMates":2,"dryness":1},"visual":"hooked front feet","anatomicalExpression":{"axis":"forelimb","threshold":0.5},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":true,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":0.9},"countercost":"Carrying slows your sprint."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** hooked front feet; preserve actual anatomy/behavior ownership; Press Z to carry food back to shelter from farther away.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: adaptive-chromatophores

**Role / pros:** Stay hidden while moving and foraging cautiously through dense cover.
**Tradeoffs / gaps:** Sprinting or leaving cover exposes you.
**Current definition:** `{"role":"Stay hidden while moving and foraging cautiously through dense cover.","name":"Adaptive Chromatophores","short":"Color shift","branch":"stealth","tier":2,"requires":["camouflage-mantle"],"summary":"Stay hidden while moving and foraging cautiously through dense cover.","tradeoff":"Sprinting or leaving cover exposes you.","pressure":{"predation":6,"scarcity":1},"visual":"moving habitat-matched bands","anatomicalExpression":{"axis":"skin","threshold":0.8},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":true,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"Sprinting or leaving cover exposes you."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** moving habitat-matched bands; preserve actual anatomy/behavior ownership; Stay hidden while moving and foraging cautiously through dense cover.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: crushing-jaw

**Role / pros:** Bites can stagger Stalkers; healthy descendants patrol a wider home core.
**Tradeoffs / gaps:** The larger jaw costs more energy and water.
**Current definition:** `{"role":"Bites can stagger Stalkers; healthy descendants patrol a wider home core.","name":"Crushing Jaw","short":"Crushing jaw","branch":"offense","tier":2,"requires":["heavy-jaw"],"summary":"Bites can stagger Stalkers; healthy descendants patrol a wider home core.","tradeoff":"The larger jaw costs more energy and water.","pressure":{"predation":6,"scarcity":2},"visual":"massive paired jaw plates","anatomicalExpression":{"axis":"jaw","threshold":0.8},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1.07,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1.7,"strikeEnergy":1.18,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"The larger jaw costs more energy and water."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** massive paired jaw plates; preserve actual anatomy/behavior ownership; Bites can stagger Stalkers; healthy descendants patrol a wider home core.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: coordinated-defense

**Role / pros:** Rallied adults brace together and defend young across a wider family area.
**Tradeoffs / gaps:** A coordinated rally still risks several family members.
**Current definition:** `{"role":"Rallied adults brace together and defend young across a wider family area.","name":"Coordinated Defense","short":"Coordinated defense","branch":"social","tier":2,"requires":["mobbing-instinct"],"summary":"Rallied adults brace together and defend young across a wider family area.","tradeoff":"A coordinated rally still risks several family members.","pressure":{"predation":5,"fewMates":5},"visual":"paired rally crests","anatomicalExpression":{"axis":"rally","threshold":0.8},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":true,"grasping":false,"provisioning":false,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":1,"carrySprint":1},"countercost":"A coordinated rally still risks several family members."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** paired rally crests; preserve actual anatomy/behavior ownership; Rallied adults brace together and defend young across a wider family area.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: provisioning-pouches

**Role / pros:** Carry a double food load; stocked shelter supports longer family excursions.
**Tradeoffs / gaps:** A full load slows movement more heavily.
**Current definition:** `{"role":"Carry a double food load; stocked shelter supports longer family excursions.","name":"Provisioning Pouches","short":"Provisioning","branch":"utility","tier":2,"requires":["grasping-limbs"],"summary":"Carry a double food load; stocked shelter supports longer family excursions.","tradeoff":"A full load slows movement more heavily.","pressure":{"scarcity":6,"fewMates":3},"visual":"full ventral food pouches","anatomicalExpression":{"axis":"forelimb","threshold":0.8},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":true,"swim":false,"swimSpeed":0,"swimEnergy":1,"carryCapacity":2,"carrySprint":0.8},"countercost":"A full load slows movement more heavily."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** full ventral food pouches; preserve actual anatomy/behavior ownership; Carry a double food load; stocked shelter supports longer family excursions.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## expressed adaptation: webbed-limbs

**Role / pros:** Cross rivers and open water instead of stopping at the bank.
**Tradeoffs / gaps:** Swimming is slower than land travel and drains energy faster.
**Current definition:** `{"role":"Cross rivers and open water instead of stopping at the bank.","name":"Webbed Limbs","short":"Swimming","branch":"aquatic","tier":2,"requires":["water-sacs"],"summary":"Cross rivers and open water instead of stopping at the bank.","tradeoff":"Swimming is slower than land travel and drains energy faster.","pressure":{"wetness":9,"predation":1,"scarcity":1},"visual":"broad webbing between the outer toes","anatomicalExpression":{"axis":"waterBody","threshold":0.8},"numericEffects":{"predatorDamage":1,"sprintSpeed":1,"sprintEnergy":1,"waterUse":1,"foodGain":1,"healing":1,"metabolism":1,"playerStrike":1,"strikeEnergy":1,"bitterSlime":false,"alarmPulse":false,"camouflage":false,"adaptiveCamouflage":false,"mobbing":false,"coordinatedDefense":false,"grasping":false,"provisioning":false,"swim":true,"swimSpeed":0.66,"swimEnergy":1.48,"carryCapacity":1,"carrySprint":1},"countercost":"Swimming is slower than land travel and drains energy faster."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** broad webbing between the outer toes; preserve actual anatomy/behavior ownership; Cross rivers and open water instead of stopping at the bank.
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: armor

**Role / pros:** mantle plating
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"mantle plating","expressions":[{"adaptation":"hardened-mantle","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; mantle plating
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: barbs

**Role / pros:** limb barbs
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"limb barbs","expressions":[{"adaptation":"barbed-limbs","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; limb barbs
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: glands

**Role / pros:** mantle glands
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"mantle glands","expressions":[{"adaptation":"bitter-slime","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; mantle glands
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: spring

**Role / pros:** rear-leg tendons
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"rear-leg tendons","expressions":[{"adaptation":"spring-tendons","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; rear-leg tendons
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: waterBody

**Role / pros:** water-holding body
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"water-holding body","expressions":[{"adaptation":"water-sacs","threshold":0.5},{"adaptation":"webbed-limbs","threshold":0.8}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; water-holding body
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: gut

**Role / pros:** gut
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"gut","expressions":[{"adaptation":"efficient-gut","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; gut
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: repair

**Role / pros:** tissue repair
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"tissue repair","expressions":[{"adaptation":"fast-healing","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; tissue repair
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: signal

**Role / pros:** signal crest
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"signal crest","expressions":[{"adaptation":"alarm-pulse","threshold":0.5}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; signal crest
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: rally

**Role / pros:** rally crest
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"rally crest","expressions":[{"adaptation":"mobbing-instinct","threshold":0.5},{"adaptation":"coordinated-defense","threshold":0.8}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; rally crest
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: skin

**Role / pros:** skin pigment
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"skin pigment","expressions":[{"adaptation":"camouflage-mantle","threshold":0.5},{"adaptation":"adaptive-chromatophores","threshold":0.8}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; skin pigment
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: jaw

**Role / pros:** jaw
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"jaw","expressions":[{"adaptation":"heavy-jaw","threshold":0.5},{"adaptation":"crushing-jaw","threshold":0.8}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; jaw
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## continuous anatomy axis: forelimb

**Role / pros:** forelimbs
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"forelimbs","expressions":[{"adaptation":"grasping-limbs","threshold":0.5},{"adaptation":"provisioning-pouches","threshold":0.8}]}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; forelimbs
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## animal reproductive locus: gamete

**Role / pros:** Inherited gamete recognition independent of survival genes/builds
**Tradeoffs / gaps:** Inherited divergence or dysfunctional development can reduce fertility; anatomy and diet are independent.
**Current definition:** `{"role":"Inherited gamete recognition independent of survival genes/builds","domain":{"min":0.72,"max":1.28}}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited gamete recognition independent of survival genes/builds
**Authority:** [src/reproduction/reproductive-compatibility.js](../../src/reproduction/reproductive-compatibility.js)

## animal reproductive locus: development

**Role / pros:** Inherited embryo-development fertility
**Tradeoffs / gaps:** Inherited divergence or dysfunctional development can reduce fertility; anatomy and diet are independent.
**Current definition:** `{"role":"Inherited embryo-development fertility","domain":{"min":0.72,"max":1.28}}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited embryo-development fertility
**Authority:** [src/reproduction/reproductive-compatibility.js](../../src/reproduction/reproductive-compatibility.js)

## inherited preference axis: size

**Role / pros:** Individual chooser weighting of observable size; no universal desirable direction
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual chooser weighting of observable size; no universal desirable direction"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual chooser weighting of observable size; no universal desirable direction
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited preference axis: strength

**Role / pros:** Individual chooser weighting of observable strength; no universal desirable direction
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual chooser weighting of observable strength; no universal desirable direction"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual chooser weighting of observable strength; no universal desirable direction
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited preference axis: ornament

**Role / pros:** Individual chooser weighting of observable ornament; no universal desirable direction
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual chooser weighting of observable ornament; no universal desirable direction"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual chooser weighting of observable ornament; no universal desirable direction
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited preference axis: display

**Role / pros:** Individual chooser weighting of observable display; no universal desirable direction
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual chooser weighting of observable display; no universal desirable direction"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual chooser weighting of observable display; no universal desirable direction
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited preference axis: behavior

**Role / pros:** Individual chooser weighting of observable behavior; no universal desirable direction
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual chooser weighting of observable behavior; no universal desirable direction"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual chooser weighting of observable behavior; no universal desirable direction
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited ritual taste: dance

**Role / pros:** Individual response to actual funded dance displays
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual response to actual funded dance displays"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual response to actual funded dance displays
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited ritual taste: call

**Role / pros:** Individual response to actual funded call displays
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual response to actual funded call displays"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual response to actual funded call displays
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited ritual taste: flare

**Role / pros:** Individual response to actual funded flare displays
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual response to actual funded flare displays"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual response to actual funded flare displays
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited ritual taste: scent

**Role / pros:** Individual response to actual funded scent displays
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual response to actual funded scent displays"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual response to actual funded scent displays
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited ritual taste: gesture

**Role / pros:** Individual response to actual funded gesture displays
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual response to actual funded gesture displays"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual response to actual funded gesture displays
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited choice parameter: selectivity

**Role / pros:** Individual selectivity in reciprocal assessment
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual selectivity in reciprocal assessment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual selectivity in reciprocal assessment
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## inherited choice parameter: tempo

**Role / pros:** Individual tempo in reciprocal assessment
**Tradeoffs / gaps:** Narrow preferences can reduce acceptable encounters; no universal beauty bonus, forced acceptance or separate arbitrary penalty.
**Current definition:** `{"role":"Individual tempo in reciprocal assessment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Individual tempo in reciprocal assessment
**Authority:** [src/reproduction/mate-preferences.js](../../src/reproduction/mate-preferences.js)

## botanical growth/tissue trait: growth

**Role / pros:** Inherited plant growth; affects actual finite growth, consumption or seed investment
**Tradeoffs / gaps:** Finite growth/tissue allocation and handling are canonical; record actual resource investment before proposing a numeric advantage.
**Current definition:** `{"role":"Inherited plant growth; affects actual finite growth, consumption or seed investment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited plant growth; affects actual finite growth, consumption or seed investment
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical growth/tissue trait: waterNeed

**Role / pros:** Inherited plant waterNeed; affects actual finite growth, consumption or seed investment
**Tradeoffs / gaps:** Finite growth/tissue allocation and handling are canonical; record actual resource investment before proposing a numeric advantage.
**Current definition:** `{"role":"Inherited plant waterNeed; affects actual finite growth, consumption or seed investment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited plant waterNeed; affects actual finite growth, consumption or seed investment
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical growth/tissue trait: nutrition

**Role / pros:** Inherited plant nutrition; affects actual finite growth, consumption or seed investment
**Tradeoffs / gaps:** Finite growth/tissue allocation and handling are canonical; record actual resource investment before proposing a numeric advantage.
**Current definition:** `{"role":"Inherited plant nutrition; affects actual finite growth, consumption or seed investment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited plant nutrition; affects actual finite growth, consumption or seed investment
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical growth/tissue trait: seedAllocation

**Role / pros:** Inherited plant seedAllocation; affects actual finite growth, consumption or seed investment
**Tradeoffs / gaps:** Finite growth/tissue allocation and handling are canonical; record actual resource investment before proposing a numeric advantage.
**Current definition:** `{"role":"Inherited plant seedAllocation; affects actual finite growth, consumption or seed investment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited plant seedAllocation; affects actual finite growth, consumption or seed investment
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical growth/tissue trait: coatAllocation

**Role / pros:** Inherited plant coatAllocation; affects actual finite growth, consumption or seed investment
**Tradeoffs / gaps:** Finite growth/tissue allocation and handling are canonical; record actual resource investment before proposing a numeric advantage.
**Current definition:** `{"role":"Inherited plant coatAllocation; affects actual finite growth, consumption or seed investment"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Inherited plant coatAllocation; affects actual finite growth, consumption or seed investment
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: cue

**Role / pros:** Dedicated inherited cue stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited cue stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited cue stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: receptor

**Role / pros:** Dedicated inherited receptor stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited receptor stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited receptor stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: selfMarker

**Role / pros:** Dedicated inherited selfMarker stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited selfMarker stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited selfMarker stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: selfCompatible

**Role / pros:** Dedicated inherited selfCompatible stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited selfCompatible stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited selfCompatible stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: anther

**Role / pros:** Dedicated inherited anther stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited anther stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited anther stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: stigma

**Role / pros:** Dedicated inherited stigma stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited stigma stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited stigma stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: ovule

**Role / pros:** Dedicated inherited ovule stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited ovule stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited ovule stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## botanical reproductive locus: embryo

**Role / pros:** Dedicated inherited embryo stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Tradeoffs / gaps:** Recognition/structure/development can fail naturally; no species-distance gate or universal selfing penalty.
**Current definition:** `{"role":"Dedicated inherited embryo stage; delivery, recognition, fertilization, seed viability and germination remain separate"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Dedicated inherited embryo stage; delivery, recognition, fertilization, seed viability and germination remain separate
**Authority:** [src/ecology/botanical-genetics.js](../../src/ecology/botanical-genetics.js)

## proto trait: frugal-frame

**Role / pros:** A slightly thriftier body shaped by generations of thin forage.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A slightly thriftier body shaped by generations of thin forage.","id":"frugal-frame","label":"Frugal Frame","short":"Frugal","pressure":"scarcity","summary":"A slightly thriftier body shaped by generations of thin forage.","cause":"sustained food scarcity","mechanic":"resting energy use falls modestly"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; resting energy use falls modestly
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: range-sense

**Role / pros:** A slightly more searching sensory profile shaped by crowded feeding grounds.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A slightly more searching sensory profile shaped by crowded feeding grounds.","id":"range-sense","label":"Range Sense","short":"Range sense","pressure":"competition","summary":"A slightly more searching sensory profile shaped by crowded feeding grounds.","cause":"sustained resource competition","mechanic":"food search reaches a little farther"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; food search reaches a little farther
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: watch-crest

**Role / pros:** A more vigilant sensory crest shaped by persistent predator pressure.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A more vigilant sensory crest shaped by persistent predator pressure.","id":"watch-crest","label":"Watch Crest","short":"Watch crest","pressure":"predation","summary":"A more vigilant sensory crest shaped by persistent predator pressure.","cause":"sustained predator pressure","mechanic":"nearby threats are noticed a little farther away"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; nearby threats are noticed a little farther away
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: close-brood

**Role / pros:** A compact social build shaped by dense family living.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A compact social build shaped by dense family living.","id":"close-brood","label":"Close-Brood Frame","short":"Close brood","pressure":"crowding","summary":"A compact social build shaped by dense family living.","cause":"sustained crowding","mechanic":"family shelter gives slightly better protection"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; family shelter gives slightly better protection
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: dryland-skin

**Role / pros:** A drier, tighter mantle shaped by repeated life away from reliable moisture.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A drier, tighter mantle shaped by repeated life away from reliable moisture.","id":"dryland-skin","label":"Dryland Skin","short":"Dryland","pressure":"dryness","summary":"A drier, tighter mantle shaped by repeated life away from reliable moisture.","cause":"sustained dry-ground pressure","mechanic":"daily water loss falls modestly"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; daily water loss falls modestly
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: splayfoot

**Role / pros:** Broader footing shaped by generations living on saturated ground.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"Broader footing shaped by generations living on saturated ground.","id":"splayfoot","label":"Splayfoot","short":"Splayfoot","pressure":"wetness","summary":"Broader footing shaped by generations living on saturated ground.","cause":"sustained wet-ground pressure","mechanic":"movement over wet ground becomes a little easier"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; movement over wet ground becomes a little easier
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: heat-shed-mantle

**Role / pros:** A slightly leaner mantle shaped by persistent heat.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A slightly leaner mantle shaped by persistent heat.","id":"heat-shed-mantle","label":"Heat-Shed Mantle","short":"Heat shed","pressure":"heat","summary":"A slightly leaner mantle shaped by persistent heat.","cause":"sustained heat pressure","mechanic":"heat strain is reduced modestly"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; heat strain is reduced modestly
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## proto trait: cold-mantle

**Role / pros:** A fuller mantle shaped by persistent cold.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A fuller mantle shaped by persistent cold.","id":"cold-mantle","label":"Cold Mantle","short":"Cold mantle","pressure":"cold","summary":"A fuller mantle shaped by persistent cold.","cause":"sustained cold pressure","mechanic":"cold strain is reduced modestly"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; cold strain is reduced modestly
**Authority:** [src/lineage/proto-speciation.js](../../src/lineage/proto-speciation.js)

## taxon lifestyle: aquatic

**Role / pros:** This taxon is becoming a water-crossing, wet-habitat lineage.
**Tradeoffs / gaps:** Its body is less efficient during long dry-land travel.
**Current definition:** `{"role":"This taxon is becoming a water-crossing, wet-habitat lineage.","id":"aquatic","label":"Aquatic","short":"AQUATIC","summary":"This taxon is becoming a water-crossing, wet-habitat lineage.","opportunity":"Rivers and wet margins become normal travel space instead of barriers.","tradeoff":"Its body is less efficient during long dry-land travel."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Rivers and wet margins become normal travel space instead of barriers.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## taxon lifestyle: nomadic

**Role / pros:** This taxon is becoming a wide-ranging lineage that does not depend on one center.
**Tradeoffs / gaps:** Constant travel costs a little more energy.
**Current definition:** `{"role":"This taxon is becoming a wide-ranging lineage that does not depend on one center.","id":"nomadic","label":"Nomadic","short":"NOMADIC","summary":"This taxon is becoming a wide-ranging lineage that does not depend on one center.","opportunity":"Adults travel and search farther, making distant resources and new ranges easier to exploit.","tradeoff":"Constant travel costs a little more energy."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Adults travel and search farther, making distant resources and new ranges easier to exploit.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## taxon lifestyle: guardian

**Role / pros:** This taxon is becoming a defensive lineage built around holding kin and shelter together.
**Tradeoffs / gaps:** The defensive build gives no extra advantage while roaming alone.
**Current definition:** `{"role":"This taxon is becoming a defensive lineage built around holding kin and shelter together.","id":"guardian","label":"Guardian","short":"GUARDIAN","summary":"This taxon is becoming a defensive lineage built around holding kin and shelter together.","opportunity":"Threats are noticed sooner and sheltered relatives resist attacks more effectively.","tradeoff":"The defensive build gives no extra advantage while roaming alone."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Threats are noticed sooner and sheltered relatives resist attacks more effectively.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## taxon lifestyle: burrower

**Role / pros:** This taxon is becoming a den-focused lineage that invests heavily in protected homes.
**Tradeoffs / gaps:** Compact denning bodies move slightly slower in the open.
**Current definition:** `{"role":"This taxon is becoming a den-focused lineage that invests heavily in protected homes.","id":"burrower","label":"Burrower","short":"BURROWER","summary":"This taxon is becoming a den-focused lineage that invests heavily in protected homes.","opportunity":"Taxon nests use less material and give stronger thermal and physical protection.","tradeoff":"Compact denning bodies move slightly slower in the open."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Taxon nests use less material and give stronger thermal and physical protection.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## taxon lifestyle: hunter

**Role / pros:** This taxon is becoming an active hunting lineage that treats live prey as ordinary food.
**Tradeoffs / gaps:** Plant food is less efficient for a body increasingly committed to animal prey.
**Current definition:** `{"role":"This taxon is becoming an active hunting lineage that treats live prey as ordinary food.","id":"hunter","label":"Hunter","short":"HUNTER","summary":"This taxon is becoming an active hunting lineage that treats live prey as ordinary food.","opportunity":"Hungry adults actively pursue edible wildlife, and prey now recognize the branch as a real predator.","tradeoff":"Plant food is less efficient for a body increasingly committed to animal prey."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Hungry adults actively pursue edible wildlife, and prey now recognize the branch as a real predator.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## taxon lifestyle: grazer

**Role / pros:** This taxon is becoming a plant-focused lineage built around sustained feeding grounds.
**Tradeoffs / gaps:** Carrion and live prey provide less value as the digestive system specializes toward plants.
**Current definition:** `{"role":"This taxon is becoming a plant-focused lineage built around sustained feeding grounds.","id":"grazer","label":"Grazer","short":"GRAZER","summary":"This taxon is becoming a plant-focused lineage built around sustained feeding grounds.","opportunity":"Adults begin grazing before deep hunger and extract more energy from plant food.","tradeoff":"Carrion and live prey provide less value as the digestive system specializes toward plants."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Adults begin grazing before deep hunger and extract more energy from plant food.
**Authority:** [src/lineage/species-lifestyle.js](../../src/lineage/species-lifestyle.js)

## lineage form: forager

**Role / pros:** A leaner, longer-limbed descendant built to range farther and find food at distance.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A leaner, longer-limbed descendant built to range farther and find food at distance.","id":"forager","label":"Forager form","short":"Forager","summary":"A leaner, longer-limbed descendant built to range farther and find food at distance.","cause":"Sustained forage, scouting, and wide family ranging shaped this descendant.","opportunity":"Faster travel and wider food sensing make distant resource patches more practical."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Faster travel and wider food sensing make distant resource patches more practical.
**Authority:** [src/lineage/divergence.js](../../src/lineage/divergence.js)

## lineage form: colony

**Role / pros:** A compact, shelter-oriented descendant built around food sharing and group protection.
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"A compact, shelter-oriented descendant built around food sharing and group protection.","id":"colony","label":"Colony form","short":"Colony","summary":"A compact, shelter-oriented descendant built around food sharing and group protection.","cause":"Sustained regrouping, shelter use, nesting, and close family living shaped this descendant.","opportunity":"Shelter stores become more efficient and family cover is safer near home."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** multi-generation evidence
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Shelter stores become more efficient and family cover is safer near home.
**Authority:** [src/lineage/divergence.js](../../src/lineage/divergence.js)

## learned family tendency: forager

**Role / pros:** Adults range farther, search wider, and spend more time feeding away from the family core.
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"Adults range farther, search wider, and spend more time feeding away from the family core.","id":"forager","label":"Independent foragers","short":"Independent","summary":"Adults range farther, search wider, and spend more time feeding away from the family core."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Adults range farther, search wider, and spend more time feeding away from the family core.
**Authority:** [src/lineage/behavioral-tendency.js](../../src/lineage/behavioral-tendency.js)

## learned family tendency: colony

**Role / pros:** Adults stay closer to shelters and one another, regrouping around established family homes.
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"Adults stay closer to shelters and one another, regrouping around established family homes.","id":"colony","label":"Colony cohesion","short":"Colony","summary":"Adults stay closer to shelters and one another, regrouping around established family homes."}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Adults stay closer to shelters and one another, regrouping around established family homes.
**Authority:** [src/lineage/behavioral-tendency.js](../../src/lineage/behavioral-tendency.js)

## learned habit: range

**Role / pros:** ranges far to feed; observed/caregiver learning, not genetic inheritance
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"ranges far to feed; observed/caregiver learning, not genetic inheritance"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; ranges far to feed; observed/caregiver learning, not genetic inheritance
**Authority:** [src/cognition/habits.js](../../src/cognition/habits.js)

## learned habit: home

**Role / pros:** stays near home; observed/caregiver learning, not genetic inheritance
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"stays near home; observed/caregiver learning, not genetic inheritance"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; stays near home; observed/caregiver learning, not genetic inheritance
**Authority:** [src/cognition/habits.js](../../src/cognition/habits.js)

## learned habit: caution

**Role / pros:** wary of Stalkers; observed/caregiver learning, not genetic inheritance
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"wary of Stalkers; observed/caregiver learning, not genetic inheritance"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; wary of Stalkers; observed/caregiver learning, not genetic inheritance
**Authority:** [src/cognition/habits.js](../../src/cognition/habits.js)

## learned habit: boldness

**Role / pros:** stands its ground; observed/caregiver learning, not genetic inheritance
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"stands its ground; observed/caregiver learning, not genetic inheritance"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; stands its ground; observed/caregiver learning, not genetic inheritance
**Authority:** [src/cognition/habits.js](../../src/cognition/habits.js)

## learned habit: hunting

**Role / pros:** hunts small prey; observed/caregiver learning, not genetic inheritance
**Tradeoffs / gaps:** Opportunity, observation, care and actual practiced behavior constrain learning; this is not a purchased genetic upgrade.
**Current definition:** `{"role":"hunts small prey; observed/caregiver learning, not genetic inheritance"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** individual experience
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; hunts small prey; observed/caregiver learning, not genetic inheritance
**Authority:** [src/cognition/habits.js](../../src/cognition/habits.js)

## threshold body ability: pounce

**Role / pros:** Existing pounce capability expressed by an anatomy threshold
**Tradeoffs / gaps:** No independent countercost asserted; evaluate current stacking, ecological context and actual authority before changing values.
**Current definition:** `{"role":"Existing pounce capability expressed by an anatomy threshold","name":"Pounce","axis":"spring","threshold":0.8,"requires":"spring-tendons","pressure":{"predation":4,"scarcity":2,"dryness":1}}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing pounce capability expressed by an anatomy threshold
**Authority:** [src/lineage/evolution.js](../../src/lineage/evolution.js)

## founding physiological context: speed

**Role / pros:** Existing speed defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing speed defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":2.35,"rootling":1.7,"needlejaw":2.8,"rillsifter":1.9,"mirelick":1.82,"podshell":1.63,"bankjaw":2.23,"genvo":2.15},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing speed defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: mass

**Role / pros:** Existing mass defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing mass defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":0.8,"rootling":1.3,"needlejaw":2.1,"rillsifter":0.68,"mirelick":0.91,"podshell":1.42,"bankjaw":1.36,"genvo":1.45},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing mass defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: predationVulnerability

**Role / pros:** Existing predationVulnerability defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing predationVulnerability defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":1,"rootling":0.58,"needlejaw":1,"rillsifter":1.1,"mirelick":0.9,"podshell":0.78,"bankjaw":0.95,"genvo":0.82},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing predationVulnerability defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: diseaseSusceptibility

**Role / pros:** Existing diseaseSusceptibility defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing diseaseSusceptibility defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":1.08,"rootling":0.88,"needlejaw":0.78,"rillsifter":1.1,"mirelick":0.75,"podshell":0.92,"bankjaw":1.05,"genvo":1},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing diseaseSusceptibility defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: maxEnergy

**Role / pros:** Existing maxEnergy defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing maxEnergy defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":88,"rootling":112,"needlejaw":142,"rillsifter":86,"mirelick":97,"podshell":114,"bankjaw":119,"genvo":124},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing maxEnergy defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: maxHydration

**Role / pros:** Existing maxHydration defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing maxHydration defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":92,"rootling":106,"needlejaw":118,"rillsifter":94,"mirelick":97,"podshell":98,"bankjaw":116,"genvo":114},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing maxHydration defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: maturity

**Role / pros:** Existing maturity defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing maturity defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":20,"rootling":28,"needlejaw":38,"rillsifter":23,"mirelick":25,"podshell":29,"bankjaw":34,"genvo":30},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing maturity defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: lifespan

**Role / pros:** Existing lifespan defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing lifespan defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":170,"rootling":250,"needlejaw":380,"rillsifter":188,"mirelick":210,"podshell":258,"bankjaw":310,"genvo":290},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing lifespan defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: litter

**Role / pros:** Existing litter defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing litter defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":[1,2],"rootling":[1,2],"needlejaw":[1,1],"rillsifter":[1,2],"mirelick":[1,2],"podshell":[1,2],"bankjaw":[1,1],"genvo":[1,2]},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing litter defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: gestation

**Role / pros:** Existing gestation defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing gestation defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":12,"rootling":16,"needlejaw":22,"rillsifter":13,"mirelick":15,"podshell":17,"bankjaw":20,"genvo":16},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing gestation defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: reproCost

**Role / pros:** Existing reproCost defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing reproCost defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":32,"rootling":34,"needlejaw":40,"rillsifter":30,"mirelick":32,"podshell":35,"bankjaw":39,"genvo":34},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing reproCost defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: postpartum

**Role / pros:** Existing postpartum defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing postpartum defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":120,"rootling":80,"needlejaw":96,"rillsifter":96,"mirelick":94,"podshell":95,"bankjaw":108,"genvo":80},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing postpartum defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: baseMetabolism

**Role / pros:** Existing baseMetabolism defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing baseMetabolism defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":0.045,"rootling":0.052,"needlejaw":0.045,"rillsifter":0.039,"mirelick":0.043,"podshell":0.05,"bankjaw":0.047,"genvo":0.052},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing baseMetabolism defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: waterUse

**Role / pros:** Existing waterUse defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing waterUse defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":0.045,"rootling":0.042,"needlejaw":0.044,"rillsifter":0.042,"mirelick":0.045,"podshell":0.047,"bankjaw":0.047,"genvo":0.044},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing waterUse defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: social

**Role / pros:** Existing social defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing social defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":{"mode":"herd","label":"Herd","joinRadius":8,"cohesionRadius":4.8,"separation":0.58,"alarmRadius":7,"maxGroup":8},"rootling":{"mode":"colony","label":"Colony","joinRadius":7,"cohesionRadius":4.3,"separation":0.54,"alarmRadius":5.8,"maxGroup":6},"needlejaw":{"mode":"solitary","label":"Solitary"},"rillsifter":{"mode":"shoal","label":"Shoal","joinRadius":5,"cohesionRadius":3.6,"separation":0.48,"alarmRadius":5,"maxGroup":9},"mirelick":{"mode":"loose","label":"Scavengers","joinRadius":6,"cohesionRadius":4,"separation":0.6,"alarmRadius":5,"maxGroup":5},"podshell":{"mode":"herd","label":"Foraging groups","joinRadius":7,"cohesionRadius":4.4,"separation":0.58,"alarmRadius":7,"maxGroup":7},"bankjaw":{"mode":"solitary","label":"Lone hunter"},"genvo":{"mode":"band","label":"Band","joinRadius":8,"cohesionRadius":4.8,"separation":0.62,"alarmRadius":6.6,"maxGroup":8,"kinBias":1.7}},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing social defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: density

**Role / pros:** Existing density defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing density defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":{"radius":7,"softCap":7},"rootling":{"radius":7,"softCap":6},"needlejaw":{"radius":14,"softCap":3},"rillsifter":{"radius":6,"softCap":8},"mirelick":{"radius":8,"softCap":5},"podshell":{"radius":9,"softCap":6},"bankjaw":{"radius":13,"softCap":3},"genvo":{"radius":8,"softCap":6}},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing density defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: reproduction

**Role / pros:** Existing reproduction defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing reproduction defaults; context retained by physiology, not independent inherited loci","values":{"mosskip":{"energy":0.72,"driveScale":1,"minForage":5.4,"optimalForage":9.4},"rootling":{"energy":0.72,"driveScale":0.95,"minForage":5.8,"optimalForage":10.6},"needlejaw":{"energy":0.72,"driveScale":0.46,"preyRadius":14,"minPrey":8},"rillsifter":{"energy":0.7,"driveScale":1,"minForage":4,"optimalForage":8},"mirelick":{"energy":0.74,"driveScale":0.88,"minForage":5,"optimalForage":9},"podshell":{"energy":0.75,"driveScale":0.88,"minForage":5,"optimalForage":9},"bankjaw":{"energy":0.74,"driveScale":0.55,"preyRadius":12,"minPrey":6},"genvo":{"energy":0.72,"driveScale":0.9,"minForage":5.5,"optimalForage":9.6}},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing reproduction defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

## founding physiological context: familyCare

**Role / pros:** Existing familyCare defaults; context retained by physiology, not independent inherited loci
**Tradeoffs / gaps:** These defaults can still encode ancestry-dependent physiology; replacement requires a coherent unit/inheritance model and creator calibration review.
**Current definition:** `{"role":"Existing familyCare defaults; context retained by physiology, not independent inherited loci","values":{"genvo":{"lineageOnly":true,"dependentUntil":0.62,"followDistance":2.1,"nurseRadius":1.6,"nurseRate":0.065,"nurseEfficiency":1.4,"nurseTarget":0.8,"parentReserve":0.5,"guardThreatRadius":5}},"status":"Current catalog context, not a species-name permission gate or new genetic trait"}`
**Cost / rarity:** Not independently purchasable unless its canonical anatomy/draft authority says so; Existing inheritance/observation rules; no proposed probability implemented
**Proposed progression context:** inherited variation
**Art / observable behavior:** Render through the actual expressed body/behavior; biological identity remains distinct from colors or labels; Existing familyCare defaults; context retained by physiology, not independent inherited loci
**Authority:** [src/organisms/species.js](../../src/organisms/species.js)

