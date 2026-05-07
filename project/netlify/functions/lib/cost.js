// Anthropic pricing as of 2026-05. Update if rates change.
// https://www.anthropic.com/pricing
const PRICING = {
  "claude-haiku-4-5-20251001": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  "claude-sonnet-4-6":         { inputPerMTok: 3.0, outputPerMTok: 15.0 },
};

function priceFor(model, usage) {
  const rate = PRICING[model];
  if (!rate || !usage) return 0;
  const inTok = usage.input_tokens || 0;
  const outTok = usage.output_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  // Cache reads are 0.1x input, cache writes 1.25x. Standard input billed at 1x.
  const inCost = (inTok * rate.inputPerMTok + cacheWrite * rate.inputPerMTok * 1.25 + cacheRead * rate.inputPerMTok * 0.1) / 1e6;
  const outCost = (outTok * rate.outputPerMTok) / 1e6;
  return inCost + outCost;
}

function summarize(calls) {
  let inTok = 0, outTok = 0, cost = 0;
  for (const c of calls) {
    inTok += c.usage?.input_tokens || 0;
    outTok += c.usage?.output_tokens || 0;
    cost += c.cost || 0;
  }
  return { inputTokens: inTok, outputTokens: outTok, costUsd: Number(cost.toFixed(4)), calls: calls.length };
}

module.exports = { priceFor, summarize, PRICING };
