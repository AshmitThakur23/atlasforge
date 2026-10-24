const endpoint = "http://localhost:3000/api/extract";
let allPassed = true;

async function runTest(name, formData, expectedStatus, printResult) {
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });
  const body = await response.json();
  const passed = response.status === expectedStatus;
  console.log(`${passed ? "PASS" : "FAIL"} ${name}: HTTP ${response.status}`);
  printResult(body);
  if (!passed) {
    allPassed = false;
  }
}

const abstract = `Transformer Models for Evidence-Based Sentiment Analysis
Authors: Maya Patel and Julian Chen
Published: 2024
Objective: This study investigates whether transformer models can improve sentiment classification for short customer reviews while preserving reliable explanations.
Method: The researchers trained a RoBERTa model on the 50,000-review Sentiment140 dataset and compared it with a logistic regression baseline using standard text preprocessing.
Finding one: RoBERTa achieved higher macro-F1 than the baseline across positive, neutral, and negative classes.
Finding two: Explanation scores were most reliable when the model confidence exceeded 0.8.
The authors state one limitation: the dataset contains informal English reviews and may not represent multilingual or domain-specific writing.
These results suggest that transformer-based classifiers can support scalable review analysis when confidence and explanation quality are evaluated together.`;

const validForm = new FormData();
validForm.set("text", abstract);
await runTest("Test A", validForm, 200, (body) => {
  if (body.ok) {
    console.log({
      title: body.data.title,
      claims: body.data.claims.length,
      keywords: body.data.keywords,
      missing_fields: body.data.missing_fields,
      can_save: body.can_save,
    });
  } else {
    console.log(body.error);
  }
});

const emptyForm = new FormData();
emptyForm.set("text", "");
await runTest("Test B", emptyForm, 400, (body) => {
  console.log(body.error);
});

const recipe = `Chocolate Cake Recipe
Ingredients: combine two cups of flour, one and three-quarter cups of sugar, three-quarters of a cup of cocoa powder, two eggs, one cup of milk, half a cup of vegetable oil, two teaspoons of baking powder, one teaspoon of vanilla, and one cup of hot water. Preheat the oven to 180 degrees Celsius. Grease and line a round cake pan. Whisk the flour, sugar, cocoa, and baking powder in a bowl. Add eggs, milk, oil, and vanilla, then beat until smooth. Carefully stir in hot water. Pour the batter into the pan and bake for thirty-five to forty minutes. Cool completely before removing the cake. For frosting, melt chocolate with butter, spread it over the cooled cake, and decorate with chocolate shavings. Store covered at room temperature and serve in slices with tea or coffee.`;
const recipeForm = new FormData();
recipeForm.set("text", recipe);
await runTest("Test C", recipeForm, 422, (body) => {
  console.log(body.error);
});

console.log(allPassed ? "ALL EXTRACT TESTS PASSED" : "SOME TESTS FAILED");
