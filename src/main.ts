import { SYSTEM_PROMPT } from './const'
import { langMap, supportLanguageList } from './lang'
import type { ChatCompletion } from './types'
import type { HttpResponse, TextTranslate, TextTranslateQuery } from '@bob-translate/types'
import { handleGeneralError } from './utils'

const generatePrompts = (
  query: TextTranslateQuery
): {
  generatedSystemPrompt: string
  generatedUserPrompt: string
} => {
  let generatedSystemPrompt = null
  const { detectFrom, detectTo } = query
  const sourceLang = langMap.get(detectFrom) || detectFrom
  const targetLang = langMap.get(detectTo) || detectTo
  let generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}`

  if (detectTo === 'wyw' || detectTo === 'yue') {
    generatedUserPrompt = `翻译成${targetLang}`
  }

  if (detectFrom === 'wyw' || detectFrom === 'zh-Hans' || detectFrom === 'zh-Hant') {
    if (detectTo === 'zh-Hant') {
      generatedUserPrompt = '翻译成繁体白话文'
    } else if (detectTo === 'zh-Hans') {
      generatedUserPrompt = '翻译成简体白话文'
    } else if (detectTo === 'yue') {
      generatedUserPrompt = '翻译成粤语白话文'
    }
  }
  if (detectFrom === detectTo) {
    generatedSystemPrompt = "You are a text embellisher, you can only embellish the text, don't interpret it."
    if (detectTo === 'zh-Hant' || detectTo === 'zh-Hans') {
      generatedUserPrompt = '润色此句'
    } else {
      generatedUserPrompt = 'polish this sentence'
    }
  }

  generatedUserPrompt = `${generatedUserPrompt}:\n\n${query.text}`

  return {
    generatedSystemPrompt: generatedSystemPrompt ?? SYSTEM_PROMPT,
    generatedUserPrompt,
  }
}

const handleGeneralResponse = (query: TextTranslateQuery, result: HttpResponse<ChatCompletion>) => {
  const { choices } = result.data as ChatCompletion

  $log.info(result)

  if (!choices || choices.length === 0) {
    handleGeneralError(query, {
      type: 'api',
      message: '接口未返回结果',
      addition: JSON.stringify(result),
    })
    return
  }

  let targetText = choices[0].message.content?.trim()

  // 使用正则表达式删除字符串开头和结尾的特殊字符
  targetText = targetText?.replace(/^(『|「|"|“)|(』|」|"|”)$/g, '')

  // 判断并删除字符串末尾的 `" =>`
  if (targetText?.endsWith('" =>')) {
    targetText = targetText.slice(0, -4)
  }

  query.onCompletion({
    result: {
      from: query.detectFrom,
      to: query.detectTo,
      toParagraphs: targetText!.split('\n'),
    },
  })
}

const translate: TextTranslate = (query) => {
  if (!langMap.get(query.detectTo)) {
    handleGeneralError(query, {
      type: 'unsupportedLanguage',
      message: '不支持该语种',
      addition: '不支持该语种',
    })
  }

  const { apiKey, model } = $option

  if (!apiKey) {
    handleGeneralError(query, {
      type: 'secretKey',
      message: '配置错误 - 请确保您在插件配置中填入了正确的 API Key',
      addition: '请在插件配置中填写 API Key',
    })
  }

  const baseUrl = 'https://api.deepseek.com'
  const apiUrlPath = '/chat/completions'

  const header = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  const { generatedSystemPrompt, generatedUserPrompt } = generatePrompts(query)
  const body = {
    model: model,
    messages: [
      { role: 'system', content: generatedSystemPrompt },
      {
        role: 'user',
        content: generatedUserPrompt,
      },
    ],
  }

  ;(async () => {
    const result = await $http.request({
      method: 'POST',
      url: baseUrl + apiUrlPath,
      header,
      body,
    })
    $log.info(result)

    if (result.error) {
      handleGeneralError(query, result)
    } else {
      handleGeneralResponse(query, result)
    }
  })().catch((error) => {
    handleGeneralError(query, error)
  })
}

const pluginTimeoutInterval = () => 60

function supportLanguages() {
  return supportLanguageList.map(([standardLang]) => standardLang)
}

export { pluginTimeoutInterval, supportLanguages, translate }
