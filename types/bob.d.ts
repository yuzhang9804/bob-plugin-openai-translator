declare namespace Bob {
  interface TranslateQuery {
    detectFrom: string
    detectTo: string
    text: string
    // ... 其他属性 ...
  }

  type Completion = (result: {
    error?: {
      type: string
      message: string
      addtion: string
    }
    result?: {
      from: string
      to: string
      toParagraphs: string[]
    }
  }) => void

  interface HttpResponse {
    response: {
      statusCode: number
    }
    data: {
      error?: {
        message: string
      }
      choices?: {
        message: {
          content: string
        }
      }[]
    }
    // ... 其他属性 ...
  }
}
