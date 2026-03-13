import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withCors, requireJwt } from '../_shared/security.ts';
import { withTiming } from '../_shared/telemetry.ts';

// Archetype data
const ARCHETYPES = [
  { id: '1', number: 1, family: 'base', root: 1, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Initiator', secondary_label: 'Pioneer', tertiary_label: 'Spark', emoji: '🔥', essence: 'The pulse of creation — the first movement from idea to action.', expanded_meaning: "The 1 is that inner engine that says \"I'll go first.\" It's the impulse to start a business before the market exists, to speak an unspoken truth in a meeting, to make art before there's an audience. This frequency doesn't wait for permission; it creates momentum by acting. When balanced, 1 energy feels electric but steady — decisive, confident, inspiring. When off, it can look like the founder who burns out chasing ten ideas at once, or the partner who insists on being right instead of being real.", light_expression: ['Grounded confidence', 'decisive motion', 'creative ignition'], shadow_expression: ['Impatience', 'tunnel vision', 'control tendencies'], keywords: ['beginning', 'courage', 'clarity', 'leadership', 'autonomy'], tone_style: 'focused, motivating', color_hex: '#DC2626', ui_motif: 'beam', element: 'Fire', frequency_tone: 'C', common_misunderstanding: 'Starting alone doesn\'t mean staying alone. Real independence creates space for collaboration, not isolation.', daily_practice: 'Pick one idea you\'ve been circling and take a small, visible action today — send the message, make the call, buy the materials.' },
  { id: '2', number: 2, family: 'base', root: 2, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Balancer', secondary_label: 'Mirror', tertiary_label: 'Weaver', emoji: '🌿', essence: 'Harmony through connection; the art of listening life back into rhythm.', expanded_meaning: 'Energy is relational intelligence — it understands that everything lives in conversation. It\'s the friend who mediates a tense room with one calm sentence, the designer who knows when to pause and ask, "How does this feel for everyone?"', light_expression: ['Patient', 'attuned', 'cooperative', 'emotionally intelligent'], shadow_expression: ['People-pleasing', 'indecisive', 'conflict-avoidant'], keywords: ['harmony', 'partnership', 'intuition', 'diplomacy', 'timing'], tone_style: 'calm, empathetic', color_hex: '#16A34A', ui_motif: 'wave', element: 'Water', frequency_tone: 'D', common_misunderstanding: 'Kindness means agreement. Real kindness is honesty delivered gently.', daily_practice: 'Before responding today, take one breath and repeat: "I can care without carrying." Then speak the truth you\'ve been avoiding.' },
  { id: '3', number: 3, family: 'base', root: 3, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Expressor', secondary_label: 'Artist', tertiary_label: 'Muse', emoji: '🎶', essence: 'The joy of expression — giving sound, color, and language to life itself.', expanded_meaning: '3 energy is creative oxygen. It brings ideas into motion, laughter into rooms, and rhythm into communication.', light_expression: ['Playful', 'articulate', 'magnetic', 'joyful', 'encouraging'], shadow_expression: ['Scattered', 'inconsistent', 'avoidant of depth', 'performative'], keywords: ['communication', 'creativity', 'joy', 'story', 'connection'], tone_style: 'bright, uplifting', color_hex: '#EAB308', ui_motif: 'spiral', element: 'Air', frequency_tone: 'E', common_misunderstanding: 'Being expressive means being loud. True expression is about honesty, not volume.', daily_practice: 'Share something you made today — a sentence, a photo, a laugh — without editing for approval.' },
  { id: '4', number: 4, family: 'base', root: 4, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Architect', secondary_label: 'Builder', tertiary_label: 'Strategist', emoji: '🪵', essence: 'Order as freedom — stability as the soil where vision takes root.', expanded_meaning: '4 energy is the frequency of form. It\'s the engineer drafting the bridge, the parent who keeps the household rhythm steady.', light_expression: ['Reliable', 'organized', 'disciplined', 'trustworthy', 'methodical'], shadow_expression: ['Controlling', 'pessimistic', 'fearful of change', 'overly cautious'], keywords: ['structure', 'discipline', 'stability', 'patience', 'endurance'], tone_style: 'grounded, reassuring', color_hex: '#78716C', ui_motif: 'grid', element: 'Earth', frequency_tone: 'F', common_misunderstanding: 'Control equals safety. Real safety is flexibility within structure.', daily_practice: 'Bring order to one small corner of your world today — your desk, your calendar, your breathing.' },
  { id: '5', number: 5, family: 'base', root: 5, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Wanderer', secondary_label: 'Explorer', tertiary_label: 'Catalyst', emoji: '🌊', essence: 'The movement of change — freedom meeting curiosity.', expanded_meaning: '5 energy is the wind that keeps the system alive. It keeps life fresh by refusing stagnation.', light_expression: ['Adaptable', 'adventurous', 'curious', 'innovative', 'expressive'], shadow_expression: ['Restless', 'reckless', 'inconsistent', 'commitment-averse'], keywords: ['freedom', 'change', 'adventure', 'curiosity', 'transformation'], tone_style: 'dynamic, fresh', color_hex: '#06B6D4', ui_motif: 'wave', element: 'Air', frequency_tone: 'G', common_misunderstanding: 'Freedom means absence of limits. Real freedom is the ability to move inside your own boundaries.', daily_practice: 'Switch one routine consciously — take a different route, try a new food, approach a familiar problem from a new angle.' },
  { id: '6', number: 6, family: 'base', root: 6, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Caretaker', secondary_label: 'Healer', tertiary_label: 'Guardian', emoji: '🌷', essence: 'Love as responsibility — harmony through service and beauty.', expanded_meaning: '6 energy is the heartbeat of compassion. It\'s the friend who checks on everyone after a storm.', light_expression: ['Compassionate', 'loyal', 'graceful', 'supportive', 'artistic'], shadow_expression: ['Over-giving', 'controlling', 'anxious', 'self-neglecting'], keywords: ['nurture', 'harmony', 'responsibility', 'beauty', 'protection'], tone_style: 'warm, reassuring', color_hex: '#EC4899', ui_motif: 'bloom', element: 'Water', frequency_tone: 'A', common_misunderstanding: 'Caring for others means ignoring yourself. Sustainable care begins with self-tending.', daily_practice: 'Do one act of care for yourself before offering it to anyone else.' },
  { id: '7', number: 7, family: 'base', root: 7, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Seeker', secondary_label: 'Mystic', tertiary_label: 'Analyst', emoji: '🔮', essence: 'Stillness reveals truth — wisdom through observation and reflection.', expanded_meaning: '7 energy is the contemplative current — it learns by watching, listening, and sensing what\'s unsaid.', light_expression: ['Insightful', 'discerning', 'intuitive', 'contemplative', 'faithful'], shadow_expression: ['Withdrawn', 'skeptical', 'secretive', 'emotionally distant'], keywords: ['introspection', 'wisdom', 'spirituality', 'analysis', 'discernment'], tone_style: 'serene, introspective', color_hex: '#6366F1', ui_motif: 'spiral', element: 'Ether', frequency_tone: 'B', common_misunderstanding: 'Solitude equals loneliness. True solitude is communion with your own source.', daily_practice: 'Spend ten minutes in silence today — no phone, no music, just observation.' },
  { id: '8', number: 8, family: 'base', root: 8, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Leader', secondary_label: 'Executive', tertiary_label: 'Strategos', emoji: '💎', essence: 'Power with purpose — mastery through stewardship and integrity.', expanded_meaning: '8 energy is the architecture of influence. It\'s the entrepreneur who builds a company that empowers others.', light_expression: ['Disciplined', 'visionary', 'dependable', 'commanding', 'protective'], shadow_expression: ['Controlling', 'materialistic', 'impatient', 'dominating'], keywords: ['authority', 'integrity', 'discipline', 'success', 'stewardship'], tone_style: 'commanding, steady', color_hex: '#1E293B', ui_motif: 'beam', element: 'Earth', frequency_tone: 'C#', common_misunderstanding: 'Power means control. Real mastery is guiding energy, not gripping it.', daily_practice: 'Identify one decision you\'ve been avoiding and make it cleanly.' },
  { id: '9', number: 9, family: 'base', root: 9, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Humanitarian', secondary_label: 'Sage', tertiary_label: 'Finisher', emoji: '🌹', essence: 'Release to renew — compassion as completion.', expanded_meaning: '9 energy is the integrator — the frequency of endings that become beginnings.', light_expression: ['Empathetic', 'wise', 'forgiving', 'inspiring', 'expansive'], shadow_expression: ['Martyr', 'sentimental', 'rescuing', 'avoidant of closure'], keywords: ['completion', 'compassion', 'release', 'service', 'wisdom'], tone_style: 'wise, soothing', color_hex: '#BE123C', ui_motif: 'spiral', element: 'Fire', frequency_tone: 'D#', common_misunderstanding: 'Holding on shows love. Real love lets life evolve; endings are sacred forms of care.', daily_practice: 'Choose one situation that\'s lingering and consciously complete it.' },
  { id: '11', number: 11, family: 'master', root: 2, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Visionary', secondary_label: 'Channel', tertiary_label: 'Illuminator', emoji: '💫', essence: 'Intuition as transmission — awareness that lights the way for others.', expanded_meaning: '11 energy is heightened perception — the bridge between imagination and manifestation.', light_expression: ['Inspired', 'perceptive', 'creative', 'compassionate', 'visionary'], shadow_expression: ['Overwhelmed', 'hypersensitive', 'ungrounded', 'self-doubting'], keywords: ['intuition', 'insight', 'inspiration', 'awareness', 'empathy'], tone_style: 'ethereal but practical', color_hex: '#8B5CF6', ui_motif: 'aura', element: 'Ether', frequency_tone: 'F#', common_misunderstanding: 'Intuition replaces discipline. In truth, intuition thrives inside structure.', daily_practice: 'Capture one intuitive flash and give it structure — write it down, sketch it, or speak it aloud.' },
  { id: '22', number: 22, family: 'master', root: 4, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Master Builder', secondary_label: 'Engineer', tertiary_label: 'Architect of Vision', emoji: '🏛️', essence: 'Vision engineered into reality — sacred architecture in motion.', expanded_meaning: '22 energy is the alchemy of dream and discipline. It manifests big visions through deliberate, patient craftsmanship.', light_expression: ['Disciplined', 'visionary', 'methodical', 'reliable', 'inspiring through example'], shadow_expression: ['Perfectionistic', 'rigid', 'fearful of failure', 'over-controlling'], keywords: ['manifestation', 'legacy', 'structure', 'stewardship', 'patience'], tone_style: 'grounded-visionary, precise', color_hex: '#475569', ui_motif: 'grid', element: 'Earth', frequency_tone: 'G#', common_misunderstanding: 'Greatness demands doing everything alone. True building happens through collaboration.', daily_practice: 'Choose one lofty goal and break it into a single, concrete step. Lay one brick today.' },
  { id: '33', number: 33, family: 'master', root: 6, modes: ['CCM', 'AMM', 'OCM'], primary_label: 'Master Healer', secondary_label: 'Teacher', tertiary_label: 'Radiant', emoji: '🌞', essence: 'Compassion in action — love made practical and powerful.', expanded_meaning: '33 energy is the vibration of embodied compassion. It moves through service, reminding others that love is applied awareness.', light_expression: ['Loving', 'wise', 'patient', 'inspiring', 'generous'], shadow_expression: ['Martyr', 'over-giver', 'controlling through care', 'emotionally exhausted'], keywords: ['healing', 'compassion', 'teaching', 'radiance', 'service'], tone_style: 'devotional, radiant', color_hex: '#F59E0B', ui_motif: 'bloom', element: 'Water', frequency_tone: 'A#', common_misunderstanding: 'Love means fixing. Real love holds space for others to heal themselves.', daily_practice: 'Offer one small act of kindness that nourishes you as much as the receiver.' }
];

// Evolution paths data
const EVOLUTION_PATHS = [
  { from_number: 1, to_number: 2, path_type: 'adjacent', description: 'Develop empathy; balance assertion with listening' },
  { from_number: 1, to_number: 4, path_type: 'adjacent', description: 'Build consistency and structure to sustain your fire' },
  { from_number: 1, to_number: 5, path_type: 'adjacent', description: 'Learn adaptability; allow curiosity to shape evolution' },
  { from_number: 1, to_number: 8, path_type: 'challenge', description: 'Refine authority through integrity — lead by resonance, not pressure' },
  { from_number: 2, to_number: 1, path_type: 'adjacent', description: 'Cultivate assertive clarity and decisive action' },
  { from_number: 2, to_number: 3, path_type: 'adjacent', description: 'Express yourself creatively and authentically' },
  { from_number: 2, to_number: 6, path_type: 'adjacent', description: 'Balance care with healthy boundaries' },
  { from_number: 2, to_number: 7, path_type: 'challenge', description: 'Develop inner stillness and contemplative depth' },
  { from_number: 3, to_number: 2, path_type: 'adjacent', description: 'Deepen listening skills and emotional attunement' },
  { from_number: 3, to_number: 4, path_type: 'adjacent', description: 'Add structure and discipline to creative expression' },
  { from_number: 3, to_number: 5, path_type: 'adjacent', description: 'Embrace experimentation and creative risk-taking' },
  { from_number: 3, to_number: 6, path_type: 'challenge', description: 'Channel expression into service and nurturing' },
  { from_number: 4, to_number: 1, path_type: 'adjacent', description: 'Develop decisive leadership and bold action' },
  { from_number: 4, to_number: 3, path_type: 'adjacent', description: 'Introduce playfulness and creative flexibility' },
  { from_number: 4, to_number: 8, path_type: 'adjacent', description: 'Expand into visionary stewardship and mastery' },
  { from_number: 4, to_number: 5, path_type: 'challenge', description: 'Learn to flow with change while maintaining stability' },
  { from_number: 5, to_number: 2, path_type: 'adjacent', description: 'Develop emotional attunement and relational awareness' },
  { from_number: 5, to_number: 4, path_type: 'adjacent', description: 'Ground your energy with structure and routine' },
  { from_number: 5, to_number: 7, path_type: 'adjacent', description: 'Cultivate reflective wisdom and inner knowing' },
  { from_number: 5, to_number: 8, path_type: 'challenge', description: 'Channel freedom into focused leadership' },
  { from_number: 6, to_number: 2, path_type: 'adjacent', description: 'Find balance between giving and receiving' },
  { from_number: 6, to_number: 8, path_type: 'adjacent', description: 'Integrate leadership with compassionate care' },
  { from_number: 6, to_number: 9, path_type: 'adjacent', description: 'Serve without martyrdom; embrace completion' },
  { from_number: 6, to_number: 3, path_type: 'challenge', description: 'Express joy and creativity alongside nurturing' },
  { from_number: 7, to_number: 3, path_type: 'adjacent', description: 'Share your insights through creative expression' },
  { from_number: 7, to_number: 5, path_type: 'adjacent', description: 'Explore with courage; let wisdom guide adventure' },
  { from_number: 7, to_number: 9, path_type: 'adjacent', description: 'Integrate compassion into your pursuit of truth' },
  { from_number: 7, to_number: 1, path_type: 'challenge', description: 'Move from contemplation into decisive action' },
  { from_number: 8, to_number: 2, path_type: 'adjacent', description: 'Develop relational wisdom and empathetic leadership' },
  { from_number: 8, to_number: 4, path_type: 'adjacent', description: 'Build sustainable systems and structures' },
  { from_number: 8, to_number: 9, path_type: 'adjacent', description: 'Lead with purpose beyond personal gain' },
  { from_number: 8, to_number: 6, path_type: 'challenge', description: 'Soften authority with compassionate care' },
  { from_number: 9, to_number: 6, path_type: 'adjacent', description: 'Practice healthy care without self-sacrifice' },
  { from_number: 9, to_number: 7, path_type: 'adjacent', description: 'Develop discernment in your service' },
  { from_number: 9, to_number: 1, path_type: 'adjacent', description: 'Make clean new starts; release the old with grace' },
  { from_number: 9, to_number: 3, path_type: 'challenge', description: 'Find joy and lightness in your wisdom' },
  { from_number: 11, to_number: 1, path_type: 'adjacent', description: 'Ground visionary insight into decisive action' },
  { from_number: 11, to_number: 2, path_type: 'adjacent', description: 'Deepen empathetic resonance and relational wisdom' },
  { from_number: 11, to_number: 22, path_type: 'adjacent', description: 'Transform inspiration into tangible manifestation' },
  { from_number: 22, to_number: 4, path_type: 'adjacent', description: 'Master the fundamentals of structure and discipline' },
  { from_number: 22, to_number: 8, path_type: 'adjacent', description: 'Integrate visionary architecture with executive mastery' },
  { from_number: 22, to_number: 33, path_type: 'adjacent', description: 'Infuse your creations with compassionate purpose' },
  { from_number: 33, to_number: 6, path_type: 'adjacent', description: 'Return to the heart of nurturing and care' },
  { from_number: 33, to_number: 9, path_type: 'adjacent', description: 'Embrace completion and wise release' },
  { from_number: 33, to_number: 11, path_type: 'adjacent', description: 'Channel healing wisdom into visionary insight' }
];

// Keystone actions data
const KEYSTONE_ACTIONS = [
  { archetype_number: 1, action: 'Launch one small, intentional project — start with awareness', xp_value: 5, category: 'creation' },
  { archetype_number: 1, action: 'Facilitate a group decision using questions instead of commands', xp_value: 4, category: 'leadership' },
  { archetype_number: 1, action: 'Journal: Did I move from impulse or clarity today?', xp_value: 2, category: 'reflection' },
  { archetype_number: 1, action: 'Practice grounding breath before taking action', xp_value: 2, category: 'ritual' },
  { archetype_number: 2, action: 'Speak a hard truth with compassion', xp_value: 5, category: 'communication' },
  { archetype_number: 2, action: 'Spend a day consciously balancing "yes" and "no"', xp_value: 4, category: 'boundaries' },
  { archetype_number: 2, action: 'Mediate a small conflict with presence', xp_value: 4, category: 'service' },
  { archetype_number: 2, action: 'Listen to someone without offering solutions', xp_value: 3, category: 'empathy' },
  { archetype_number: 3, action: 'Create and share something without editing for approval', xp_value: 5, category: 'creation' },
  { archetype_number: 3, action: 'Turn a difficult conversation into collaborative dialogue', xp_value: 4, category: 'communication' },
  { archetype_number: 3, action: 'Complete one creative project you\'ve been avoiding', xp_value: 4, category: 'discipline' },
  { archetype_number: 3, action: 'Journal about what you truly want to express', xp_value: 2, category: 'reflection' },
  { archetype_number: 4, action: 'Organize one area of chaos into sustainable structure', xp_value: 5, category: 'organization' },
  { archetype_number: 4, action: 'Build a new helpful routine and maintain it for 7 days', xp_value: 5, category: 'discipline' },
  { archetype_number: 4, action: 'Create a clear plan for a long-term goal', xp_value: 4, category: 'strategy' },
  { archetype_number: 4, action: 'Practice flexibility within your structure', xp_value: 3, category: 'growth' },
  { archetype_number: 5, action: 'Consciously change one routine and observe the impact', xp_value: 4, category: 'exploration' },
  { archetype_number: 5, action: 'Try something completely new with beginner\'s mind', xp_value: 4, category: 'courage' },
  { archetype_number: 5, action: 'Approach a familiar problem from a new angle', xp_value: 3, category: 'innovation' },
  { archetype_number: 5, action: 'Journal about what freedom means to you today', xp_value: 2, category: 'reflection' },
  { archetype_number: 6, action: 'Care for yourself before caring for others', xp_value: 5, category: 'self-care' },
  { archetype_number: 6, action: 'Set a compassionate boundary with someone', xp_value: 4, category: 'boundaries' },
  { archetype_number: 6, action: 'Create beauty in your environment intentionally', xp_value: 3, category: 'service' },
  { archetype_number: 6, action: 'Practice saying no without guilt', xp_value: 3, category: 'empowerment' },
  { archetype_number: 7, action: 'Spend 20 minutes in complete silence and stillness', xp_value: 4, category: 'contemplation' },
  { archetype_number: 7, action: 'Write down one deep insight that emerged today', xp_value: 3, category: 'wisdom' },
  { archetype_number: 7, action: 'Study something that fascinates you with full attention', xp_value: 3, category: 'learning' },
  { archetype_number: 7, action: 'Practice discernment in what information you consume', xp_value: 2, category: 'discipline' },
  { archetype_number: 8, action: 'Make a clear decision you\'ve been avoiding', xp_value: 5, category: 'leadership' },
  { archetype_number: 8, action: 'Delegate a task and trust the process', xp_value: 4, category: 'trust' },
  { archetype_number: 8, action: 'Lead a project with integrity and clear vision', xp_value: 5, category: 'mastery' },
  { archetype_number: 8, action: 'Practice guiding energy instead of controlling it', xp_value: 3, category: 'refinement' },
  { archetype_number: 9, action: 'Complete and release something that\'s been lingering', xp_value: 5, category: 'completion' },
  { archetype_number: 9, action: 'Serve others without needing recognition', xp_value: 4, category: 'service' },
  { archetype_number: 9, action: 'Practice forgiveness — of yourself or another', xp_value: 4, category: 'compassion' },
  { archetype_number: 9, action: 'Let go of something with gratitude', xp_value: 3, category: 'release' },
  { archetype_number: 11, action: 'Capture and structure one intuitive flash', xp_value: 5, category: 'channeling' },
  { archetype_number: 11, action: 'Share an inspired insight with someone who needs it', xp_value: 4, category: 'transmission' },
  { archetype_number: 11, action: 'Ground your vision in one practical action', xp_value: 4, category: 'manifestation' },
  { archetype_number: 11, action: 'Practice being present when overwhelmed', xp_value: 3, category: 'grounding' },
  { archetype_number: 22, action: 'Break one big vision into actionable steps', xp_value: 5, category: 'strategy' },
  { archetype_number: 22, action: 'Build something that will outlast you', xp_value: 6, category: 'legacy' },
  { archetype_number: 22, action: 'Collaborate on a project with shared vision', xp_value: 4, category: 'partnership' },
  { archetype_number: 22, action: 'Practice letting go of perfectionism', xp_value: 3, category: 'growth' },
  { archetype_number: 33, action: 'Offer compassionate support without fixing', xp_value: 5, category: 'healing' },
  { archetype_number: 33, action: 'Teach something you\'ve mastered with humility', xp_value: 5, category: 'teaching' },
  { archetype_number: 33, action: 'Create a practice of embodied self-compassion', xp_value: 4, category: 'self-care' },
  { archetype_number: 33, action: 'Hold space for someone\'s transformation', xp_value: 4, category: 'service' }
];

Deno.serve(
  withCors(
    withTiming(async (req) => {
      const auth = requireJwt(req);
      if (!auth.ok) {
        return auth.response;
      }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting database seeding...');

    // Insert archetypes
    const { data: archetypesData, error: archetypesError } = await supabaseClient
      .from('archetypes')
      .upsert(ARCHETYPES, { onConflict: 'number' });

    if (archetypesError) {
      console.error('Error seeding archetypes:', archetypesError);
      throw archetypesError;
    }

    console.log('Archetypes seeded successfully');

    // Insert evolution paths
    const { data: pathsData, error: pathsError } = await supabaseClient
      .from('evolution_paths')
      .upsert(EVOLUTION_PATHS, { onConflict: 'from_number,to_number', ignoreDuplicates: true });

    if (pathsError) {
      console.error('Error seeding evolution paths:', pathsError);
      throw pathsError;
    }

    console.log('Evolution paths seeded successfully');

    // Insert keystone actions
    const { data: actionsData, error: actionsError } = await supabaseClient
      .from('keystone_actions')
      .insert(KEYSTONE_ACTIONS);

    if (actionsError && actionsError.code !== '23505') { // Ignore duplicate key errors
      console.error('Error seeding keystone actions:', actionsError);
      throw actionsError;
    }

    console.log('Keystone actions seeded successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        counts: {
          archetypes: ARCHETYPES.length,
          evolution_paths: EVOLUTION_PATHS.length,
          keystone_actions: KEYSTONE_ACTIONS.length
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
    })
  )
);
