import {
  ExtractionSchema,
  SaveSchema,
  formatZodErrors,
} from "../lib/schema.js";

const completeSample = {
  is_research_paper: true,
  title: "Transformer Models for Sentiment Analysis",
  authors: ["Asha Rao", "Daniel Lee"],
  publication_year: 2023,
  research_question: "How effectively do transformer models classify sentiment?",
  claims: [
    "Transformer models improve sentiment classification accuracy.",
    "Fine-tuning produces stronger results than fixed embeddings.",
  ],
  methods: ["Transformer fine-tuning", "Sentiment benchmark evaluation"],
  limitations: ["The study evaluates only English-language datasets."],
  keywords: ["transformers", "sentiment analysis", "fine-tuning", "NLP"],
  missing_fields: [],
};

let allPassed = true;

const testOne = ExtractionSchema.safeParse(completeSample);
if (testOne.success) {
  console.log("PASS Test 1: complete sample accepted");
} else {
  allPassed = false;
  console.log("FAIL Test 1:", formatZodErrors(testOne.error));
}

const invalidYearSample = {
  ...completeSample,
  publication_year: "2023",
};
const testTwo = ExtractionSchema.safeParse(invalidYearSample);
if (!testTwo.success) {
  console.log("PASS Test 2: string publication_year rejected");
  console.log(formatZodErrors(testTwo.error));
} else {
  allPassed = false;
  console.log("FAIL Test 2: string publication_year was accepted");
}

const invalidSaveSample = {
  title: null,
  authors: ["Asha Rao"],
  publication_year: 2023,
  research_question: null,
  claims: [],
  methods: [],
  limitations: [],
  keywords: [],
  missing_fields: ["title", "claims"],
  source_type: "pdf",
  source_name: "test.pdf",
};
const testThree = SaveSchema.safeParse(invalidSaveSample);
if (!testThree.success) {
  console.log("PASS Test 3: invalid save sample rejected");
  console.log(formatZodErrors(testThree.error));
} else {
  allPassed = false;
  console.log("FAIL Test 3: invalid save sample was accepted");
}

console.log(allPassed ? "ALL SCHEMA TESTS PASSED" : "SOME TESTS FAILED");
