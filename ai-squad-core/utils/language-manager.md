# Language Manager Utility

## Purpose

This utility provides language management functionality for AI-SQUAD agents to support Human-in-the-Loop (HITL) interactions in multiple languages.

## Configuration

Language settings are defined in `core-config.yaml` under the `language` section:

```yaml
language:
  default: en # Default language code
  hitlMode: adaptive # adaptive, strict, or bilingual
  fallbackToEnglish: true # Whether to fall back to English if target language fails
  supportedLanguages: # List of supported language codes
    - en # English
    - es # Spanish
    - pt # Portuguese
    - fr # French
    - de # German
    - it # Italian
    - zh-cn # Chinese Simplified
    - ja # Japanese
    - ko # Korean
    - ru # Russian
    - ar # Arabic
```

## Language Modes

### Adaptive Mode (Recommended)

- Detects user's language from input
- Responds in the same language when possible
- Falls back to English for complex technical terms
- Best for mixed-language environments

### Strict Mode

- Uses only the configured default language
- Maintains consistency across all interactions
- Best for team environments with shared language

### Bilingual Mode

- Provides responses in both default language and English
- Useful for learning environments
- Ensures accessibility while supporting localization

## Language Codes

| Code  | Language           | Native Name |
| ----- | ------------------ | ----------- |
| en    | English            | English     |
| es    | Spanish            | Español     |
| pt    | Portuguese         | Português   |
| fr    | French             | Français    |
| de    | German             | Deutsch     |
| it    | Italian            | Italiano    |
| zh-cn | Chinese Simplified | 简体中文    |
| ja    | Japanese           | 日本語      |
| ko    | Korean             | 한국어      |
| ru    | Russian            | Русский     |
| ar    | Arabic             | العربية     |

## Agent Integration

Agents should include language directives in their YAML configuration:

```yaml
language-directives:
  - "Respond in the user's preferred language when possible"
  - "Use technical terms in English with local language explanations"
  - "For code comments and documentation, follow language preferences"
  - "If uncertain about language, ask the user for clarification"
  - "Maintain professional tone regardless of language"
```

## Usage Instructions

### For Agent Developers

1. **Check Language Configuration**: Always reference the language settings from core-config.yaml
2. **Detect User Language**: Analyze user input to determine preferred language
3. **Adapt Response Style**: Adjust communication style based on language and culture
4. **Provide Fallbacks**: Always have English fallbacks for technical terms
5. **Be Culturally Aware**: Consider cultural context in communication style

### For Users

1. **Set Default Language**: Configure your preferred language in core-config.yaml
2. **Use Language Commands**: Use `*lang [code]` to change language during interaction
3. **Mixed Language Support**: Feel free to mix languages - agents will adapt
4. **Technical Terms**: Expect some technical terms to remain in English for clarity

## Language Command Implementation

Agents should support the following language commands:

- `*lang` - Show current language and available options
- `*lang [code]` - Switch to specified language
- `*lang auto` - Enable automatic language detection
- `*lang reset` - Reset to default language from configuration

## Best Practices

### Communication Guidelines

1. **Clarity Over Translation**: Use English for technical terms when necessary
2. **Cultural Sensitivity**: Adapt communication style to cultural context
3. **Consistent Terminology**: Maintain consistent technical vocabulary
4. **Professional Tone**: Keep professional tone regardless of language
5. **Error Handling**: Gracefully handle language-related errors

### Technical Implementation

1. **Lazy Loading**: Load language resources only when needed
2. **Graceful Degradation**: Fall back to English if translation fails
3. **Context Preservation**: Maintain context when switching languages
4. **Performance**: Cache common translations for better performance
5. **Accessibility**: Ensure language features don't hinder accessibility

## Localization Notes

### Technical Documentation

- Code examples remain in English
- Comments can be localized
- Variable names stay in English
- Error messages should be localized

### User Interface Elements

- Button labels and menus should be localized
- Help text should be in user's language
- Status messages should be localized
- Progress indicators should use local formats

### Cultural Considerations

- Date/time formats vary by locale
- Number formats differ between cultures
- Address formats are region-specific
- Color meanings vary across cultures

## Agent Name Localization

### Overview

AI-SQUAD supports localized agent names to provide culturally appropriate interactions. Each agent has a set of names in different languages that maintain cultural sensitivity while preserving the agent's professional identity.

### Agent Name Mapping

Agent names are configured in `core-config.yaml` under `language.agentNames`:

```yaml
language:
  agentNames:
    analyst:
      en: Mary # English
      es: María # Spanish
      pt: Maria # Portuguese
      fr: Marie # French
      de: Maria # German
      it: Maria # Italian
      zh-cn: 美丽 # Chinese Simplified
      ja: 美里 # Japanese
      ko: 마리아 # Korean
      ru: Мария # Russian
      ar: مريم # Arabic
    # ... other agents
```

