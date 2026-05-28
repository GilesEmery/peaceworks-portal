export type PeaceProfileContent = {
  profileName: string;
  baseName: string;
  description: string;
  strengths: string[];
  harder: string[];
  othersExperience: string;
  wayOfPeace: string;
  internalPractice: string;
  relationalPractice: string;
  stepOfPeace: string;
  expandedReflection: string;
};

export const peaceAssessmentProfiles: Record<
  string,
  PeaceProfileContent
> = {
"Performance|Push|Internal": {
  profileName: "The Focused Achiever",
  baseName: "Achiever",
  description:
    "You tend to lose peace when things feel ineffective, poorly executed, unclear, or out of control. Under pressure, you carry a strong internal urgency to make things work, fix what is broken, and regain clarity before others may even realize how much pressure you feel. You often appear composed externally while internally carrying intense responsibility.",
  strengths: [
    "Strategic and thoughtful under pressure",
    "Strong internal responsibility",
    "Able to notice inefficiency quickly",
    "Dependable when things become difficult",
    "Brings clarity to scattered situations",
  ],
  harder: [
    "Carrying pressure silently",
    "Difficulty delegating important work",
    "Quiet frustration or irritability",
    "Overfunctioning when others struggle",
    "Believing peace depends on control",
  ],
  othersExperience:
    "Others often experience you as highly capable, intelligent, and dependable. Many people trust your judgment because you tend to think carefully before acting. However, others may not realize how much pressure you quietly carry beneath the surface. When stress rises, they may feel subtle frustration, emotional distance, or intensity without understanding what is happening internally.",
  wayOfPeace:
    "Peace grows when responsibility becomes shared rather than silently absorbed.",
  internalPractice:
    "Pause and ask, “What am I trying to control that is not fully mine to carry?”",
  relationalPractice:
    "Invite collaboration earlier instead of waiting until frustration builds.",
  stepOfPeace:
    "Before solving a problem alone, invite one trusted person into the process.",
  expandedReflection:
    "Your strength is your ability to think carefully and carry responsibility faithfully. Yet over time, silent responsibility can become isolation. You may begin believing that if you do not hold everything together internally, things will fall apart. Real peace does not come through perfect control. It grows when trust, collaboration, and shared responsibility replace internal pressure. You do not need to carry everything alone to be valuable.",
},

"Performance|Push|External": {
  profileName: "The Driving Achiever",
  baseName: "Achiever",
  description:
    "You tend to lose peace when things feel inefficient, unclear, slow, or ineffective. Under pressure, your urgency becomes visible through directness, decisiveness, intensity, or taking over because you deeply want things to move forward successfully.",
  strengths: [
    "Strong leadership energy",
    "Fast decision making",
    "Clear under pressure",
    "Action oriented",
    "Able to move teams forward quickly",
  ],
  harder: [
    "Overcontrolling situations",
    "Listening less when stressed",
    "Creating pressure for others",
    "Becoming impatient with slower people",
    "Valuing outcomes over relationships",
  ],
  othersExperience:
    "Others often experience you as strong, capable, and decisive. You naturally create momentum when situations feel stuck. However, under pressure, people may also experience you as intense, corrective, impatient, or difficult to approach emotionally. Some may feel managed rather than included.",
  wayOfPeace:
    "Peace grows when clarity includes curiosity and collaboration.",
  internalPractice:
    "Ask yourself, “What would happen if I slowed down before solving?”",
  relationalPractice:
    "Listen fully before moving into correction, direction, or action.",
  stepOfPeace:
    "In one difficult conversation, ask several questions before offering a solution.",
  expandedReflection:
    "Your ability to lead and create movement is a gift. Yet pressure can slowly convince you that peace depends on speed, clarity, and control. The more anxious things become, the more you may feel the need to push harder. Over time, this can unintentionally exhaust relationships around you. Real peace grows when leadership becomes relational rather than merely directional. You do not need to lose your strength. You simply need to create enough space for others to walk with you rather than feel pushed by you.",
},

"Performance|Prove|Internal": {
  profileName: "The Quiet Builder",
  baseName: "Builder",
  description:
    "You tend to lose peace when you feel behind, ineffective, or unable to carry what is expected of you. Under pressure, you quietly absorb more responsibility internally, often appearing steady while privately carrying exhaustion, pressure, and self-criticism.",
  strengths: [
    "Dependable and faithful",
    "Hard working",
    "Quietly resilient",
    "Reflective and thoughtful",
    "Consistent under pressure",
  ],
  harder: [
    "Silent exhaustion",
    "Difficulty resting without guilt",
    "Hidden resentment",
    "Carrying too much alone",
    "Tying worth to productivity",
  ],
  othersExperience:
    "Others often experience you as dependable, thoughtful, and steady. You rarely seek attention for what you carry, which causes many people to trust you deeply. Yet because you quietly absorb responsibility, others may not realize how overwhelmed or emotionally exhausted you truly feel.",
  wayOfPeace:
    "Peace grows when contribution flows from groundedness rather than proving your worth.",
  internalPractice:
    "Ask yourself, “What am I carrying that no one actually asked me to carry?”",
  relationalPractice:
    "Communicate your limits before resentment quietly builds.",
  stepOfPeace:
    "Release, delegate, or renegotiate one unnecessary responsibility.",
  expandedReflection:
    "Your work ethic and loyalty are gifts to others. Yet over time, responsibility can slowly become connected to identity. You may begin believing that your value comes from how much you can carry, solve, or accomplish. This creates a cycle where rest feels irresponsible and slowing down creates anxiety. Real peace grows when your worth is no longer dependent on constant productivity. You are valuable even when you are resting, limited, or unfinished.",
},

"Performance|Prove|External": {
  profileName: "The Active Builder",
  baseName: "Builder",
  description:
    "You tend to lose peace when things feel unfinished, ineffective, uncertain, or unproductive. Under pressure, you become more visibly active, productive, helpful, and engaged because movement helps restore your sense of stability and effectiveness.",
  strengths: [
    "Energetic and productive",
    "Solution oriented",
    "Motivates others through action",
    "Reliable under pressure",
    "Creates momentum quickly",
  ],
  harder: [
    "Overworking",
    "Difficulty slowing down",
    "Productivity addiction",
    "Quiet burnout",
    "Creating pressure for others unintentionally",
  ],
  othersExperience:
    "Others often experience you as energetic, capable, and highly useful. You naturally create movement and progress when situations feel stagnant. Yet under pressure, your pace may unintentionally exhaust others or communicate that constant productivity is necessary to feel secure.",
  wayOfPeace:
    "Peace grows when contribution becomes sustainable rather than constant.",
  internalPractice:
    "Ask yourself, “Am I working from peace or working for peace?”",
  relationalPractice:
    "Invite shared responsibility instead of carrying everything yourself.",
  stepOfPeace:
    "Pause before immediately fixing the next problem.",
  expandedReflection:
    "Your energy and action orientation bring tremendous value to teams and relationships. Yet movement can slowly become your primary coping mechanism. When anxiety rises, activity increases. Over time, you may struggle to rest because slowing down feels emotionally unsafe. Real peace grows when your value is no longer tied to constant movement. Sustainable rhythms create deeper peace than nonstop productivity.",
},

"Performance|Please|Internal": {
  profileName: "The Thoughtful Contributor",
  baseName: "Contributor",
  description:
    "You tend to lose peace when people may be disappointed in your performance or contribution. Under pressure, you quietly adapt, overextend, and absorb emotional responsibility internally while trying to keep others satisfied and supported.",
  strengths: [
    "Thoughtful and considerate",
    "Reliable support for others",
    "Emotionally aware",
    "Quietly compassionate",
    "Sensitive to the needs of teams",
  ],
  harder: [
    "Overextending yourself",
    "Difficulty saying no",
    "Quiet resentment",
    "Fear of disappointing others",
    "Losing your own needs in service to others",
  ],
  othersExperience:
    "Others often experience you as caring, dependable, and thoughtful. You naturally create supportive environments and help people feel cared for. Yet because you quietly absorb pressure, people may not realize when helping others is costing you peace internally.",
  wayOfPeace:
    "Peace grows when honesty becomes stronger than hidden accommodation.",
  internalPractice:
    "Ask yourself, “Do I actually have the capacity to say yes peacefully?”",
  relationalPractice:
    "Communicate your limits before exhaustion turns into resentment.",
  stepOfPeace:
    "Practice one honest boundary this week.",
  expandedReflection:
    "Your care for others is deeply meaningful. Yet over time, your desire to support others can slowly become connected to approval and worth. You may begin sacrificing your own emotional health in order to keep everyone else okay. Real peace grows when your support includes honesty, limits, and self-awareness. Caring for others should not require disappearing yourself.",
},

"Performance|Please|External": {
  profileName: "The Responsive Contributor",
  baseName: "Contributor",
  description:
    "You tend to lose peace when others feel unsupported, disappointed, frustrated, or unhappy with your contribution. Under pressure, you move outward to help, respond, support, and maintain relational harmony because helping others helps you feel secure and valued.",
  strengths: [
    "Warm and relational",
    "Responsive to practical needs",
    "Creates supportive environments",
    "Helpful under pressure",
    "Encouraging to others",
  ],
  harder: [
    "People pleasing",
    "Overcommitment",
    "Difficulty disappointing others",
    "Ignoring your own limits",
    "Needing external approval to feel secure",
  ],
  othersExperience:
    "Others often experience you as warm, available, helpful, and emotionally supportive. You naturally create environments where people feel cared for and seen. Yet under stress, others may also begin depending on you excessively because you rarely communicate your limits clearly.",
  wayOfPeace:
    "Peace grows when support becomes honest and sustainable.",
  internalPractice:
    "Ask yourself, “Am I helping from peace or from fear of disappointing people?”",
  relationalPractice:
    "Pause before immediately saying yes to requests.",
  stepOfPeace:
    "Tell one person, “I need to check my capacity first.”",
  expandedReflection:
    "Your responsiveness and care are gifts to the people around you. Yet over time, constant availability can slowly become emotionally exhausting. You may begin feeling responsible for keeping everyone else emotionally okay. Real peace grows when support includes boundaries, honesty, and sustainable rhythms. You can care deeply for people without carrying responsibility for everyone’s emotional stability.",
},

 "Performance|PullAway|Internal": {
  profileName: "The Private Burden Bearer",
  baseName: "Burden Bearer",
  description:
    "You tend to lose peace when expectations feel too heavy or failure feels likely. Under pressure, you retreat inwardly, carry the burden privately, and may delay engagement until you feel more ready or less exposed.",
  strengths: ["Thoughtful", "Reflective", "Careful under pressure", "Aware of limits", "Able to avoid impulsive reactions"],
  harder: ["Withdrawing when pressure rises", "Avoiding responsibility when overwhelmed", "Waiting too long to re-engage", "Feeling alone with the burden", "Appearing disengaged when you are actually overwhelmed"],
  othersExperience:
    "Others may experience you as thoughtful and careful, but also hard to read when pressure rises. They may not know whether you are processing, overwhelmed, or pulling away.",
  wayOfPeace: "Practice small engagement instead of private avoidance.",
  internalPractice: "Ask, “What is one small step I can take instead of avoiding the whole thing?”",
  relationalPractice: "Tell one person, “I have been overwhelmed, but I want to re-engage.”",
  stepOfPeace: "Take one small visible step toward the thing you have been avoiding.",
  expandedReflection:
    "Your growth begins when you stop waiting for the burden to feel small before you move. Peace does not require solving everything at once. It grows through small, honest steps of re-engagement.",
},

"Performance|PullAway|External": {
  profileName: "The Strategic Delayer",
  baseName: "Burden Bearer",
  description:
    "You tend to lose peace when pressure feels overwhelming, expectations feel too high, or success feels uncertain. Under pressure, you may visibly delay, deflect, postpone, or step back to reduce the weight of responsibility.",
  strengths: ["Measured", "Careful", "Able to slow down rushed decisions", "Aware of unrealistic expectations", "Thoughtful before acting"],
  harder: ["Delaying when action is needed", "Avoiding hard conversations", "Leaving others uncertain", "Communicating pressure indirectly", "Appearing resistant when you are overwhelmed"],
  othersExperience:
    "Others may experience you as thoughtful and measured, but they may also feel confused or frustrated when you delay without explaining why.",
  wayOfPeace: "Practice honest engagement instead of unexplained delay.",
  internalPractice: "Ask, “What am I postponing because it feels too heavy?”",
  relationalPractice: "Name the pressure directly instead of only delaying the decision.",
  stepOfPeace: "Tell someone, “I need time, but I am still engaged. Here is my next step.”",
  expandedReflection:
    "Your growth begins when delay becomes communication rather than disappearance. Peace grows when you can name pressure honestly and stay connected while you discern the next step.",
},

"Prestige|Push|Internal": {
  profileName: "The Guarded Influencer",
  baseName: "Influencer",
  description:
    "You tend to lose peace when your value, respect, or reputation feels threatened. Under pressure, you may internally rehearse defenses, protect your image, and prepare to explain yourself before anyone sees how unsettled you feel.",
  strengths: ["Perceptive", "Socially aware", "Thoughtful about impact", "Able to advocate strongly", "Sensitive to trust and respect"],
  harder: ["Defending internally before listening externally", "Overthinking how others see you", "Guardedness when feedback feels personal", "Protecting image over receiving impact", "Assuming critique equals rejection"],
  othersExperience:
    "Others may experience you as thoughtful, capable, and socially aware, but they may also sense guardedness when your image feels at risk.",
  wayOfPeace: "Practice receiving impact before protecting image.",
  internalPractice: "Ask, “Am I protecting truth, or protecting how I am seen?”",
  relationalPractice: "Ask one person, “What did you experience from me before I explain what I meant?”",
  stepOfPeace: "Summarize the other person’s experience before clarifying your intention.",
  expandedReflection:
    "Your growth begins when being respected is no longer more important than being receptive. Peace grows when you can stay open to impact without immediately defending identity.",
},

"Prestige|Push|External": {
  profileName: "The Assertive Influencer",
  baseName: "Influencer",
  description:
    "You tend to lose peace when you feel misunderstood, dismissed, disrespected, or unseen. Under pressure, you may become persuasive, forceful, expressive, or visibly defensive because being understood feels urgent.",
  strengths: ["Persuasive", "Energetic", "Strong communicator", "Able to advocate for what matters", "Brings presence into difficult rooms"],
  harder: ["Pushing for agreement", "Defending image before listening", "Overpowering quieter voices", "Becoming intense when misunderstood", "Mistaking persuasion for repair"],
  othersExperience:
    "Others may experience you as compelling and passionate, but they may also feel convinced, managed, or pushed when your peace depends on being understood.",
  wayOfPeace: "Practice influence through humility rather than force.",
  internalPractice: "Ask, “What am I trying to prove in this moment?”",
  relationalPractice: "Let someone else’s perspective stand before you respond.",
  stepOfPeace: "Ask, “What do you need me to understand?” before defending your view.",
  expandedReflection:
    "Your growth begins when influence becomes rooted in trust rather than urgency. Peace grows when people experience your strength as spacious enough to receive them.",
},

"Prestige|Prove|Internal": {
  profileName: "The Hidden Striver",
  baseName: "Striver",
  description:
    "You tend to lose peace when you feel unseen, unappreciated, overlooked, or not valued. Under pressure, you work harder privately, hoping your effort will eventually prove your worth or earn recognition.",
  strengths: ["Committed", "Excellent in quiet ways", "Attentive to trust", "Hardworking", "Often deeply loyal"],
  harder: ["Feeling unseen while working hard", "Private comparison", "Discouragement when effort is not named", "Working for approval without admitting it", "Hidden resentment"],
  othersExperience:
    "Others may experience you as committed and thoughtful, but may not realize how much you long to be seen.",
  wayOfPeace: "Practice hidden faithfulness without hidden resentment.",
  internalPractice: "Name one good thing you did today that no one else noticed. Let it be enough.",
  relationalPractice: "Share honestly with someone trusted where you feel unseen.",
  stepOfPeace: "Offer one act of excellence without tracking whether it is recognized.",
  expandedReflection:
    "Your growth begins when your worth is no longer held hostage by recognition. Peace grows as you learn to receive your value before applause arrives.",
},

"Prestige|Prove|External": {
  profileName: "The Recognition Striver",
  baseName: "Striver",
  description:
    "You tend to lose peace when your contribution goes unnoticed or your value feels uncertain. Under pressure, you may become visibly productive, impressive, helpful, or achievement-driven to regain a sense of being valued.",
  strengths: ["Motivated", "Energetic", "Impact-oriented", "Capable of excellence", "Often inspiring to others"],
  harder: ["Overperforming when unnoticed", "Comparing your contribution", "Restlessness without affirmation", "Confusing visibility with value", "Needing recognition to feel settled"],
  othersExperience:
    "Others may experience you as impressive, energetic, and capable, but they may also feel the pressure of your need to be recognized.",
  wayOfPeace: "Practice contribution without chasing recognition.",
  internalPractice: "Ask, “Would this still matter if no one noticed?”",
  relationalPractice: "Let someone else receive attention without needing to reposition yourself.",
  stepOfPeace: "Choose one meaningful contribution this week and keep it quiet.",
  expandedReflection:
    "Your growth begins when contribution becomes free from the need to secure value. Peace grows when your impact flows from grounded purpose rather than the ache to be seen.",
},

"Prestige|Please|Internal": {
  profileName: "The Careful Harmonizer",
  baseName: "Harmonizer",
  description:
    "You tend to lose peace when relationships feel strained, approval feels uncertain, or someone may be disappointed in you. Under pressure, you quietly adapt, monitor emotional tone, and soften your own needs to preserve connection.",
  strengths: ["Emotionally perceptive", "Relationally careful", "Warm", "Considerate", "Sensitive to tension"],
  harder: ["Losing your voice", "Hiding your needs", "Avoiding truth", "Privately carrying relational anxiety", "Confusing approval with peace"],
  othersExperience:
    "Others may experience you as kind, safe, and thoughtful, but they may not know what you really think or need.",
  wayOfPeace: "Practice honest presence instead of quiet self-erasure.",
  internalPractice: "Ask, “What do I actually think or need here?”",
  relationalPractice: "Share one honest thought you would normally soften or hide.",
  stepOfPeace: "Tell the truth kindly in one low-risk conversation.",
  expandedReflection:
    "Your growth begins when connection becomes strong enough to hold honesty. Peace grows when you stop editing yourself for approval and begin showing up with warmth and clarity.",
},

"Prestige|Please|External": {
  profileName: "The Relational Harmonizer",
  baseName: "Harmonizer",
  description:
    "You tend to lose peace when others are upset, distant, tense, or disappointed. Under pressure, you move outward to restore harmony, smooth things over, and help people feel okay with you and each other.",
  strengths: ["Warm", "Empathetic", "Connection-oriented", "Able to reduce tension", "Makes people feel considered"],
  harder: ["Smoothing over what needs to be named", "Managing everyone’s emotional temperature", "Avoiding hard truth", "Confusing harmony with peace", "Over-adapting"],
  othersExperience:
    "Others may experience you as warm and calming, but may also sense when important truth is being softened or avoided.",
  wayOfPeace: "Practice truthful harmony instead of approval management.",
  internalPractice: "Ask, “Am I making peace, or managing how people feel about me?”",
  relationalPractice: "Name one gentle truth instead of smoothing it over.",
  stepOfPeace: "Bring one honest but kind sentence into a conversation you would normally avoid.",
  expandedReflection:
    "Your growth begins when harmony becomes honest rather than merely comfortable. Peace grows when connection and honesty learn to live in the same room.",
},

"Prestige|PullAway|Internal": {
  profileName: "The Private Image Protector",
  baseName: "Image Protector",
  description:
    "You tend to lose peace when you feel exposed, embarrassed, rejected, or misunderstood. Under pressure, you retreat inwardly, replay conversations, and protect yourself from further shame by becoming less visible.",
  strengths: ["Self-aware", "Thoughtful", "Careful with impact", "Sensitive to nuance", "Often relationally considerate"],
  harder: ["Disappearing when exposed", "Replaying moments privately", "Hiding parts that need care", "Assuming rejection", "Letting shame isolate you"],
  othersExperience:
    "Others may experience you as thoughtful and considerate, but when you feel exposed they may also experience distance, silence, or uncertainty.",
  wayOfPeace: "Practice being known instead of disappearing when exposed.",
  internalPractice: "Ask, “What am I afraid people will see?”",
  relationalPractice: "Tell one trusted person what felt hard instead of hiding it.",
  stepOfPeace: "Name one vulnerable truth to someone safe.",
  expandedReflection:
    "Your growth begins when being seen no longer feels the same as being unsafe. Peace invites you to stay present and let trusted relationships carry part of what you would normally hide alone.",
},

"Prestige|PullAway|External": {
  profileName: "The Retreating Image Protector",
  baseName: "Image Protector",
  description:
    "You tend to lose peace when you feel misunderstood, embarrassed, rejected, or socially exposed. Under pressure, you visibly disengage, distance yourself, avoid the room, or pull away from people who may see you differently.",
  strengths: ["Reflective", "Sensitive to relational impact", "Careful", "Able to avoid escalation", "Aware of social dynamics"],
  harder: ["Retreating before people understand", "Avoiding repair", "Leaving others guessing", "Protecting image at the cost of connection", "Assuming distance equals safety"],
  othersExperience:
    "Others may experience you as considerate and self-aware, but when you pull away they may feel confused, shut out, or unsure how to reconnect.",
  wayOfPeace: "Practice returning instead of retreating.",
  internalPractice: "Ask, “What story am I telling myself about how they see me?”",
  relationalPractice: "Return to one conversation you would normally avoid after feeling exposed.",
  stepOfPeace: "Say, “I pulled back because I felt exposed, but I want to reconnect.”",
  expandedReflection:
    "Your growth begins when distance no longer becomes your main form of protection. Peace grows as you learn to return after embarrassment and ask for clarity instead of assuming rejection.",
},

"Prosperity|Push|Internal": {
  profileName: "The Watchful Guardian",
  baseName: "Guardian",
  description:
    "You tend to lose peace when safety, certainty, resources, or stability feel threatened. Under pressure, you become internally watchful, scanning for risk and tightening control before others may see your concern.",
  strengths: ["Prepared", "Wise", "Risk-aware", "Protective", "Thoughtful about stability"],
  harder: ["Hypervigilance", "Carrying every possible risk", "Difficulty relaxing", "Quiet fear", "Assuming uncertainty equals danger"],
  othersExperience:
    "Others may experience you as thoughtful, wise, and prepared, but they may also feel your guardedness when risk is present.",
  wayOfPeace: "Practice trust instead of private vigilance.",
  internalPractice: "Ask, “What am I protecting, and is control the only way?”",
  relationalPractice: "Let someone else know what concern you are carrying instead of managing it silently.",
  stepOfPeace: "Release one small decision to someone trustworthy this week.",
  expandedReflection:
    "Your growth begins when protection becomes spacious enough for trust. Peace grows when you can guard wisely without carrying every possible outcome alone.",
},

"Prosperity|Push|External": {
  profileName: "The Protective Guardian",
  baseName: "Guardian",
  description:
    "You tend to lose peace when environments feel unstable, unsafe, unpredictable, or under-resourced. Under pressure, you move outward to protect, control, stabilize, or prevent what could go wrong.",
  strengths: ["Protective", "Decisive", "Strong in uncertainty", "Creates safety", "Acts when risk is high"],
  harder: ["Protection becoming control", "Resisting needed risk", "Limiting others unintentionally", "Assuming safety depends on your grip", "Over-functioning in instability"],
  othersExperience:
    "Others may experience you as strong, protective, and prepared, but they may also feel restricted when your desire for safety becomes control.",
  wayOfPeace: "Practice protection that makes room for trust.",
  internalPractice: "Ask, “Am I creating safety, or trying to eliminate uncertainty?”",
  relationalPractice: "Ask one person, “Where do you need me to trust rather than control?”",
  stepOfPeace: "Allow someone else to lead one decision you would normally control.",
  expandedReflection:
    "Your growth begins when safety becomes shared rather than enforced. Peace grows when protection includes freedom, trust, and collaboration.",
},

"Prosperity|Prove|Internal": {
  profileName: "The Private Stabilizer",
  baseName: "Stabilizer",
  description:
    "You tend to lose peace when the future feels uncertain or unstable. Under pressure, you privately overprepare, overthink, and carry responsibility for creating security before anyone else notices the weight.",
  strengths: ["Prepared", "Steady", "Thoughtful", "Responsible", "Supportive in quiet ways"],
  harder: ["Preparation becoming anxiety", "Solving tomorrow too early", "Carrying hidden pressure", "Confusing readiness with peace", "Difficulty resting with uncertainty"],
  othersExperience:
    "Others may experience you as steady and dependable, but may not realize how much future-oriented pressure you are carrying.",
  wayOfPeace: "Practice preparation without letting tomorrow steal today.",
  internalPractice: "Name what is actually needed today, not everything that could go wrong tomorrow.",
  relationalPractice: "Share one future concern with someone instead of carrying it privately.",
  stepOfPeace: "Choose one future worry and translate it into one grounded action for today.",
  expandedReflection:
    "Your growth begins when preparation serves peace rather than replacing it. Peace grows when you prepare wisely and allow some uncertainty to remain unresolved.",
},

"Prosperity|Prove|External": {
  profileName: "The Active Stabilizer",
  baseName: "Stabilizer",
  description:
    "You tend to lose peace when life feels unpredictable, unstable, or underprepared. Under pressure, you visibly organize, plan, work, and create systems to restore a sense of security.",
  strengths: ["Organized", "Practical", "Steady", "Responsible", "Able to create structure"],
  harder: ["Overplanning", "Creating pressure for others", "Preventing every possible problem", "Struggling with flexibility", "Turning anxiety into constant action"],
  othersExperience:
    "Others may experience you as helpful, prepared, and responsible, but they may also feel the weight of your planning when it becomes urgency.",
  wayOfPeace: "Practice steady preparation instead of anxious production.",
  internalPractice: "Ask, “Is this preparation helping, or is anxiety trying to feel useful?”",
  relationalPractice: "Invite others into planning without transferring your anxiety to them.",
  stepOfPeace: "Make one simple plan, then stop refining it for a set period of time.",
  expandedReflection:
    "Your growth begins when action is no longer driven by fear of instability. Peace grows when structure serves trust rather than replacing it.",
},

"Prosperity|Please|Internal": {
  profileName: "The Quiet Security Keeper",
  baseName: "Security Keeper",
  description:
    "You tend to lose peace when belonging, comfort, or stability feels fragile. Under pressure, you quietly maintain calm, avoid disruption, and adjust yourself to preserve emotional security.",
  strengths: ["Calming", "Considerate", "Steady", "Aware of emotional safety", "Reduces unnecessary tension"],
  harder: ["Avoiding truth", "Carrying discomfort privately", "Keeping peace instead of making peace", "Protecting comfort over honesty", "Staying silent too long"],
  othersExperience:
    "Others may experience you as calming and considerate, but they may not know when something important is being left unsaid.",
  wayOfPeace: "Practice truth that repairs instead of comfort that avoids.",
  internalPractice: "Ask, “Am I keeping peace or making peace?”",
  relationalPractice: "Name one gentle truth instead of quietly absorbing discomfort.",
  stepOfPeace: "Bring one honest but calming sentence into a conversation you would normally avoid.",
  expandedReflection:
    "Your growth begins when stability becomes strong enough to hold honesty. Peace grows when comfort no longer requires silence.",
},

"Prosperity|Please|External": {
  profileName: "The Relational Security Keeper",
  baseName: "Security Keeper",
  description:
    "You tend to lose peace when environments feel tense, unstable, or emotionally unsafe. Under pressure, you move outward to calm people, preserve comfort, and keep the relational atmosphere steady.",
  strengths: ["Hospitable", "Calming", "Emotionally steady", "Reduces escalation", "Creates safety"],
  harder: ["Smoothing over what needs repair", "Managing tension without addressing causes", "Avoiding truth", "Carrying responsibility for everyone feeling okay", "Mistaking calm for peace"],
  othersExperience:
    "Others may experience you as calming, steady, and considerate, but they may also sense when important truth is being softened or avoided.",
  wayOfPeace: "Practice calm truth instead of tension management.",
  internalPractice: "Ask, “What truth needs to be spoken gently here?”",
  relationalPractice: "Help people stay calm while naming what needs attention.",
  stepOfPeace: "In one tense situation, name the issue without rushing to smooth it over.",
  expandedReflection:
    "Your growth begins when calm becomes courageous. Peace grows when you create environments where people can be honest without panic and steady without avoidance.",
},

"Prosperity|PullAway|Internal": {
  profileName: "The Quiet Protector",
  baseName: "Protector",
  description:
    "You tend to lose peace when life feels overwhelming, demanding, uncertain, or unsafe. Under pressure, you retreat inwardly, conserve energy, and create internal distance until things feel more manageable.",
  strengths: ["Steady", "Measured", "Thoughtful", "Able to avoid escalation", "Aware of limits"],
  harder: ["Withdrawing instead of engaging", "Avoiding needed conversations", "Mistaking comfort for peace", "Staying quiet when your voice is needed", "Becoming disconnected"],
  othersExperience:
    "Others may experience you as calm and thoughtful, but they may also feel distance when you retreat.",
  wayOfPeace: "Practice presence instead of private protection.",
  internalPractice: "Pause and ask, “What feels unsafe right now?”",
  relationalPractice: "Tell one trusted person when you are overwhelmed instead of silently disappearing.",
  stepOfPeace: "Identify one place where you have been retreating and take one small step toward engagement.",
  expandedReflection:
    "Your growth begins when peace becomes more than distance from pressure. Peace grows when you stay present in small, sustainable ways.",
},

"Prosperity|PullAway|External": {
  profileName: "The Guarded Retreater",
  baseName: "Protector",
  description:
    "You tend to lose peace when stress, instability, or demand rises too high. Under pressure, you visibly disengage, distance yourself, avoid risk, or withdraw from situations that feel unsafe or draining.",
  strengths: ["Measured", "Aware of pressure", "Able to create space", "Avoids unnecessary escalation", "Can slow reactive environments"],
  harder: ["Disengaging without explaining", "Avoiding repair", "Protecting comfort over connection", "Leaving others shut out", "Letting withdrawal define safety"],
  othersExperience:
    "Others may experience you as calm and measured, but they may also feel confused, dismissed, or distanced when you pull away.",
  wayOfPeace: "Practice returning instead of retreating.",
  internalPractice: "Ask, “Am I creating healthy space, or avoiding needed engagement?”",
  relationalPractice: "Explain your need for space while staying connected to the relationship.",
  stepOfPeace: "Say, “I need a little space, but I want to return to this conversation.”",
  expandedReflection:
    "Your growth begins when distance becomes intentional rather than protective disappearance. Peace grows when you can take space and still return.",
},
};