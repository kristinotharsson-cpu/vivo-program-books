# Audit Prompt — Run This First

Paste this into your Cowork session before changing anything in the parser. The answers tell us whether to refine what's built or replace it entirely.

---

Before we change anything in the PDF import flow, I need a quick audit. Don't modify any code — just answer these questions in plain language:

1. **What model does the current PDF parser call?** (e.g. Claude Opus, Claude Sonnet, Claude Haiku, GPT-4, Gemini, etc.) Check the API call code and tell me the exact model string being used.

2. **How many API calls happen per PDF parsed?** One call per program? One per page? More than that? Walk me through the flow.

3. **Is the input being sent as text or as images?** If the PDF is being sent as vision input (page images), tell me. If text is being extracted first and only the text is sent, tell me that too.

4. **Show me the system prompt being used for parsing** — paste it verbatim.

5. **Does the prompt include any few-shot examples?** Specifically, is it referencing the four sample JSONs in `samples/` (dance_program.json, voice_program.json, orchestra_program.json, classical_program.json) as worked examples?

6. **What's the retry logic when parsing fails or returns invalid JSON?** Does it retry the same call? Does it fall back to a different model? Does it just fail?

7. **Token counts:** roughly how many input tokens per parse? How many output tokens? You can check this by counting characters in a typical extracted PDF, or by looking at any usage logs if they exist.

8. **What's the most common failure mode in the output?** Wrong schema? Missing fields? Hallucinated content? Truncated output? Be specific.

9. **Is there any cost logging or token-usage tracking?** If so, what's the per-program cost been so far?

Don't fix anything, don't refactor anything. Just give me the answers. I'll decide what to do next based on what you find.
