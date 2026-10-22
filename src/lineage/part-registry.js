// Evolution Expansion (GDD v1, sections 6.1 to 6.4, backlog EV-002): PartRegistry v0.
// Declarative, immutable part definitions and socket rules for the 18-part starter slice.
// Parts never run code: they name finite capabilities that their owning systems handle.
//
// Phase A contract: parts carry no numeric effects yet (effectContributions is empty) and the
// existing authorities (anatomy, adaptations, effects pipeline, exertion, combat, water rules)
// remain the only source of numbers, so nothing can be counted twice. `legacy` records which
// v1.33.7 anatomy axis and threshold each part stands for, for the read adapter (EV-004).

export const REGISTRY_VERSION=0;

// Socket types (locked for v0). A socket accepts parts whose compatibleSocketTypes include it.
export const SOCKET_TYPES=Object.freeze(['limb','head','mouth','eye','dorsal','flank','tail','spur']);

// Capability names (locked for v0). Owning systems decide what each one does.
export const CAPABILITIES=Object.freeze([
  'walk','sprint','pounce','carry','dig','graze','bite','tear','crush','see','see-wide',
  'armor','retaliate','strike','venom','store','signal','swim-propel','insulate','climb','fly','glide','jump','thermoregulate','lactate',
  // Wave 1 (creator decision 2026-10-09): eight bodies, legs, mouths and eyes.
  'run','brace','swim','quiet','peck','filter','suck','swallow','nibble','aim','spot','glance','track','display','call','dance','flare','scent','gesture','lay-eggs','live-birth'
]);

export const FAMILIES=Object.freeze(['core','limbs','feeding','senses','defense','offense','metabolism','social','locomotion']);

// The eight radial limb sockets of the GenVo8 torso, in DIR8 order (0 = front, clockwise).
const RADIAL=['front','front-right','right','rear-right','rear','rear-left','left','front-left'];
// Wave 1: bigger bodies add limb sockets between the radial ones. limb.(8+i) sits between limb.i
// and limb.(i+1); 'slot' is the angle in sixteenths of a turn (0 = front, clockwise).
export function limbSlot(socket){const m=/^limb\.(\d+)$/.exec(socket||'');if(!m)return null;const n=Number(m[1]);return n<8?n*2:(n-8)*2+1}
const torsoSockets=({limbs=[0,1,2,3,4,5,6,7],flank=2,dorsal=1,eyes=2,layout=null}={})=>withLayout(layout,[
  ...limbs.map(i=>({id:`limb.${i}`,type:'limb',max:1,position:i<8?RADIAL[i]:`between-${RADIAL[i-8]}`,direction:i<8?i:null,slot:i<8?i*2:(i-8)*2+1})),
  {id:'head',type:'head',max:1,position:'front',direction:0,at:Object.freeze({f:.88,s:0,u:0})},
  {id:'mouth',type:'mouth',max:1,position:'front',direction:0},
  {id:'eye.left',type:'eye',max:1,position:'front-left',direction:7},
  {id:'eye.right',type:'eye',max:1,position:'front-right',direction:1},
  ...(eyes>2?[{id:'eye.left.2',type:'eye',max:1,position:'head-left',direction:7},{id:'eye.right.2',type:'eye',max:1,position:'head-right',direction:1}]:[]),
  {id:'dorsal',type:'dorsal',max:dorsal,position:'top',direction:null},
  {id:'flank.left',type:'flank',max:flank,position:'left',direction:6},
  {id:'flank.right',type:'flank',max:flank,position:'right',direction:2},
  {id:'tail',type:'tail',max:1,position:'rear',direction:4}
]);
// v1.54.0 (creator rule 2026-10-10): the body owns where its parts attach. An authored body gives
// each socket an 'at' place: f along the facing (1 = front edge), s across it (1 = right edge), u
// height above the middle (1 = top of the back). Parts own their art and animation; the renderer
// and editor place them here (render/socket-layout.js). Sockets are fixed per body.
function withLayout(layout,sockets){return layout?sockets.map(s=>layout[s.id]?{...s,at:Object.freeze({...layout[s.id]})}:s):sockets}
// The round founder body: hips low on the four diagonals, face on the head in front, one back and two side places.
export const ROUND_LAYOUT=Object.freeze({'limb.1':{f:.5,s:.8,u:-.2},'limb.7':{f:.5,s:-.8,u:-.2},'limb.3':{f:-.5,s:.8,u:-.2},'limb.5':{f:-.5,s:-.8,u:-.2},head:{f:.88,s:0,u:0},mouth:{f:1.36,s:0,u:0},'eye.left':{f:1.08,s:-.6,u:0},'eye.right':{f:1.08,s:.6,u:0},dorsal:{f:-.25,s:0,u:.92},'flank.left':{f:-.05,s:-.96,u:0},'flank.right':{f:-.05,s:.96,u:0},tail:{f:-1.04,s:0,u:0}});
// Body shapes (length along the facing, width across it) and how many parts each body can carry.
export const BODY_SHAPES=Object.freeze({
  'small-torso':{length:.8,width:.8,size:.8},
  'soft-torso':{length:1,width:1,size:1},
  'reinforced-torso':{length:1,width:1.05,size:1.02},
  'sleek-torso':{length:1.22,width:.74,size:.96},
  'light-torso':{length:.96,width:.72,size:.88},
  'stout-torso':{length:.94,width:1.28,size:1.06},
  'barrel-torso':{length:1.12,width:1.22,size:1.14},
  'dome-torso':{length:1.02,width:1.12,size:1.08},
  'long-torso':{length:1.5,width:.86,size:1.08}
});
const legSockets=()=>[{id:'spur',type:'spur',max:1,position:'knee',direction:null}];