### Name Resolution Logic

Agents should resolve their localized names using this priority order:

1. **Language-specific name**: Use the name from `agentNames.[agent-id].[language-code]`
2. **English fallback**: If language-specific name not found, use English name
3. **Default fallback**: If neither found, use the original `agent.name` field

### Implementation Pattern

```yaml
language-directives:
  - "Load your localized name from core-config.yaml agentNames.[agent-id] based on current language"
  - "Introduce yourself using your localized name (e.g., María in Spanish, 美丽 in Chinese)"
  - "Respect user's language preferences and adapt all interactions accordingly"
  - "Use English for technical terms with explanations in user's language"
  - "Adapt communication style to be culturally appropriate while maintaining professionalism"
```

### Localized Agent Names by Role

| Agent ID  | Role             | English | Spanish | Portuguese | French  | German | Italian  | Chinese | Japanese | Korean | Russian | Arabic |
| --------- | ---------------- | ------- | ------- | ---------- | ------- | ------ | -------- | ------- | -------- | ------ | ------- | ------ |
| analyst   | Business Analyst | Mary    | María   | Maria      | Marie   | Maria  | Maria    | 美丽    | 美里     | 마리아 | Мария   | مريم   |
| architect | System Architect | Winston | Víctor  | Victor     | Victor  | Viktor | Vittorio | 伟强    | 勝       | 승현   | Виктор  | وليد   |
| dev       | Developer        | James   | Diego   | João       | Antoine | Stefan | Marco    | 建华    | 拓海     | 준호   | Дмитрий | أحمد   |
| pm        | Product Manager  | John    | Carlos  | Pedro      | Pierre  | Hans   | Giovanni | 志强    | 健太     | 민수   | Иван    | كريم   |
| po        | Product Owner    | Sarah   | Ana     | Ana        | Sophie  | Anna   | Anna     | 安娜    | 恵美     | 수연   | Анна    | سارة   |
| qa        | QA Engineer      | Quinn   | Alex    | Alex       | Alex    | Alex   | Alex     | 志杰    | 翔太     | 현우   | Алекс   | عماد   |
| sm        | Scrum Master     | Bob     | Roberto | Roberto    | Robert  | Robert | Roberto  | 博文    | 博       | 성민   | Роберт  | روبرت  |
| ux-expert | UX Designer      | Sally   | Sofía   | Sofia      | Camille | Sophie | Sofia    | 思雅    | 美咲     | 지은   | София   | صوفيا  |

**Note**: Meta agents (AI-SQUAD Master, AI-SQUAD Orchestrator) maintain their technical names across all languages.

### Cultural Considerations for Names

#### Name Selection Criteria

- **Professional Sound**: Names chosen to sound professional in business contexts
- **Cultural Appropriateness**: Names that are common and well-accepted in each culture
- **Easy Pronunciation**: Names that are relatively easy for AI agents to use consistently
- **Gender Considerations**: Balanced representation where culturally appropriate

#### Regional Variations

- **Chinese Names**: Traditional meanings - 美丽 (Beautiful), 伟强 (Great Strength), 建华 (Build China)
- **Arabic Names**: Classic names with positive meanings
- **European Languages**: Common professional names that translate well across cultures
- **Asian Languages**: Names that sound natural for business interactions

### Greeting Templates

Agents should adapt their greetings based on their localized names:

**English**: "Hello! I'm Mary, your Business Analyst."
**Spanish**: "¡Hola! Soy María, tu Analista de Negocios."
**Portuguese**: "Olá! Sou Maria, sua Analista de Negócios."
**French**: "Bonjour! Je suis Marie, votre Analyste Métier."
**German**: "Hallo! Ich bin Maria, Ihre Geschäftsanalystin."
**Chinese**: "你好！我是美丽，您的业务分析师。"
**Japanese**: "こんにちは！美里です、ビジネスアナリストです。"

### Implementation Example

```yaml
# In agent YAML header
language-settings:
  respectUserLanguage: true
  technicalTermsInEnglish: true
  fallbackLanguage: en
  cultureAware: true
  useLocalizedName: true

startup-instructions:
  - Check core-config.yaml for language preferences
  - Load localized name based on user's language
  - Detect user language from initial input
  - Set communication language accordingly
  - Introduce yourself with your localized name
  - Inform user of language capabilities if asked
```

## Future Enhancements

1. **Machine Translation Integration**: Support for additional languages via translation APIs
2. **Voice Language Detection**: Support for voice-based language detection
3. **Regional Variants**: Support for regional language variants (en-US, en-GB, etc.)
4. **Custom Terminology**: User-defined technical term translations
5. **Team Language Profiles**: Shared language settings for team collaboration
