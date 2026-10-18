import { type ConfigVariables } from 'src/engine/core-modules/twenty-config/config-variables';
import { type TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { AI_SDK_OPENAI_COMPATIBLE } from 'src/engine/metadata-modules/ai/ai-models/constants/ai-sdk-package.const';
import { type AiProvidersConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-providers-config.type';

export const getLessBusyOpenRouterProvider = (
  configuration: Pick<TwentyConfigService, 'get'>,
): AiProvidersConfig => {
  const enabled = configuration.get('LESSBUSY_AI_ENABLED');
  const model = configuration.get('OPENROUTER_MODEL')?.trim();

  if (!enabled || !model) {
    return {};
  }

  const baseUrl = new URL(configuration.get('OPENROUTER_BASE_URL'));
  if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) {
    throw new Error('OpenRouter requires an HTTPS base URL without credentials');
  }

  const price = (key: keyof Pick<ConfigVariables,
    'OPENROUTER_INPUT_COST_PER_MILLION_TOKENS' | 'OPENROUTER_OUTPUT_COST_PER_MILLION_TOKENS'
  >) => configuration.get(key);

  return {
    openrouter: {
      npm: AI_SDK_OPENAI_COMPATIBLE,
      name: 'openrouter',
      label: 'OpenRouter',
      apiKey: configuration.get('OPENROUTER_API_KEY'),
      baseUrl: baseUrl.toString().replace(/\/$/, ''),
      requestTimeoutMs: configuration.get('LESSBUSY_AI_REQUEST_TIMEOUT_MS'),
      models: [{
        name: model,
        label: model,
        maxOutputTokens: configuration.get('LESSBUSY_AI_MAX_OUTPUT_TOKENS'),
        inputCostPerMillionTokens: price('OPENROUTER_INPUT_COST_PER_MILLION_TOKENS'),
        outputCostPerMillionTokens: price('OPENROUTER_OUTPUT_COST_PER_MILLION_TOKENS'),
      }],
    },
  };
};
