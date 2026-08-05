export const site = {
  name: 'Kristen Bestavros',
  role: 'MS Data Science · Boston University',
  location: 'Boston, MA',
  email: 'kbest@bu.edu',
  github: 'https://github.com/kristenbestavros',
  linkedin: 'https://www.linkedin.com/in/kristen-bestavros',
  // Drop a real photo in public/ and point this at it (a square JPG or PNG
  // around 600x600 is plenty — it renders as a circle).
  portrait: '/portrait.jpg',
  portraitAlt: 'Kristen Bestavros',
  // Used for <title> and meta description only; not displayed as a headline.
  metaDescription:
    "Kristen Bestavros — master's student at Boston University's Center for Computing and Data Sciences, working on AI safety, red-teaming, and computational social science.",
  // Off by default: an empty Writing page reads worse than no Writing page.
  showWriting: false,
};

// Sidebar navigation. Section anchors resolve to the homepage from any page.
export const nav = [
  { href: '/#about', label: 'About me', section: 'about' },
  { href: '/#experience', label: 'Experience', section: 'experience' },
  { href: '/#projects', label: 'Projects', section: 'projects' },
  { href: '/#writing-published', label: 'Published work', section: 'writing-published' },
  { href: '/#elsewhere', label: 'Hobbies & Interests', section: 'elsewhere' },
];

export const pageNav = [
  { href: '/work', label: 'All work' },
  { href: '/cv', label: 'CV' },
];

// Intro paragraphs. These are yours — edit freely.
export const intro = [
  `Hello there! My name is Kristen Bestavros, and I'm currently a master's student 
   at the Center for Computing and Data Sciences at Boston University. As a data scientist,
   I'm passionate about using computational methods to understand people, systems, and
   society. My work bridges machine learning, ethics, and the social sciences, focusing
   on how data and algorithms shape the world we live in. My current interests are in
   AI safety, with a particular emphasis on red-teaming and novel safety training strategies.`,
  `As an undergraduate I studied a wide variety of data science topics and
   pursued a minor in statistics, so I have a strong foundational understanding
   of the mathematics behind the methods and tools I use. In my senior year, as
   part of the Kilachand Honors College curriculum, I completed my keystone
   project on simulating political polarization with an agent-based model. Since
   then I've worked on a range of projects, including data analysis for CHAPA, an
   affordable housing nonprofit based in Massachusetts. I've also been working on personal
   projects, ranging from a name anagram generator to an automated adversarial safety training
   loop for LLMs. You can read more about my work in the Projects section below -- you can even
   try out the anagram generator in your browser!`,
];

// Three compact areas shown as pills under the intro.
export const strands = [
  {
    label: 'AI safety',
    text: 'Adversarial robustness, automated red-teaming, and novel safety training strategies.',
  },
  {
    label: 'Social simulation',
    text: 'Agent-based models of how beliefs form, spread, and polarize across a population.',
  },
  {
    label: 'Applied data work',
    text: 'Statistical and geospatial analysis for a client organization.',
  },
];

export const experience = [
  {
    period: 'Fall 2025 — present',
    role: 'Teaching Assistant: Data, Society, and AI Ethics',
    org: 'BU Center for Computing and Data Sciences',
    points: [
      'Facilitate discussion sections on fairness and bias in ML systems, value alignment, automated decision-making, and the policy dimensions of AI deployment.',
      'Mentor students on ethical reasoning, evaluate essays, and co-develop interactive course materials.',
    ],
    tags: ['AI ethics', 'teaching'],
  },
  {
    period: 'May 2024 — May 2025',
    role: 'Computational Social Science Intern',
    org: 'BU Center for Computing and Data Sciences · Prof. Wesley Wildman',
    points: [
      'Developed agent-based simulations modeling how ideological beliefs form, spread, and polarize within populations, drawing on social psychology and cognitive science.',
      'Produced a literature review published in Acta Sociologica analyzing ideological dynamics in Norway, 2014–2023.',
    ],
    tags: ['agent-based modeling', 'research'],
  },
  {
    period: 'Sep 2021 — Aug 2022',
    role: 'UROP Student Researcher',
    org: 'BU Department of Physics · Prof. David Campbell',
    points: [
      'Conducted computational research on nonlinear dynamical systems (the Fermi–Pasta–Ulam–Tsingou problem).',
      "Wrote Bash tooling for parallel computation on BU's shared computing cluster.",
    ],
    tags: ['nonlinear dynamics', 'HPC'],
  },
];

