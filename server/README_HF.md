Enabling Hugging Face Inference for the chatbot

This project can optionally forward chat messages to the Hugging Face Inference API to get stronger, generative responses.

How to enable

1. Create an access token at: https://huggingface.co/settings/tokens
2. Set the token in your `server/.env` file as `HF_API_KEY=<your-token>`
3. Optionally set `HF_MODEL` to the model repository id you want to use (for example `bigscience/bloom` or a smaller hosted model). If not set, the server falls back to `gpt2`.

Notes
- The server will attempt to call Hugging Face and fall back to the local NLP engine if the call fails.
- Keep your HF token secret. Do not commit `server/.env` to source control.
- The Inference API may have usage limits depending on your account and the model used.

Example `.env` entries:

HF_API_KEY=hf_xxx
HF_MODEL=bigscience/bloom

If you need streaming responses or higher-volume usage, consider deploying a larger model or a dedicated inference endpoint and adapting the code in `server/src/index.js`.
