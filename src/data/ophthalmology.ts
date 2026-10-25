import type { Ask, Chapter, Tier, Topic } from '../lib/types';

// Source: "Ophthalmology PYQ — Chapter-wise High-Yield Checklist"
// (MBBS Final Theory, 286 questions, BS 2052 – 2081/07). Years are Bikram Sambat as printed.

export const DECK = {
  id: 'ophthalmology-pyq',
  name: 'Ophthalmology PYQ',
  totalQuestions: 286,
};

export const CHAPTERS: Chapter[] = [
  { no: 1, name: 'Retina & Vitreous', qs: 39, color: '#FFC8DD' },
  { no: 2, name: 'Glaucoma', qs: 31, color: '#BDE0FE' },
  { no: 3, name: 'Cornea & Sclera', qs: 31, color: '#B8F2D9' },
  { no: 4, name: 'Conjunctiva', qs: 25, color: '#FFF1A8' },
  { no: 5, name: 'Uveal Tract (Uveitis)', qs: 20, color: '#D9C8FF' },
  { no: 6, name: 'Refraction & Vision', qs: 19, color: '#FFD3B6' },
  { no: 7, name: 'Neuro-Ophthalmology', qs: 16, color: '#D4F5A8' },
  { no: 8, name: 'Orbit', qs: 15, color: '#A8E6E2' },
  { no: 9, name: 'Ocular Injuries', qs: 14, color: '#FFB5A7' },
  { no: 10, name: 'Community Ophthalmology', qs: 14, color: '#F5D0FE' },
  { no: 11, name: 'Lens (Cataract)', qs: 12, color: '#E9DCC3' },
  { no: 12, name: 'Squint & Ocular Motility', qs: 10, color: '#C9F2C7' },
  { no: 13, name: 'Lids', qs: 10, color: '#FFE0A3' },
  { no: 14, name: 'Lacrimal Apparatus', qs: 5, color: '#C6D8FF' },
  { no: 15, name: 'Ocular Pharmacology', qs: 5, color: '#FFD6E8' },
  { no: 16, name: 'Systemic Ophthalmology & Misc', qs: 4, color: '#DDEFD0' },
  { no: 17, name: 'Symptom-Based Questions', qs: 42, color: '#FDF3C0', symptom: true },
];

type RawAsk = [text: string, count: number, years: string];

function topic(
  id: string,
  chapter: number,
  tier: Tier,
  qs: number,
  title: string,
  short: string,
  asks: RawAsk[],
): Topic {
  return {
    id,
    chapter,
    tier,
    qs,
    title,
    short,
    asks: asks.map(([text, count, years]): Ask => ({ text, count, years })),
  };
}

