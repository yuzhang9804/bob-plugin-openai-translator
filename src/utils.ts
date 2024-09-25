import type { HttpResponse, ServiceError, TextTranslateQuery } from '@bob-translate/types'
import { HTTP_ERROR_CODES } from './const'

function handleGeneralError(query: TextTranslateQuery, error: ServiceError | HttpResponse) {
  if ('response' in error) {
    // Handle HTTP response error
    const { statusCode } = error.response
    const reason = statusCode >= 400 && statusCode < 500 ? 'param' : 'api'
    query.onCompletion({
      error: {
        type: reason,
        message: `接口响应错误 - ${HTTP_ERROR_CODES[statusCode]}`,
        addition: `${JSON.stringify(error)}`,
      },
    })
  } else {
    // Handle general error
    query.onCompletion({
      error: {
        ...error,
        type: error.type || 'unknown',
        message: error.message || 'Unknown error',
      },
    })
  }
}

export { handleGeneralError }