// One definition with every GDD 6.1 field. Numbers are proposed design values, not balance.
function part(id,family,{tags=[],prereq=[],sockets=[],provides=[],joints=[],mass=1,upkeep=0,cost=1,actions=[],niche=[],symmetry='paired',legacy=null,dims={w:2,h:2},orientation='follows-socket',inherit='parental-blend',anim='static'}={}){
  return Object.freeze({
    id,family,assetId:`genvo/${id}`,partVersion:1,tags:Object.freeze(tags),
    developmentalPrerequisites:Object.freeze(prereq),compatibleSocketTypes:Object.freeze(sockets),
    providedSockets:Object.freeze(provides.map(s=>Object.freeze({...s,...(s.at?{at:Object.freeze({...s.at})}:{})}))),jointChain:Object.freeze(joints),
    mountingBounds:Object.freeze({minSockets:sockets.length?1:0}),orientationRules:orientation,symmetryRules:symmetry,
    dimensions:Object.freeze(dims),mass,upkeep,mutationCost:cost,
    effectContributions:Object.freeze({}),actionCapabilities:Object.freeze(actions),
    animationProfile:anim,inheritanceProfile:inherit,ecologicalNicheTags:Object.freeze(niche),
    legacy:legacy?Object.freeze(legacy):null
  });
}