export const education = [
  {
    period: 'Expected May 2027',
    degree: 'MS, Data Science',
    org: 'Boston University',
    detail: 'Deep Learning; Theory and Applications of Large Language Models; Stochastic Methods',
  },
  {
    period: 'May 2025',
    degree: 'BS, Data Science — Minor in Statistics',
    org: 'Boston University, Kilachand Honors College',
    detail: 'Machine Learning; Reinforcement Learning; Algorithms; Data Science Ethics',
  },
];

export const personal = [`In my free time, I enjoy creative writing, primarily in the fantasy, magical realism, and mystery genres. I love cross-genre storytelling and nonlinear narratives,
and I occasionally experiment with these in my own writing. I also love collaborative storytelling in the form of D&D, which I play regularly with my friends.`,
`Video gaming is another hobby of mine. I play and enjoy video games of all kinds, from roguelikes 
to strategy games to souls-like games, but I have a particular fondness for narrative-driven open 
world RPGs and puzzle games. A few of my favorite games include Horizon: Zero Dawn, Dragon Age: Inquisition, and more recently, Blue Prince. The next game I play will be Clair Obscur: Expedition 33.`,
`I love brain teasers of all kinds, and have a large collection of mechanical puzzles.`];

export type Project = {
  slug: string;
  title: string;
  meta: string; // gutter marker: when + where. Real metadata, not decoration.
  blurb: string;
  tags: string[];
  href?: string; // internal detail page
  repo?: string;
  featured: boolean;
};

export const projects: Project[] = [
  {
    slug: 'adversarial-safety',
    title: 'Adversarial LLM safety training',
    meta: '2026 · BU CDS',
    blurb:
      'A co-evolutionary red-teaming pipeline for LLM safety training which tests different defender strategies and safety evaluators against evolving jailbreak attempts generated by an adaptive attacker LLM.',
    tags: ['LoRA', 'red-teaming', 'evaluator models', 'PyTorch', 'transformers', 'LLMs', 'research'],
    href: '/work/adversarial-safety',
    featured: true,
  },
  {
    slug: 'anagrammer',
    title: 'Anagrammer',
    meta: '2026 · personal',
    blurb:
      'Rearranges any phrase into plausible names using every letter exactly once. A trigram model trained on 106,000 real names, phonotactic pronounceability rules, ten name templates, and composite scoring. The full pipeline runs in your browser on the page.',
    tags: ['Markov models', 'phonotactics', 'search', 'Python', 'JavaScript'],
    href: '/work/anagrammer',
    repo: 'https://github.com/kristenbestavros/anagrammer',
    featured: true,
  },
  {
    slug: 'polarization',
    title: 'The Persuasion Equation',
    meta: '2025 · Kilachand Honors',
    blurb:
      'An agent-based model simulating the interplay of personality and message factors in political polarization, built on the cognitive\u2013motivational framework of Jost et al. Keystone project, presented at the Kilachand Keystone Symposium.',
    tags: ['agent-based modeling', 'social simulation', 'AnyLogic'],
    href: '/work/polarization',
    featured: true,
  },
  {
    slug: 'chapa',
    title: 'Affordable housing access',
    meta: '2025 · CHAPA / BU Spark!',
    blurb:
      'As part of a collaboration with CHAPA and BU Spark!, this group project aimed to analyze property data and provide insights about applicant demographics. My primary contribution to the project was an interactive map of affordable housing applications across Massachusetts, showing applicant flow lines, demographic breakdowns, and more.',
    tags: ['Folium', 'Leaflet', 'geospatial', 'client work'],
    href: '/work/chapa',
    featured: true,
  },
];

export const publications = [
  {
    authors: 'McDonnell Maayan, G., Bestavros, K., & Wildman, W.',
    title: 'Woke/Anti-Woke Dynamics in Norway, 2014–2023',
    venue: 'Acta Sociologica',
    href: 'https://doi.org/10.1177/00016993261432785',
  },
  {
    authors: 'Bestavros, K.',
    title:
      'Deciphering FPUT Metastable State: An Investigation of Resonance in the FPUT Spectra',
    venue: '25th Annual Undergraduate Research Symposium, Boston University (poster)',
  },
  {
    authors: 'Bestavros, K.',
    title: 'Game Development to Gameplay: Women in the Video Game Industry',
    venue: 'Kaleidoscope, vol. 1, 2022',
    href: 'https://www.bu.edu/khc/files/2023/02/Kaleidoscope-Volume-1.pdf',
  },
];

export const essays = [
  {
    slug: 'over-refusal',
    title: 'The cost of teaching a model to say no',
    date: '2026',
    standfirst:
      'Train hard against jailbreaks and you get a model that refuses. Train a little harder and you get a model that refuses everything. Notes on the narrow band in between.',
    draft: true, // set to false once you've written it; drafts are hidden
  },
];
