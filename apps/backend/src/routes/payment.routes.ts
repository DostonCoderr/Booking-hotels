import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { 
  getPaymentMethods,
  createPaymentIntent,  // changed from createSetupIntent
  savePaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentIntent
} from '../controllers/payment.controller'

const router = Router()

router.use(authMiddleware)

router.get('/methods', getPaymentMethods)
router.post('/create-payment-intent', createPaymentIntent)  // changed endpoint
router.post('/save-method', savePaymentMethod)
router.delete('/methods/:id', deletePaymentMethod)
router.put('/methods/:id/default', setDefaultPaymentMethod)
router.get('/intent/:id', getPaymentIntent)

export default router