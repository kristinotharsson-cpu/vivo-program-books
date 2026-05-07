# Few-shot input texts

The parser injects `dance` and `voice` examples as conversation turns before the real PDF text. The assistant turns are loaded from `samples/dance_program.json` and `samples/voice_program.json` (the canonical hand-written outputs). The user turns should be the *raw extracted text* from the corresponding PDFs — what the model would actually receive at runtime.

To populate:

1. Run the same client-side PDF.js text-extraction pass we use in production against `samples/dancesample` and `samples/voice.pdf`.
2. Save the extracted text to:
   - `parser-package/fewshot/dance_input.txt`
   - `parser-package/fewshot/voice_input.txt`
3. Redeploy.

Until those files exist, the loader falls back to a placeholder marker. The model still benefits from the JSON shape in the assistant turn, but example fidelity is weaker.