export const TOPICS: Topic[] = [
  // ── Chapter 1: Retina & Vitreous ──
  topic('diabetic-retinopathy', 1, 'vhigh', 21, 'Diabetic Retinopathy / Diabetes & Eye', 'Diabetic Retinopathy', [
    ['Proliferative DR (PDR) — short note / features / diagnostic features', 4, '2075/8, 2069, 2068/11, 2065'],
    ['Classification / grading of diabetic retinopathy', 4, '2081/7, 2080/7, 2078/8, 2071/8'],
    ['Management of diabetic retinopathy', 4, '2081/7, 2080/7, 2071/8, 2055 S'],
    ['Ocular complications / manifestations of diabetes mellitus (± manage one)', 4, '2081/7, 2078/8, 2071/3, 2057'],
    ['Pathogenesis / etiopathogenesis of DR', 4, '2072 S, 2067/9, 2061 S, 2052'],
    ['Clinical features of DR', 3, '2067/9, 2055 S, 2052'],
    ['Short note: Diabetic retinopathy / Diabetes and eye', 3, '2060, 2059, 2054'],
    ['Asked together with: causes of gradual painless loss of vision', 2, '2080/7, 2071/8'],
    ['PDR — pathogenesis & management', 1, '2073/8'],
    ['PDR & its complications leading to blindness', 1, '2071/3'],
    ['Non-proliferative DR (NPDR) — short note', 1, '2070/4'],
    ['Diabetic maculopathy — etiopathogenesis, features, management', 1, '2068 S'],
    ['Role of LASER therapy in DR', 1, '2067/9'],
    ['Define diabetic retinopathy', 1, '2061 S'],
  ]),
  topic('retinoblastoma', 1, 'high', 8, 'Retinoblastoma', 'Retinoblastoma', [
    ['Clinical features / clinical presentation / modes of presentation', 5, '2081/7, 2072 S, 2066 S, 2065, 2064'],
    ['CASE: child (2–3 yr) with white pupillary reflex — DD / management', 2, '2069/11, 2054'],
    ['Diagnosis', 1, '2065'],
    ['Enumerate neoplastic conditions of the eye', 1, '2065'],
    ['Counselling the parents', 1, '2066 S'],
    ['Histopathological features', 1, '2055 S'],
  ]),
  topic('hypertensive-retinopathy', 1, 'moderate', 3, 'Hypertensive Retinopathy', 'Hypertensive Retino.', [
    ['Retinal changes in hypertension', 2, '2064 S, 2062'],
    ['Short note: Hypertensive retinopathy', 1, '2067 S'],
  ]),
  topic('armd', 1, 'moderate', 3, 'Age-Related Macular Degeneration (ARMD)', 'ARMD', [
    ['Short note: ARMD', 2, '2072/8, 2070/4'],
    ['Clinical features & management', 1, '2067/9'],
  ]),
  topic('retinal-detachment', 1, 'low', 2, 'Retinal Detachment', 'Retinal Detachment', [
    ['Definition & types / classification', 2, '2078/8, 2074/7'],
    ['Signs, symptoms & management', 1, '2074/7'],
  ]),
  topic('crvo', 1, 'low', 1, 'Central Retinal Vein Occlusion (CRVO)', 'CRVO', [
    ['Features, risk factors & treatment (+ enumerate 6 ocular emergencies)', 1, '2076/9'],
  ]),
  topic('vitreous-haemorrhage', 1, 'low', 1, 'Vitreous Haemorrhage', 'Vitreous Haemorrhage', [
    ['Four important causes & how to evaluate', 1, '2058'],
  ]),
  topic('rod', 1, 'low', 1, 'Rod (structure of retina)', 'Rod Structure', [
    ['Draw labelled diagram of a rod', 1, '2068 S'],
  ]),

  // ── Chapter 2: Glaucoma ──
  topic('acute-angle-closure-glaucoma', 2, 'vhigh', 18, 'Acute Angle Closure Glaucoma (PACG / Acute Congestive)', 'Angle Closure Glaucoma', [
    ['Management / treatment', 10, '2081/7, 2079/8, 2074/7, 2073/8, 2072 S, 2070/4, 2069/11, 2066/9, 2062, 2056 S'],
    ['Clinical features', 5, '2081/7, 2079/8, 2072 S, 2070/4, 2061'],
    ['Diagnosis / diagnostic findings', 4, '2079/8, 2073/8, 2072 S, 2070/4'],
    ['CASE: woman with acute pain, redness, blurring ± vomiting/headache, high IOP — diagnosis & management', 4, '2068/11, 2062, 2055, 2053'],
    ['CASE: sudden painful red eye with diminution of vision — causes & management', 2, '2059, 2054 S'],
    ['DD of sudden painful loss of vision (asked with it)', 1, '2081/7'],
    ['Ocular emergency conditions (asked with it)', 1, '2073/8'],
    ['Differentiate from uveitis', 1, '2065 S'],
  ]),
  topic('poag', 2, 'moderate', 7, 'Primary Open Angle Glaucoma (POAG)', 'POAG', [
    ['Visual field changes / defects in POAG', 4, '2069/11, 2068 S, 2056, 2054'],
    ['Clinical features', 2, '2078/8, 2066 S'],
    ['Management', 1, '2078/8'],
    ['Mechanism of action of drugs used', 1, '2068 S'],
    ['Diagnostic criteria', 1, '2069/11'],
    ['Optic nerve head changes in glaucoma', 1, '2063 S'],
    ['Define POAG', 1, '2068 S'],
    ['DD of painless loss of vision (asked with it)', 1, '2078/8'],
  ]),
  topic('glaucoma-definition', 2, 'moderate', 6, 'Glaucoma — Definition & Classification', 'Glaucoma Classification', [
    ['Define glaucoma', 5, '2074/7, 2072 S, 2069/11, 2069/11, 2061'],
    ['Classification of glaucoma', 4, '2074/7, 2069/11, 2069/11, 2065'],
    ['Diagnostic criteria', 1, '2069/11'],
  ]),
  topic('congenital-glaucoma', 2, 'moderate', 5, 'Congenital Glaucoma / Buphthalmos', 'Congenital Glaucoma', [
    ['Clinical features of congenital glaucoma', 2, '2076/9, 2069/11'],
    ['Short note: Buphthalmos', 2, '2063, 2052 S'],
    ['Short note: Congenital glaucoma', 1, '2072/8'],
  ]),

  // ── Chapter 3: Cornea & Sclera ──
  topic('corneal-ulcer', 3, 'vhigh', 19, 'Corneal Ulcer (Bacterial / Infective / Suppurative)', 'Corneal Ulcer', [
    ['Management / principles of treatment', 15, '2081/7, 2079/8, 2075/8, 2073/8, 2072/8, 2071/8, 2071/3, 2070/4, 2069/11, 2067/9, 2066 S, 2065 S, 2063 S, 2056 S, 2053'],
    ['Clinical features', 9, '2081/7, 2079/8, 2075/8, 2072/8, 2071/8, 2071/3, 2069/11, 2063 S, 2056 S'],
    ['Predisposing / risk factors', 7, '2081/7, 2080/7, 2072/8, 2071/8, 2063 S, 2056, 2056 S'],
    ['Diagnosis', 3, '2079/8, 2075/8, 2069/11'],
    ['Etiology', 3, '2079/8, 2063 S, 2056 S'],
    ['Asked with: ocular emergencies list', 2, '2072/8, 2069/11'],
    ['Hypopyon corneal ulcer (etiology, features, diagnosis, treatment)', 1, '2079/8'],
    ['Define corneal ulcer', 1, '2075/8'],
    ['Short note: Corneal ulcer', 1, '2054'],
    ['CASE: 40-yr male, corneal ulcer for 3 weeks — management plan', 1, '2052'],
    ['Asked with: causes of painful red eye', 1, '2071/3'],
  ]),
  topic('cornea-anatomy', 3, 'moderate', 4, 'Anatomy of Cornea & Corneal Transparency', 'Cornea Anatomy', [
    ['Corneal transparency — how cornea remains transparent', 3, '2053, 2052 S, 2052'],
    ['Anatomy / microscopic structure of cornea', 2, '2055, 2052'],
  ]),
  topic('herpes-simplex-keratitis', 3, 'moderate', 3, 'Herpes Simplex Keratitis / Viral Corneal Ulcer', 'Herpes Simplex Keratitis', [
    ['Short note: Herpes simplex keratitis / Herpes simplex virus', 2, '2076/9, 2069 S'],
    ['Clinical features & treatment of viral corneal ulcer', 1, '2058'],
  ]),
  topic('hypopyon', 3, 'low', 2, 'Hypopyon', 'Hypopyon', [
    ['Short note: Hypopyon', 1, '2074/7'],
    ['Hypopyon corneal ulcer', 1, '2079/8'],
  ]),
  topic('episcleritis-scleritis', 3, 'low', 2, 'Episcleritis & Scleritis', 'Episcleritis & Scleritis', [
    ['Short note: Episcleritis', 1, '2067 S'],
    ['Short note: Scleritis', 1, '2056 S'],
  ]),
  topic('hzo', 3, 'low', 1, 'Herpes Zoster Ophthalmicus (HZO)', 'HZO', [
    ['Short note', 1, '2069/11'],
  ]),
  topic('corneal-abrasion', 3, 'low', 1, 'Corneal Abrasion', 'Corneal Abrasion', [
    ['Short note', 1, '2063'],
  ]),

  // ── Chapter 4: Conjunctiva ──
  topic('trachoma', 4, 'high', 10, 'Trachoma', 'Trachoma', [
    ['WHO classification of trachoma', 3, '2075/8, 2073, 2069/11'],
    ['Short note: Trachoma', 3, '2069/11, 2057, 2054'],
    ['What is trachoma — clinical features & treatment', 2, '2065, 2055 S'],
    ['SAFE strategy / treatment & prophylaxis', 2, '2072/8, 2069/11'],
    ['Sequelae of trachoma', 1, '2052 S'],
  ]),
  topic('ophthalmia-neonatorum', 4, 'moderate', 6, 'Ophthalmia Neonatorum', 'Ophthalmia Neonatorum', [
    ['Management (incl. gonococcal conjunctivitis)', 5, '2068 S, 2063, 2061, 2061, 2055 S'],
    ['Short note: Ophthalmia neonatorum', 1, '2057'],
    ['Diagnosis', 1, '2068 S'],
  ]),
  topic('conjunctivitis-types', 4, 'moderate', 6, 'Conjunctivitis — Types & Differentiation', 'Conjunctivitis Types', [
    ['Types / forms of conjunctivitis', 3, '2070/4, 2066/9, 2063 S'],
    ['Differentiate bacterial vs viral conjunctivitis', 3, '2070/4, 2064, 2063 S'],
    ['Management (forms / bacterial in adult / gonococcal)', 3, '2066/9, 2063 S, 2061'],
    ['Diagnosis of forms of conjunctivitis', 1, '2066/9'],
    ['Clinical features of viral conjunctivitis', 1, '2067/9'],
  ]),
  topic('vkc', 4, 'low', 2, 'Vernal Keratoconjunctivitis (VKC)', 'VKC', [
    ['Short note: VKC', 2, '2074/7, 2069/11'],
  ]),
  topic('pterygium', 4, 'low', 1, 'Pterygium', 'Pterygium', [
    ['Short note', 1, '2071/3'],
  ]),
  topic('phlyctenular-conjunctivitis', 4, 'low', 1, 'Phlyctenular Conjunctivitis', 'Phlyctenular Conj.', [
    ['Short note', 1, '2053'],
  ]),

  // ── Chapter 5: Uveal Tract ──
  topic('uveitis', 5, 'vhigh', 20, 'Uveitis / Acute Anterior Uveitis / Iridocyclitis', 'Uveitis', [
    ['Clinical features / clinical findings / signs', 10, '2080/7, 2079/8, 2076/9, 2072 S, 2070/4, 2066 S, 2064 S, 2063, 2062, 2061 S'],
    ['Management / treatment', 7, '2080/7, 2076/9, 2072 S, 2069/11, 2067/9, 2063, 2056'],
    ['Causes / aetiology (incl. causes of uveitis in Nepal)', 5, '2080/7, 2069/11, 2064 S, 2062, 2052'],
    ['Short note: Iridocyclitis', 3, '2078/8, 2066/9, 2063 S'],
    ['Complications', 3, '2079/8, 2076/9, 2070/4'],
    ['Diagnosis / investigation (incl. granulomatous anterior uveitis)', 3, '2072 S, 2069/11, 2064'],
    ['Asked with: causes / DD of painful red eye', 2, '2076/9, 2072 S'],
    ['Anatomical classification of uveitis', 1, '2080/7'],
    ['CASE: 25-yr male, red eye + blurred vision + neck & low back pain — diagnosis & management', 1, '2068/11'],
    ['Differentiate uveitis from angle closure glaucoma', 1, '2065 S'],
  ]),

  // ── Chapter 6: Refraction & Vision ──
  topic('myopia', 6, 'high', 9, 'Myopia', 'Myopia', [
    ['Short note: Myopia', 3, '2074/7, 2054, 2053'],
    ['Pathological / high myopia — clinical features & complications', 3, '2081/7, 2073/8, 2068/11'],
    ['Management / optical correction', 2, '2068/11, 2056'],
    ['Causes & presenting features', 1, '2061'],
    ['Ray diagram of myopia', 1, '2064'],
    ['How common are refractive errors in children', 1, '2068/11'],
  ]),
  topic('hypermetropia', 6, 'moderate', 5, 'Hypermetropia', 'Hypermetropia', [
    ['Short note: Hypermetropia', 3, '2075/8, 2054 S, 2052 S'],
    ['Classification & clinical features', 1, '2079/8'],
    ['Ray diagram of hypermetropia', 1, '2064'],
  ]),
  topic('visual-acuity', 6, 'moderate', 4, 'Visual Acuity', 'Visual Acuity', [
    ['Short note: Visual acuity (incl. its evaluation)', 3, '2071/8, 2063, 2059'],
    ['Define visual acuity', 1, '2064'],
  ]),
  topic('astigmatism', 6, 'low', 1, 'Astigmatism', 'Astigmatism', [['Short note', 1, '2055']]),
  topic('aphakia', 6, 'low', 1, 'Aphakia', 'Aphakia', [['Short note', 1, '2068 S']]),
  topic('visual-fields', 6, 'low', 1, 'Visual Fields', 'Visual Fields', [['Short note', 1, '2063 S']]),

  // ── Chapter 7: Neuro-Ophthalmology ──
  topic('papilloedema', 7, 'moderate', 7, 'Papilloedema & Papillitis', 'Papilloedema', [
    ['Short note: Papilloedema', 3, '2069/11, 2068 S, 2063'],
    ['Define papilloedema', 2, '2064, 2061 S'],
    ['Causes of papilloedema', 2, '2064, 2061 S'],
    ['Clinical features of papilloedema', 2, '2061, 2061 S'],
    ['Differentiating features: papillitis vs papilloedema', 1, '2065'],
  ]),
  topic('cranial-nerve-palsies', 7, 'moderate', 5, 'Cranial Nerve Palsies & Ocular Motor Nerves', 'Cranial Nerve Palsies', [
    ['3rd (oculomotor) nerve palsy — short note', 2, '2080/7, 2076/9'],
    ['6th cranial nerve palsy — short note', 1, '2081/7'],
    ['Course of the third cranial nerve', 1, '2069 S'],
    ['Actions & nerve supply of superior oblique', 1, '2068 S'],
  ]),
  topic('pupil', 7, 'moderate', 3, 'Pupil', 'Pupil', [
    ['Short note: Pupillary reactions', 2, '2064 S, 2060'],
    ['Marcus Gunn pupil — what it is & how to diagnose', 1, '2066 S'],
  ]),
  topic('optic-neuritis', 7, 'low', 2, 'Optic Neuritis', 'Optic Neuritis', [
    ['Short note: Optic neuritis', 1, '2072 S'],
    ['Papillitis vs papilloedema — differentiating features', 1, '2065'],
  ]),
  topic('visual-pathway', 7, 'low', 1, 'Visual Pathway', 'Visual Pathway', [
    ['Draw the pathway of visual fibres', 1, '2068 S'],
  ]),

  // ── Chapter 8: Orbit ──
  topic('orbital-cellulitis', 8, 'high', 8, 'Orbital Cellulitis', 'Orbital Cellulitis', [
    ['Clinical features / clinical findings', 5, '2078/8, 2076/9, 2068/11, 2066 S, 2058'],
    ['Short note: Orbital cellulitis', 3, '2072/8, 2071/8, 2056'],
    ['Complications', 2, '2078/8, 2076/9'],
    ['Treatment / management', 2, '2076/9, 2058'],
    ['Differentiate from preseptal cellulitis', 1, '2068/11'],
    ['Define & classify', 1, '2058'],
    ['DD of proptosis (asked with it)', 1, '2076/9'],
  ]),
  topic('thyroid-eye-disease', 8, 'moderate', 5, 'Thyroid Eye Disease (Dysthyroid Orbitopathy)', 'Thyroid Eye Disease', [
    ['Clinical / ocular features', 4, '2073/8, 2067/9, 2061, 2054'],
    ['Ocular complications', 2, '2073/8, 2065'],
    ['How it leads to visual deterioration', 1, '2067/9'],
    ['Causes of proptosis (asked with it)', 1, '2067/9'],
  ]),
  topic('proptosis', 8, 'moderate', 4, 'Proptosis / Exophthalmos', 'Proptosis', [
    ['Short note: Exophthalmos', 2, '2064 S, 2060'],
    ['Causes / DD of proptosis', 2, '2076/9, 2067/9'],
  ]),

  // ── Chapter 9: Ocular Injuries ──
  topic('chemical-injury', 9, 'high', 11, 'Chemical Injury of the Eye', 'Chemical Injury', [
    ['Early / emergency / primary management of chemical (alkali) burn', 9, '2067 S, 2065, 2065 S, 2064 S, 2063 S, 2061, 2059, 2056 S, 2055'],
    ['Short note: Chemical burn / Alkali burn of the eye', 2, '2079/8, 2060'],
    ['Ocular emergency conditions (asked with it)', 2, '2065, 2055'],
    ['Complications of alkali injury', 1, '2065 S'],
  ]),
  topic('hyphaema', 9, 'low', 2, 'Hyphaema', 'Hyphaema', [
    ['Short note: Hyphaema / Traumatic hyphaema', 2, '2063, year not printed'],
  ]),
  topic('penetrating-trauma-children', 9, 'low', 1, 'Penetrating Ocular Trauma in Children', 'Penetrating Trauma', [
    ['Clinical features', 1, '2057'],
  ]),

  // ── Chapter 10: Community Ophthalmology ──
  topic('xerophthalmia', 10, 'high', 10, 'Xerophthalmia / Vitamin A Deficiency', 'Xerophthalmia', [
    ['Clinical features / signs & symptoms', 4, '2066/9, 2063, 2061, 2056'],
    ['Treatment / management', 4, '2066/9, 2063, 2059, 2056'],
    ['WHO classification of xerophthalmia', 3, '2071/3, 2069/11, 2065 S'],
    ['Short note: Xerophthalmia', 2, '2069/11, 2060'],
    ['Causes / risk factors', 2, '2066/9, 2059'],
    ['Vitamin A distribution programme in Nepal', 1, '2065 S'],
  ]),
  topic('blindness', 10, 'moderate', 4, 'Blindness', 'Blindness', [
    ['Causes of blindness above 65 years', 1, '2067/9'],
    ['Causes of childhood blindness in Nepal', 1, '2052'],
    ['Vision 2020', 1, '2069 S'],
    ['Three blinding conditions in Nepal & how to minimise them', 1, '2056 S'],
  ]),

  // ── Chapter 11: Lens ──
  topic('cataract', 11, 'high', 11, 'Cataract & Cataract Surgery', 'Cataract', [
    ['Complications of cataract surgery (post-op ± intra-op)', 5, '2080/7, 2075/8, 2069/11, 2065 S, 2059'],
    ['Types / methods of cataract surgery', 3, '2068 S, 2066/9, 2054 S'],
    ['Types / classification of cataract (incl. morphological types of developmental cataract)', 3, '2069/11, 2068 S, 2065 S'],
    ['Etiology / aetiology', 3, '2072/8, 2071/8, 2069/11'],
    ['Clinical features', 3, '2072/8, 2071/8, 2061 S'],
    ['Management of (age-related) cataract', 2, '2072/8, 2071/8'],
    ['Asked with: causes of gradual painless loss of vision', 2, '2075/8, 2072/8'],
    ['Diagram of lens & development of lens', 1, '2061 S'],
    ['Asked with: DD of leukocoria', 1, '2071/8'],
  ]),
  topic('endophthalmitis', 11, 'low', 2, 'Endophthalmitis', 'Endophthalmitis', [
    ['Post-operative endophthalmitis — clinical features & management', 1, '2080/7'],
    ['Short note: Endophthalmitis', 1, '2078/8'],
  ]),

  // ── Chapter 12: Squint & Ocular Motility ──
  topic('amblyopia', 12, 'moderate', 6, 'Amblyopia', 'Amblyopia', [
    ['Short note: Amblyopia', 5, '2080/7, 2076/9, 2074/7, 2067 S, 2060'],
    ['Treatment of anisometropic amblyopia', 1, '2058'],
  ]),
  topic('strabismus', 12, 'moderate', 5, 'Strabismus (Squint)', 'Strabismus', [
    ['Management of strabismus — short note', 1, '2071/3'],
    ['Three major differences: paralytic vs non-paralytic squint', 1, '2058'],
    ['Role of cover test in strabismus evaluation', 1, '2065 S'],
    ['CASE: 3-yr boy with convergent squint — possible causes', 1, '2061 S'],
    ['Short note: Esotropia', 1, '2072 S'],
  ]),

  // ── Chapter 13: Lids ──
  topic('chalazion', 13, 'high', 8, 'Chalazion', 'Chalazion', [
    ['Short note: Chalazion', 8, '2075/8, 2071/8, 2067 S, 2066/9, 2063, 2063 S, 2055, 2052 S'],
  ]),
  topic('ptosis', 13, 'low', 2, 'Ptosis & Levator Palpebrae Superioris', 'Ptosis & LPS', [
    ['Ptosis — definition, classification, signs, symptoms, management', 1, '2074/7'],
    ['Short note: Levator palpebrae superioris', 1, '2053'],
  ]),

  // ── Chapter 14: Lacrimal Apparatus ──
  topic('dacryocystitis', 14, 'low', 2, 'Dacryocystitis', 'Dacryocystitis', [
    ['Acute dacryocystitis — definition, causative agents, features, management', 1, '2075/8'],
    ['Short note: Chronic dacryocystitis', 1, '2066/9'],
  ]),
  topic('lacrimal-drainage-anatomy', 14, 'low', 2, 'Lacrimal Drainage System — Anatomy', 'Lacrimal Drainage', [
    ['Anatomy (with illustration / clinical importance)', 2, '2080/7, 2054'],
  ]),
  topic('dry-eye', 14, 'low', 1, 'Dry Eye', 'Dry Eye', [['Short note', 1, '2067 S']]),

  // ── Chapter 15: Ocular Pharmacology ──
  topic('ocular-drugs', 15, 'moderate', 5, 'Ocular Drugs', 'Ocular Drugs', [
    ['Atropine — action & side effects', 2, '2079/8, 2078/8'],
    ['Corticosteroid eye drops — mechanism & adverse effects', 1, '2081/7'],
    ['Pilocarpine — mechanism, dose, indications, adverse effects', 1, '2058'],
    ['Mechanism of action of drugs used in POAG', 1, '2068 S'],
  ]),

  // ── Chapter 16: Systemic Ophthalmology & Misc ──
  topic('systemic-diseases', 16, 'moderate', 3, 'Systemic Diseases & the Eye', 'Systemic Diseases', [
    ['Ocular features of myasthenia gravis', 1, '2061'],
    ['Ocular features of rheumatoid arthritis', 1, '2061'],
    ['Ocular leprosy', 1, '2054 S'],
  ]),
  topic('age-related-changes', 16, 'low', 1, 'Age-related Changes in the Eye', 'Age-related Changes', [
    ['Short note', 1, '2071/8'],
  ]),

  // ── Chapter 17: Symptom-Based Questions ──
  topic('painful-red-eye', 17, 'vhigh', 15, 'Painful Red Eye', 'Painful Red Eye', [
    ['CASE: painful red eye with sudden diminution of vision — causes & management / approach', 6, '2068/11, 2062, 2060, 2059, 2058, 2054 S'],
    ['Causes / DD of painful red eye (with uveitis / corneal ulcer)', 5, '2076/9, 2072 S, 2071/3, 2067/9, 2061'],
    ['CASE: adult female with painful red eye — DD', 1, '2065'],
    ['Approach to painful red eye with diminution of vision', 1, '2065 S'],
    ['Differentiate uveitis from angle closure glaucoma', 1, '2065 S'],
    ['Short note: Common causes of painful loss of vision', 1, '2069/11'],
  ]),
  topic('sudden-loss-of-vision', 17, 'high', 12, 'Sudden Loss of Vision', 'Sudden Vision Loss', [
    ['CASE / approach: sudden PAINFUL loss of vision — causes, evaluation, management', 6, '2065 S, 2060, 2059, 2058, 2055, 2054 S'],
    ['Causes / DD of sudden loss of vision', 4, '2081/7, 2069/11, 2064, 2061 S'],
    ['CASE: 50-yr male, sudden PAINLESS blurring in one eye — DD', 1, '2057'],
    ['CASE: 35-yr male, sudden diminution of vision for 2 hours — approach', 1, '2067 S'],
  ]),
  topic('gradual-painless-loss', 17, 'high', 8, 'Gradual Painless Loss of Vision', 'Gradual Vision Loss', [
    ['Enumerate causes (with cataract / DR / POAG question)', 5, '2080/7, 2078/8, 2075/8, 2072/8, 2071/8'],
    ['Short note / list: Common causes', 2, '2070/4, 2068/11'],
    ['DD of gradual blurring of vision above 40 years', 1, '2061'],
  ]),
  topic('leukocoria', 17, 'moderate', 7, 'Leukocoria (White Pupillary Reflex)', 'Leukocoria', [
    ['DD of leukocoria (incl. CASE: 3-yr child)', 4, '2071/8, 2071/3, 2069/11, 2065 S'],
    ['Short note: Leukocoria in children', 2, '2059, 2055'],
    ['CASE: 2-yr child with white reflex — how to proceed', 1, '2054'],
  ]),
  topic('ocular-emergencies', 17, 'moderate', 6, 'Ocular Emergencies', 'Ocular Emergencies', [
    ['Enumerate / list common ocular emergencies (with corneal ulcer, ACG, CRVO or chemical injury)', 6, '2076/9, 2073/8, 2072/8, 2069/11, 2065, 2055'],
  ]),
];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
export const CHAPTER_BY_NO: Record<number, Chapter> = Object.fromEntries(CHAPTERS.map((c) => [c.no, c]));
export const TOTAL_TOPIC_QS = TOPICS.reduce((sum, t) => sum + t.qs, 0);

export function isSymptomTopic(t: Topic): boolean {
  return CHAPTER_BY_NO[t.chapter].symptom === true;
}