export const PARTS=Object.freeze(Object.fromEntries([
  // Neutral structural base: inherits and owns facial sockets, but grants no ability.
  part('head-base','core',{tags:['head','starter'],sockets:['head'],provides:[
    {id:'mouth',type:'mouth',max:1,at:{f:.95,s:0,u:0}},
    {id:'eye.left',type:'eye',max:1,at:{f:.28,s:-.82,u:.12}},
    {id:'eye.right',type:'eye',max:1,at:{f:.28,s:.82,u:.12}},
    {id:'eye.left.2',type:'eye',max:1,at:{f:-.5,s:-.86,u:0}},
    {id:'eye.right.2',type:'eye',max:1,at:{f:-.5,s:.86,u:0}}
  ],mass:0,upkeep:0,cost:0,symmetry:'single',dims:{w:3,h:3},anim:'breathing'}),
  // New creature vision (2026-10-09): every GenVo8 starts with the small torso: four diagonal leg
  // slots, a mouth, two eyes and one flank part a side. The soft torso is a mid-developed body.
  part('small-torso','core',{tags:['root','torso','small','starter'],provides:torsoSockets({limbs:[1,3,5,7],flank:1,layout:ROUND_LAYOUT}),mass:3,upkeep:.85,cost:0,symmetry:'single',dims:{w:6,h:5},anim:'breathing'}),
  part('soft-torso','core',{tags:['root','torso'],prereq:['small-torso'],provides:torsoSockets(),mass:4,upkeep:1,cost:2,symmetry:'single',dims:{w:8,h:7},anim:'breathing'}),
  part('reinforced-torso','core',{tags:['root','torso','tough'],prereq:['soft-torso'],provides:torsoSockets(),mass:5,upkeep:1.3,cost:4,symmetry:'single',dims:{w:8,h:7},anim:'breathing'}),
  // Wave 1 bodies: shape and slot count differ; bigger bodies carry more parts and cost more.
  part('sleek-torso','core',{tags:['root','torso','fast'],prereq:['soft-torso'],provides:torsoSockets({flank:1}),mass:3.5,upkeep:1.05,cost:3,actions:['run'],symmetry:'single',dims:{w:10,h:5},anim:'breathing'}),
  part('light-torso','core',{tags:['root','torso','small'],prereq:['small-torso'],provides:torsoSockets({limbs:[1,2,3,5,6,7],flank:1}),mass:2.6,upkeep:.8,cost:2,symmetry:'single',dims:{w:6,h:5},anim:'breathing'}),
  part('stout-torso','core',{tags:['root','torso','store'],prereq:['soft-torso'],provides:torsoSockets({flank:3}),mass:5,upkeep:1.1,cost:3,actions:['store'],symmetry:'single',dims:{w:8,h:9},anim:'breathing'}),
  part('barrel-torso','core',{tags:['root','torso','store','large'],prereq:['stout-torso'],provides:torsoSockets({limbs:[0,1,2,3,4,5,6,7,10,13],flank:2,dorsal:2,eyes:4}),mass:6,upkeep:1.25,cost:5,actions:['store'],symmetry:'single',dims:{w:9,h:9},anim:'breathing'}),
  part('dome-torso','core',{tags:['root','torso','tough','shell'],prereq:['reinforced-torso'],provides:torsoSockets({dorsal:2}),mass:6,upkeep:1.3,cost:6,actions:['armor'],symmetry:'single',dims:{w:9,h:8},anim:'breathing'}),
  part('long-torso','core',{tags:['root','torso','large','segmented'],prereq:['sleek-torso'],provides:torsoSockets({limbs:[0,1,2,3,4,5,6,7,9,10,13,14],flank:3,dorsal:2,eyes:4}),mass:6,upkeep:1.35,cost:6,symmetry:'single',dims:{w:12,h:6},anim:'breathing'}),
  part('walking-leg','limbs',{tags:['leg','land'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','foot'],mass:.4,upkeep:.1,cost:1,actions:['walk','sprint','dance'],niche:['ground'],anim:'gait'}),
  part('spring-leg','limbs',{tags:['leg','land','burst'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','tendon','foot'],mass:.5,upkeep:.18,cost:2,actions:['walk','sprint','pounce','dance','jump'],niche:['ambush','escape'],anim:'gait',legacy:{axis:'spring',threshold:.5,adaptation:'spring-tendons',action:{pounce:.8}}}),
  part('grasper','limbs',{tags:['leg','manipulate'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','hook'],mass:.45,upkeep:.14,cost:2,actions:['walk','carry','dance','gesture'],niche:['provisioning'],anim:'gait',legacy:{axis:'forelimb',threshold:.5,adaptation:'grasping-limbs'}}),
  part('runner-leg','limbs',{tags:['leg','land','fast'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','foot'],mass:.35,upkeep:.12,cost:2,actions:['walk','sprint','run','dance'],niche:['open-ground'],anim:'gait'}),
  part('sturdy-leg','limbs',{tags:['leg','land','brace'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','foot'],mass:.6,upkeep:.14,cost:2,actions:['walk','brace','dance'],niche:['predator-pressure'],anim:'gait'}),
  part('webbed-leg','limbs',{tags:['leg','land','water'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','web'],mass:.45,upkeep:.14,cost:2,actions:['walk','swim','dance'],niche:['wet-margin'],anim:'gait',legacy:{axis:'waterBody',threshold:.8,adaptation:'webbed-limbs'}}),
  part('padded-leg','limbs',{tags:['leg','land','quiet'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','pad'],mass:.4,upkeep:.12,cost:2,actions:['walk','quiet','dance'],niche:['stealth'],anim:'gait'}),
  // E6 dryland route: paired pads earn purchase on real dry ground, not a universal sprint buff.
  part('arid-pad','limbs',{tags:['leg','land','dryland'],prereq:['padded-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','wide-pad','foot'],mass:.46,upkeep:.16,cost:3,actions:['walk','run','dance'],niche:['dry-ground','scarcity'],anim:'gait'}),
  // E3: two true grasper descendants can get purchase on inclined ground.
  part('climber-leg','limbs',{tags:['leg','land','grip','climb'],prereq:['grasper'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','curved-claw','foot'],mass:.58,upkeep:.22,cost:4,actions:['walk','climb','carry','dance'],niche:['slopes','woodland'],anim:'gait'}),
  part('digging-forelimb','limbs',{tags:['leg','soil'],prereq:['walking-leg'],sockets:['limb'],provides:legSockets(),joints:['hip','knee','spade'],mass:.5,upkeep:.15,cost:2,actions:['walk','dig','dance'],niche:['burrow','roots'],anim:'gait'}),
  part('grazing-mouth','feeding',{tags:['mouth','plant'],sockets:['mouth'],mass:.3,upkeep:.05,cost:1,actions:['graze','bite','call'],niche:['plants'],symmetry:'single'}),
  part('tearing-jaw','feeding',{tags:['mouth','flesh'],prereq:['grazing-mouth'],sockets:['mouth'],mass:.5,upkeep:.2,cost:2,actions:['graze','bite','tear','call'],niche:['carcass','prey'],symmetry:'single',legacy:{axis:'jaw',threshold:.5,adaptation:'heavy-jaw'}}),
  part('crushing-jaw','feeding',{tags:['mouth','hard-food'],prereq:['tearing-jaw'],sockets:['mouth'],mass:.7,upkeep:.3,cost:3,actions:['graze','bite','tear','crush','call'],niche:['hard-food','prey'],symmetry:'single',legacy:{axis:'jaw',threshold:.8,adaptation:'crushing-jaw'}}),
  part('beak-mouth','feeding',{tags:['mouth','seed'],prereq:['grazing-mouth'],sockets:['mouth'],mass:.3,upkeep:.06,cost:2,actions:['graze','bite','peck','call'],niche:['seeds'],symmetry:'single'}),
  part('kernel-beak','feeding',{tags:['mouth','seed','hard-food'],prereq:['beak-mouth'],sockets:['mouth'],mass:.46,upkeep:.12,cost:3,actions:['graze','peck','crush','bite','call'],niche:['dry-ground','seeds'],symmetry:'single',anim:'feeding'}),
  part('filter-mouth','feeding',{tags:['mouth','water'],prereq:['grazing-mouth'],sockets:['mouth'],mass:.3,upkeep:.06,cost:2,actions:['graze','filter','call'],niche:['wet-margin'],symmetry:'single'}),
  part('reed-sieve-mouth','feeding',{tags:['mouth','water','sieve'],prereq:['filter-mouth'],sockets:['mouth'],mass:.35,upkeep:.09,cost:3,actions:['filter','graze','call'],niche:['wet-margin','detritus','larvae'],symmetry:'single',anim:'feeding'}),
  part('nibbler-mouth','feeding',{tags:['mouth','plant','small'],prereq:['grazing-mouth'],sockets:['mouth'],mass:.2,upkeep:.03,cost:2,actions:['graze','nibble','call'],niche:['plants'],symmetry:'single'}),
  part('sucker-mouth','feeding',{tags:['mouth','carrion'],prereq:['tearing-jaw'],sockets:['mouth'],mass:.35,upkeep:.1,cost:2,actions:['bite','suck','call'],niche:['carcass'],symmetry:'single'}),
  part('gape-mouth','feeding',{tags:['mouth','prey'],prereq:['tearing-jaw'],sockets:['mouth'],mass:.55,upkeep:.2,cost:3,actions:['bite','swallow','call'],niche:['prey'],symmetry:'single'}),
  part('simple-eye','senses',{tags:['eye','vision'],sockets:['eye'],mass:.05,upkeep:.03,cost:1,actions:['see'],niche:['open-ground']}),
  part('wide-field-eye','senses',{tags:['eye','vision','peripheral'],prereq:['simple-eye'],sockets:['eye'],mass:.08,upkeep:.07,cost:2,actions:['see','see-wide'],niche:['prey-vigilance']}),
  part('hunter-eye','senses',{tags:['eye','vision','forward'],prereq:['simple-eye'],sockets:['eye'],mass:.06,upkeep:.05,cost:2,actions:['see','aim'],niche:['prey']}),
  part('stalk-eye','senses',{tags:['eye','vision','raised'],prereq:['simple-eye'],sockets:['eye'],mass:.07,upkeep:.05,cost:2,actions:['see','spot'],niche:['cover']}),
  part('compound-eye','senses',{tags:['eye','vision','motion'],prereq:['wide-field-eye'],sockets:['eye'],mass:.09,upkeep:.08,cost:3,actions:['see','glance'],niche:['prey-vigilance']}),
  part('tracker-eye','senses',{tags:['eye','vision','forage'],prereq:['simple-eye'],sockets:['eye'],mass:.06,upkeep:.05,cost:2,actions:['see','track'],niche:['foraging']}),
  part('display-eye','senses',{tags:['eye','vision','social'],prereq:['simple-eye'],sockets:['eye'],mass:.06,upkeep:.05,cost:2,actions:['see','display','flare'],niche:['courtship']}),
  // Advanced vision (anatomical-vision/1): long-range lines narrow the view,
  // panoramic lines shorten it; both cost mass and upkeep. Evolve only in
  // worlds recording the policy.
  part('telescopic-eye','senses',{tags:['eye','vision','forward','advanced-vision'],prereq:['hunter-eye'],sockets:['eye'],mass:.1,upkeep:.09,cost:3,actions:['see','aim','spot'],niche:['prey','open-ground']}),
  part('raptor-eye','senses',{tags:['eye','vision','forward','advanced-vision'],prereq:['telescopic-eye'],sockets:['eye'],mass:.15,upkeep:.14,cost:4,actions:['see','aim','spot'],niche:['prey','open-ground']}),
  part('panoramic-eye','senses',{tags:['eye','vision','peripheral','motion','advanced-vision'],prereq:['compound-eye'],sockets:['eye'],mass:.12,upkeep:.1,cost:3,actions:['see','see-wide','glance'],niche:['prey-vigilance']}),
  part('sentinel-eye','senses',{tags:['eye','vision','peripheral','raised','advanced-vision'],prereq:['panoramic-eye'],sockets:['eye'],mass:.2,upkeep:.18,cost:4,actions:['see','see-wide','spot'],niche:['prey-vigilance','open-ground']}),
  part('eyespot','senses',{tags:['eye','light','cheap'],sockets:['eye'],mass:.02,upkeep:.01,cost:1,actions:['see'],niche:['scarcity']}),
  part('armor-plate','defense',{tags:['plate','protect'],sockets:['flank','dorsal'],mass:.6,upkeep:.12,cost:2,actions:['armor'],niche:['predator-pressure'],legacy:{axis:'armor',threshold:.5,adaptation:'hardened-mantle'}}),
  // Dryland barrier derived from protective plating. Trades insulation/food for reduced dehydration.
  part('wax-plates','metabolism',{tags:['flank','dryland','water-barrier'],prereq:['armor-plate'],sockets:['flank'],mass:.44,upkeep:.18,cost:4,actions:['insulate','armor'],niche:['dry-ground','scarcity']}),
  part('barb','defense',{tags:['spike','retaliate'],sockets:['spur'],mass:.1,upkeep:.04,cost:1,actions:['retaliate'],niche:['predator-pressure'],legacy:{axis:'barbs',threshold:.5,adaptation:'barbed-limbs'}}),
  part('claw','offense',{tags:['claw','strike'],sockets:['spur'],mass:.12,upkeep:.04,cost:1,actions:['strike'],niche:['prey']}),
  part('venom-gland','offense',{tags:['gland','toxin'],prereq:['tearing-jaw'],sockets:['flank'],mass:.2,upkeep:.15,cost:3,actions:['venom'],niche:['prey']}),
  part('storage-sac','metabolism',{tags:['sac','store'],sockets:['flank'],mass:.5,upkeep:.05,cost:2,actions:['store'],niche:['dry-ground','scarcity'],legacy:{axis:'waterBody',threshold:.5,adaptation:'water-sacs'}}),
  part('silt-fin','locomotion',{tags:['back','fin','water'],prereq:['paddle-tail'],sockets:['dorsal'],mass:.28,upkeep:.09,cost:3,actions:['swim-propel','flare'],niche:['aquatic','wet-margin'],symmetry:'single',anim:'sweep'}),
  // E3: biological coverage evolves through genuine ancestral precursors.
  // Display membranes have no flight action or air traversal without later physics.
  part('filament-tuft','metabolism',{tags:['cover','proto-filament'],sockets:['dorsal'],mass:.18,upkeep:.08,cost:2,actions:['insulate'],niche:['cold'],symmetry:'single'}),
  part('fur-mantle','metabolism',{tags:['cover','fur'],prereq:['filament-tuft'],sockets:['dorsal'],mass:.48,upkeep:.20,cost:4,actions:['insulate'],niche:['cold','woodland'],symmetry:'single'}),
  part('feather-mantle','metabolism',{tags:['cover','feathers'],prereq:['filament-tuft'],sockets:['dorsal'],mass:.39,upkeep:.21,cost:5,actions:['insulate','display'],niche:['cold','courtship'],symmetry:'single'}),
  part('proto-wing','locomotion',{tags:['cover','proto-wing','display'],prereq:['feather-mantle'],sockets:['dorsal'],mass:.72,upkeep:.32,cost:7,actions:['display','flare'],niche:['courtship','woodland'],symmetry:'single',anim:'sweep'}),
  // E8: bilateral, load-bearing wing pair built on the existing dorsal socket.
  // The physiological lift constraint lives in flight.js, not the part label.
  part('flight-wing','locomotion',{tags:['cover','feathers','wing','powered-flight'],prereq:['proto-wing'],sockets:['dorsal'],mass:.92,upkeep:.43,cost:8,actions:['fly','display','flare'],niche:['flight','migration','woodland'],symmetry:'single',anim:'sweep'}),
  // Display crests can evolve into active heat-dissipating dorsal frills.
  part('heat-frill','metabolism',{tags:['back','radiator','dryland'],prereq:['signal-crest'],sockets:['dorsal'],mass:.45,upkeep:.22,cost:5,actions:['insulate','display','flare'],niche:['hot','dry-ground'],symmetry:'single',anim:'breathing'}),
  part('signal-crest','social',{tags:['crest','display'],sockets:['dorsal'],mass:.1,upkeep:.05,cost:1,actions:['signal','flare'],niche:['family'],symmetry:'single',legacy:{axis:'signal',threshold:.5,adaptation:'alarm-pulse'}}),
  // GDD 6.2 slice restriction: buildable and previewable, but grants no open-water travel until
  // water physics, world collision and survival balancing genuinely support it.
  part('paddle-tail','locomotion',{tags:['tail','water'],sockets:['tail'],mass:.4,upkeep:.1,cost:2,actions:['swim-propel'],niche:['wet-margin'],symmetry:'single',anim:'sweep'}),
  // Wave 2 (2026-10-09): tails, backs, flanks and spurs to eight each. One ability and one cost each.
  // Relic parts (2026-10-09): never evolved naturally; unlocked by a relic from a special creature.
  part('horn-crest','defense',{tags:['back','exclusive'],sockets:['dorsal'],mass:.3,upkeep:.08,cost:3,actions:['retaliate','display','flare'],niche:['predator-pressure'],symmetry:'single'}),
  part('tusk-jaw','feeding',{tags:['mouth','exclusive','flesh'],sockets:['mouth'],mass:.6,upkeep:.2,cost:3,actions:['bite','tear','crush','call'],niche:['prey'],symmetry:'single'}),
  // More relic parts (2026-10-09): from the Golden Hopper, the Crystal Digger and the Ghost GenVo8.
  part('patagium','locomotion',{tags:['flank','membrane'],prereq:['climber-leg'],sockets:['flank'],mass:.25,upkeep:.12,cost:3,actions:['glide'],niche:['canopy','escape']}),
  part('gliding-membrane','locomotion',{tags:['flank','exclusive'],sockets:['flank'],mass:.25,upkeep:.08,cost:3,actions:['sprint'],niche:['escape']}),
  part('luminous-tail','social',{tags:['tail','exclusive'],sockets:['tail'],mass:.3,upkeep:.06,cost:3,actions:['display','signal','flare'],niche:['courtship','prey'],symmetry:'single',anim:'sweep'}),
  part('shell-back','defense',{tags:['back','exclusive','shell'],sockets:['dorsal'],mass:.7,upkeep:.08,cost:3,actions:['armor'],niche:['predator-pressure'],symmetry:'single'}),
  part('armored-hide','defense',{tags:['plate','exclusive','protect'],sockets:['flank'],mass:.6,upkeep:.1,cost:3,actions:['armor','retaliate'],niche:['predator-pressure']}),
  part('glow-eye','senses',{tags:['eye','vision','exclusive','light'],sockets:['eye'],mass:.06,upkeep:.05,cost:3,actions:['see','track'],niche:['foraging','cover']}),
  part('echo-crest','senses',{tags:['back','exclusive'],sockets:['dorsal'],mass:.2,upkeep:.06,cost:3,actions:['see-wide','spot','call'],niche:['prey-vigilance'],symmetry:'single'}),
  part('balance-tail','locomotion',{tags:['tail'],prereq:[],sockets:['tail'],mass:.35,upkeep:0.05,cost:1,actions:["run"],niche:["open-ground"],symmetry:'single',anim:'sweep'}),
  part('club-tail','locomotion',{tags:['tail'],prereq:["balance-tail"],sockets:['tail'],mass:.35,upkeep:0.1,cost:2,actions:["retaliate"],niche:["predator-pressure"],symmetry:'single',anim:'sweep'}),
  part('spined-tail','locomotion',{tags:['tail'],prereq:["club-tail"],sockets:['tail'],mass:.35,upkeep:0.12,cost:3,actions:["armor"],niche:["predator-pressure"],symmetry:'single',anim:'sweep'}),
  part('whip-tail','locomotion',{tags:['tail'],prereq:["balance-tail"],sockets:['tail'],mass:.35,upkeep:0.08,cost:2,actions:["strike"],niche:["prey"],symmetry:'single',anim:'sweep'}),
  part('prehensile-tail','locomotion',{tags:['tail'],prereq:["balance-tail"],sockets:['tail'],mass:.35,upkeep:0.08,cost:2,actions:["carry"],niche:["provisioning"],symmetry:'single',anim:'sweep'}),
  part('fat-tail','locomotion',{tags:['tail'],prereq:[],sockets:['tail'],mass:.35,upkeep:0.04,cost:2,actions:["store"],niche:["scarcity"],symmetry:'single',anim:'sweep'}),
  part('flag-tail','locomotion',{tags:['tail'],prereq:["balance-tail"],sockets:['tail'],mass:.35,upkeep:0.04,cost:1,actions:["display","flare"],niche:["courtship"],symmetry:'single',anim:'sweep'}),
  part('sail-fin','metabolism',{tags:['back'],prereq:[],sockets:['dorsal'],mass:.3,upkeep:0.06,cost:2,actions:["store"],niche:["dry-ground"],symmetry:'single'}),
  part('spine-ridge','defense',{tags:['back'],prereq:[],sockets:['dorsal'],mass:.3,upkeep:0.08,cost:2,actions:["brace"],niche:["predator-pressure"],symmetry:'single'}),
  part('water-hump','metabolism',{tags:['back'],prereq:["sail-fin"],sockets:['dorsal'],mass:.3,upkeep:0.06,cost:3,actions:["store"],niche:["dry-ground","scarcity"],symmetry:'single'}),
  part('display-frill','social',{tags:['back'],prereq:["signal-crest"],sockets:['dorsal'],mass:.3,upkeep:0.06,cost:2,actions:["display","flare"],niche:["courtship"],symmetry:'single'}),
  part('moss-back','defense',{tags:['back'],prereq:[],sockets:['dorsal'],mass:.3,upkeep:0.06,cost:2,actions:["quiet"],niche:["cover"],symmetry:'single'}),
  part('thorn-carapace','defense',{tags:['back','shell','spike'],prereq:['armor-plate'],sockets:['dorsal'],mass:.84,upkeep:.17,cost:4,actions:['armor','retaliate'],niche:['predator-pressure','dry-ground'],symmetry:'single',anim:'breathing'}),
  part('sensory-quills','senses',{tags:['back'],prereq:["spine-ridge"],sockets:['dorsal'],mass:.3,upkeep:0.07,cost:2,actions:["glance"],niche:["prey-vigilance"],symmetry:'single'}),
  part('fat-pad','metabolism',{tags:['flank'],prereq:[],sockets:['flank'],mass:.3,upkeep:0.03,cost:2,actions:["store"],niche:["scarcity"]}),
  part('gill-slits','locomotion',{tags:['flank'],prereq:["storage-sac"],sockets:['flank'],mass:.3,upkeep:0.08,cost:3,actions:["swim"],niche:["wet-margin"]}),
  // Excretes salt so gills can keep a body watered in seawater (marine-food-web/1).
  part('salt-gland','locomotion',{tags:['flank','marine'],prereq:["gill-slits"],sockets:['flank'],mass:.2,upkeep:0.06,cost:3,actions:[],niche:["marine"]}),
  part('scent-gland','social',{tags:['flank'],prereq:[],sockets:['flank'],mass:.3,upkeep:0.05,cost:2,actions:["display","scent"],niche:["courtship"]}),
  part('spine-cluster','defense',{tags:['flank'],prereq:["armor-plate"],sockets:['flank'],mass:.3,upkeep:0.08,cost:3,actions:["retaliate"],niche:["predator-pressure"]}),
  part('brood-pouch','metabolism',{tags:['flank'],prereq:["storage-sac"],sockets:['flank'],mass:.3,upkeep:0.05,cost:2,actions:["carry"],niche:["family"]}),
  // Functional egg production. Mounts on a flank and competes with other uses of that socket.
  // A creature without this organ retains the legacy live-birth lifecycle.
  part('egg-chamber','metabolism',{tags:['flank','reproduction','oviparous'],sockets:['flank'],mass:.8,upkeep:.22,cost:5,actions:['lay-eggs'],niche:['reproduction','dry-ground'],symmetry:'single'}),
  // Optional live-bearing organ. On an egg-bearing body this adds an expensive second
  // reproductive pathway; both take real part slots, mutation points and upkeep.
  part('live-womb','metabolism',{tags:['flank','reproduction','viviparous'],sockets:['flank'],mass:1.1,upkeep:.36,cost:7,actions:['live-birth'],niche:['reproduction','family'],symmetry:'single'}),
  // E10: costly fur-derived internally regulated heat, followed by a milk gland.
  // Both use actual organ sockets. The starter small torso cannot carry the
  // whole complex: the lineage first needs a torso with more flank capacity.
  part('endothermic-core','metabolism',{tags:['flank','warm-blooded','thermoregulation'],prereq:['fur-mantle'],sockets:['flank'],mass:.65,upkeep:.32,cost:6,actions:['thermoregulate'],niche:['cold','alpine','tundra'],symmetry:'single'}),
  part('mammary-gland','metabolism',{tags:['flank','reproduction','milk','parental-investment'],prereq:['endothermic-core','live-womb'],sockets:['flank'],mass:.56,upkeep:.31,cost:7,actions:['lactate'],niche:['family','tundra','reproduction'],symmetry:'single'}),
  part('hook-spur','offense',{tags:['spur'],prereq:["claw"],sockets:['spur'],mass:.08,upkeep:0.03,cost:1,actions:["strike"],niche:["prey"]}),
  part('dew-claw','defense',{tags:['spur'],prereq:[],sockets:['spur'],mass:.08,upkeep:0.02,cost:1,actions:["brace"],niche:["predator-pressure"]}),
  part('heel-spike','defense',{tags:['spur'],prereq:["barb"],sockets:['spur'],mass:.08,upkeep:0.03,cost:1,actions:["armor"],niche:["predator-pressure"]}),
  part('sensory-bristle','senses',{tags:['spur'],prereq:[],sockets:['spur'],mass:.08,upkeep:0.02,cost:1,actions:["glance"],niche:["prey-vigilance"]}),
  part('grip-pad','limbs',{tags:['spur'],prereq:[],sockets:['spur'],mass:.08,upkeep:0.02,cost:1,actions:["run"],niche:["open-ground"]}),
  part('hook-pad','limbs',{tags:['spur','grip','climb'],prereq:['grip-pad'],sockets:['spur'],mass:.12,upkeep:.035,cost:3,actions:['climb','brace'],niche:['slopes','woodland']}),
  part('kick-spur','offense',{tags:['spur'],prereq:["claw"],sockets:['spur'],mass:.08,upkeep:0.03,cost:1,actions:["strike"],niche:["prey"]}),
].map(p=>[p.id,p])));

export const PART_IDS=Object.freeze(Object.keys(PARTS));
export function partDef(id){return PARTS[id]||null}

// Static contract checks (GDD 15: registry ID uniqueness, metadata shape).
export const REQUIRED_PART_FIELDS=Object.freeze(['id','family','assetId','partVersion','tags','developmentalPrerequisites','compatibleSocketTypes','providedSockets','jointChain','mountingBounds','orientationRules','symmetryRules','dimensions','mass','upkeep','mutationCost','effectContributions','actionCapabilities','animationProfile','inheritanceProfile','ecologicalNicheTags']);
export function registryProblems(){
  const out=[];const ids=new Set();
  for(const p of Object.values(PARTS)){
    if(ids.has(p.id))out.push(`duplicate id ${p.id}`);ids.add(p.id);
    for(const f of REQUIRED_PART_FIELDS)if(!(f in p))out.push(`${p.id}: missing ${f}`);
    if(!FAMILIES.includes(p.family))out.push(`${p.id}: unknown family ${p.family}`);
    for(const t of p.compatibleSocketTypes)if(!SOCKET_TYPES.includes(t))out.push(`${p.id}: unknown socket type ${t}`);
    for(const s of p.providedSockets)if(!SOCKET_TYPES.includes(s.type))out.push(`${p.id}: provides unknown socket ${s.type}`);
    for(const c of p.actionCapabilities)if(!CAPABILITIES.includes(c))out.push(`${p.id}: unknown capability ${c}`);
    for(const q of p.developmentalPrerequisites)if(!PARTS[q])out.push(`${p.id}: unknown prerequisite ${q}`);
    if(!p.tags.includes('root')&&!p.compatibleSocketTypes.length)out.push(`${p.id}: non-root part with no socket type`);
  }
  return out;
}
