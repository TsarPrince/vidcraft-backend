import { Application } from 'express'
import helloController from '../controllers/hello.controller'

module.exports = (app: Application) => {
  app.get('/api/', helloController.hello)
}
