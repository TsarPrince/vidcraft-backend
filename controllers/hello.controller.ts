import { Request, Response } from 'express'

const hello = (_: Request, res: Response) => {
  res.json({ message: 'Hello from vidcraft backend!' })
}

export default {
  hello
}