const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function testModel(modelName) {
  try {
    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 50,
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log(`✅ ${modelName} - WORKS!`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} - ${error.status}: ${error.error?.error?.message}`);
    return false;
  }
}

(async () => {
  console.log('Testing available models...\n');
  
  const models = [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'claude-haiku-4-20250601',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229'
  ];
  
  for (const model of models) {
    await testModel(model);
  }
})();