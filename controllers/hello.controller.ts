import { Request, Response } from 'express'

import ApiResponse from '../types/Response.type'

const hello = (_: Request, res: Response) => {
  const json: ApiResponse = {
    message: 'Hello from vidcraft backend!',
    data: null,
    error: null
  }
  res.json(json)
}

export default {
  hello
}