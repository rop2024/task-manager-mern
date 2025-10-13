// Task Creation Thinking Prompts
// Categorized by mood and context to help users overcome blank page syndrome

export const PROMPT_CATEGORIES = {
  CREATIVE: {
    id: 'creative',
    name: 'Creative & Growth',
    icon: '✨',
    color: 'purple',
    description: 'For learning, exploring, and creative pursuits'
  },
  FOCUS: {
    id: 'focus',
    name: 'Focus & Priority',
    icon: '🎯',
    color: 'blue',
    description: 'For important and goal-aligned tasks'
  },
  PROGRESS: {
    id: 'progress',
    name: 'Progress & Action',
    icon: '🚀',
    color: 'green',
    description: 'For moving projects forward'
  },
  CLEANUP: {
    id: 'cleanup',
    name: 'Cleanup & Maintenance',
    icon: '🧹',
    color: 'orange',
    description: 'For organizing and completing neglected items'
  },
  REFLECTION: {
    id: 'reflection',
    name: 'Reflection & Emotional',
    icon: '💬',
    color: 'pink',
    description: 'For addressing stress and emotional blockers'
  },
  SYSTEM: {
    id: 'system',
    name: 'System & Automation',
    icon: '⚙️',
    color: 'gray',
    description: 'For developers and system optimizers'
  },
  GENERAL: {
    id: 'general',
    name: 'General Thinking',
    icon: '💭',
    color: 'indigo',
    description: 'Broad prompts for any situation'
  }
};

export const TASK_PROMPTS = {
  [PROMPT_CATEGORIES.GENERAL.id]: [
    "What's one thing you've been meaning to start but haven't yet?",
    "What's waiting on you to take the first step?",
    "If you had 30 minutes of clear focus right now — what would you tackle?",
    "What's something that would make your day feel more complete if you got it done?",
    "What's one unfinished thing that's slightly bothering you?",
    "What would you regret not doing today if you had the chance?",
    "What's been on your mind that you could actually do something about?",
    "If you could check one thing off your list right now, what would it be?"
  ],

  [PROMPT_CATEGORIES.PROGRESS.id]: [
    "What could you do today that moves a project forward, even a little?",
    "What's blocking progress on something you care about?",
    "What's a small win you can create in the next hour?",
    "What would make tomorrow easier if you did it now?",
    "What's the next logical step for your current goal?",
    "What milestone are you closest to reaching?",
    "What's one action that would create momentum?",
    "What project needs just one more push to cross the finish line?"
  ],

  [PROMPT_CATEGORIES.CLEANUP.id]: [
    "What's been sitting around too long and needs closure?",
    "What do you keep postponing even though it would take less than 10 minutes?",
    "Is there a task you could simplify or remove entirely?",
    "What part of your workspace, system, or schedule feels cluttered right now?",
    "What's something you could organize once and benefit from repeatedly?",
    "What small maintenance task would prevent a bigger problem later?",
    "What's overdue for a refresh or update?",
    "What would make your environment more conducive to productivity?"
  ],

  [PROMPT_CATEGORIES.FOCUS.id]: [
    "If you could only do one thing today, what would it be?",
    "What's urgent but not important — can you delegate or skip it?",
    "What's important but keeps getting ignored?",
    "What's one task that aligns most with your current goal?",
    "What would have the biggest impact on your week if completed?",
    "What's essential versus what's just nice to have?",
    "What deserves your best energy and attention right now?",
    "What would you prioritize if you had half the time you think you have?"
  ],

  [PROMPT_CATEGORIES.CREATIVE.id]: [
    "What's something new you'd like to learn or try this week?",
    "What's an experiment that could make your workflow smoother?",
    "Is there a skill or idea you've been curious about but haven't scheduled time for?",
    "What project idea excites you most right now?",
    "What creative challenge would stretch you in a good way?",
    "What would you create if you knew no one would judge it?",
    "What's a fun side project you could start with just 15 minutes?",
    "What would you explore if failure wasn't a concern?"
  ],

  [PROMPT_CATEGORIES.REFLECTION.id]: [
    "What task would remove a source of stress if you finished it?",
    "What's making you feel stuck — and what's one step out of it?",
    "Is there anything you promised yourself you'd do but forgot?",
    "What are you avoiding because it feels too big? Break it down.",
    "What would give you peace of mind if it was handled?",
    "What conversation are you avoiding that needs to happen?",
    "What commitment are you not honoring to yourself?",
    "What would make you feel more in control of your situation?"
  ],

  [PROMPT_CATEGORIES.SYSTEM.id]: [
    "What's one repetitive thing you could automate?",
    "Is there a script or feature idea that would save you time daily?",
    "What's one piece of your system that could be optimized this week?",
    "What's broken that you could fix in under 30 minutes?",
    "What process could be streamlined with a simple tool or shortcut?",
    "What manual task makes you think 'there has to be a better way'?",
    "What would make your development environment more efficient?",
    "What's a small improvement that would compound over time?"
  ]
};

// Utility functions for prompt management
export const getRandomPrompt = (categoryId = null) => {
  if (categoryId && TASK_PROMPTS[categoryId]) {
    const prompts = TASK_PROMPTS[categoryId];
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
  
  // Get random prompt from any category
  const allPrompts = Object.values(TASK_PROMPTS).flat();
  return allPrompts[Math.floor(Math.random() * allPrompts.length)];
};

export const getPromptsByCategory = (categoryId) => {
  return TASK_PROMPTS[categoryId] || [];
};

export const getAllCategories = () => {
  return Object.values(PROMPT_CATEGORIES);
};

export const getCategoryById = (categoryId) => {
  return PROMPT_CATEGORIES[categoryId] || null;
};

// Get mixed prompts for variety (2 prompts from different categories)
export const getMixedPrompts = () => {
  const categories = Object.keys(TASK_PROMPTS);
  const shuffledCategories = categories.sort(() => 0.5 - Math.random());
  
  return [
    getRandomPrompt(shuffledCategories[0]),
    getRandomPrompt(shuffledCategories[1])
  ];
};