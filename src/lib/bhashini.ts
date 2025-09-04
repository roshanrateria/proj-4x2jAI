export interface BhashiniResponse {
  pipelineInferenceAPIEndPoint: {
    inferenceApiKey: {
      value: string
    }
  }
}

export interface TranslationResponse {
  pipelineResponse: Array<{
    taskType: string
    config: any
    output: Array<{
      source: string
      target: string
    }>
    audio: any
  }>
}

export interface SpeechToTextResponse {
  pipelineResponse: {
    output: {
      source: string
    }
  }
}

export class BhashiniService {
  private static authToken: string | null = null
  private static readonly MAX_RETRIES = 3
  private static readonly RETRY_DELAY = 1000

  // Language mapping for Bhashini service
  private static readonly LANGUAGE_MAPPING: Record<string, string> = {
    'en': 'en',
    'hi': 'hi',
    'gu': 'gu', 
    'bn': 'bn',
    'te': 'te',
    'mr': 'mr',
    'ta': 'ta',
    'ur': 'ur',
    'pa': 'pa',
    'kn': 'kn',
    'ml': 'ml',
    'or': 'or'
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private static getBhashiniLanguageCode(languageCode: string): string {
    return this.LANGUAGE_MAPPING[languageCode] || 'en'
  }
  static async getAuthToken(): Promise<string> {
    if (this.authToken) return this.authToken

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline', {
          method: 'POST',
          headers: {
            'ulcaApiKey': process.env.NEXT_PUBLIC_BHASHINI_API_KEY || '47cb636195-a759-4b6d-8cf0-e45e6611c66b',
            'userID': process.env.NEXT_PUBLIC_BHASHINI_USER_ID || '946502c7099b4d94a172278776958005',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pipelineTasks: [
              { taskType: "asr" },
              { taskType: "translation" },
              { taskType: "tts" }
            ],
            pipelineRequestConfig: {
              pipelineId: "64392f96daac500b55c543cd"
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }        const data: BhashiniResponse = await response.json()
        console.log('Auth API Response:', JSON.stringify(data, null, 2))
        this.authToken = data.pipelineInferenceAPIEndPoint.inferenceApiKey.value
        console.log('Extracted auth token:', this.authToken)
        return this.authToken
      } catch (error) {
        console.error(`Auth attempt ${attempt + 1} failed:`, error)
        if (attempt === this.MAX_RETRIES - 1) {
          throw new Error('Failed to get Bhashini authorization after multiple attempts')
        }
        await this.delay(this.RETRY_DELAY * (attempt + 1))
      }
    }
    
    throw new Error('Failed to get Bhashini authorization')
  }
  static async translateText(
    text: string,
    sourceLanguage: string = 'en',
    targetLanguage: string = 'hi'
  ): Promise<string> {
    // Don't translate if source and target are the same
    if (sourceLanguage === targetLanguage || !text.trim()) {
      return text
    }

    // Don't translate if target is English and source is English
    if (targetLanguage === 'en' && sourceLanguage === 'en') {
      return text
    }

    const sourceLang = this.getBhashiniLanguageCode(sourceLanguage)
    const targetLang = this.getBhashiniLanguageCode(targetLanguage)

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const authToken = await this.getAuthToken()

        const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pipelineTasks: [{
              taskType: "translation",
              config: {
                language: {
                  sourceLanguage: sourceLang,
                  targetLanguage: targetLang
                },
                serviceId: "ai4bharat/indictrans-v2-all-gpu--t4"
              }
            }],
            inputData: {
              input: [{ source: text }]
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }        const data: TranslationResponse = await response.json()
        console.log('Bhashini API Response:', JSON.stringify(data, null, 2))
        
        // Extract translation from the correct response structure
        if (data?.pipelineResponse && Array.isArray(data.pipelineResponse) && data.pipelineResponse.length > 0) {
          const translationTask = data.pipelineResponse[0]
          if (translationTask?.output && Array.isArray(translationTask.output) && translationTask.output.length > 0) {
            const translationOutput = translationTask.output[0]
            if (translationOutput?.target) {
              return translationOutput.target
            }
          }
        }
        
        // Fallback: log the response structure and return original text
        console.warn('Unexpected Bhashini response structure:', data)
        return text
      } catch (error) {
        console.error(`Translation attempt ${attempt + 1} failed:`, error)
        if (attempt === this.MAX_RETRIES - 1) {
          console.error('Translation failed after multiple attempts:', error)
          return text // Return original text if all attempts fail
        }
        await this.delay(this.RETRY_DELAY * (attempt + 1))
      }
    }
    
    return text // Fallback to original text
  }
  static async speechToText(audioBase64: string, language: string = 'hi'): Promise<string> {
    const sourceLang = this.getBhashiniLanguageCode(language)
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const authToken = await this.getAuthToken()

        const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
          method: 'POST',
          headers: {
            'Accept': '*/*',
            'Authorization': authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pipelineTasks: [{
              taskType: "asr",
              config: {
                language: { sourceLanguage: sourceLang },
                serviceId: "ai4bharat/conformer-hi-gpu--t4",
                audioFormat: "flac",
                samplingRate: 16000
              }
            }],
            inputData: {
              audio: [{ audioContent: audioBase64 }]
            }
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: SpeechToTextResponse = await response.json()
        return data.pipelineResponse.output.source || ''
      } catch (error) {
        console.error(`Speech to text attempt ${attempt + 1} failed:`, error)
        if (attempt === this.MAX_RETRIES - 1) {
          console.error('Speech to text failed after multiple attempts:', error)
          return ''
        }
        await this.delay(this.RETRY_DELAY * (attempt + 1))
      }
    }
    
    return ''
  }

  // Batch translation for multiple texts
  static async translateBatch(
    texts: string[],
    sourceLanguage: string = 'en',
    targetLanguage: string = 'hi'
  ): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, sourceLanguage, targetLanguage))
    )
    return translations
  }

  // Check if a language is supported
  static isLanguageSupported(languageCode: string): boolean {
    return languageCode in this.LANGUAGE_MAPPING
  }

  // Get all supported languages
  static getSupportedLanguages(): string[] {
    return Object.keys(this.LANGUAGE_MAPPING)
  }
}
