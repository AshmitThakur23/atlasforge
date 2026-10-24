const endpoint = "http://localhost:3000";
let allPassed = true;

const data = {
  title: "TEST - Transformer Models for Sentiment Analysis",
  authors: ["A. Sharma", "R. Verma"],
  publication_year: 2024,
  research_question: "Can transformer models improve sentiment classification?",
  claims: ["RoBERTa outperformed LSTM baselines by 6% accuracy."],
  methods: ["Fine-tuned RoBERTa on Sentiment140"],
  limitations: ["Tested only on English text."],
  keywords: ["transformers", "sentiment analysis", "roberta"],
  missing_fields: [],
};

async function postSave(body) {
  return fetch(`${endpoint}/api/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validResponse = await postSave({
  data,
  source: { type: "text", name: null },
});
const validBody = await validResponse.json();
if (validResponse.status === 201) {
  console.log("PASS Test 1:", validBody.record.id, validBody.record.title);
} else {
  allPassed = false;
  console.log("FAIL Test 1:", validBody);
}

const incompleteResponse = await postSave({
  data: { ...data, title: null, claims: [] },
  source: { type: "text", name: null },
});
const incompleteBody = await incompleteResponse.json();
if (incompleteResponse.status === 422) {
  console.log("PASS Test 2:", incompleteBody.error, incompleteBody.details);
} else {
  allPassed = false;
  console.log("FAIL Test 2:", incompleteBody);
}

const listResponse = await fetch(`${endpoint}/api/papers`);
const listBody = await listResponse.json();
if (listResponse.status === 200 && listBody.count >= 1) {
  console.log("PASS Test 3:", listBody.count, listBody.papers[0]?.title);
} else {
  allPassed = false;
  console.log("FAIL Test 3:", listBody);
}

console.log(allPassed ? "ALL SAVE TESTS PASSED" : "SOME TESTS FAILED");
